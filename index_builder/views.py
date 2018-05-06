from flask import (Blueprint, render_template, request, jsonify, session, redirect, current_app as app, flash)
import json
import os
import re
from datetime import datetime, timedelta
import subprocess
from pympler.asizeof import asizeof
from pympler.util import stringutils
from operator import itemgetter
import yaml
from collections import defaultdict
import traceback

import cache
import utils as utils
import model as model
import auth as auth

logger = utils.get_logger()

index_builder = Blueprint('index_builder', __name__, url_prefix='/index-builder')


def startup(path):
    logger.info('pytest: {}, flask: {}, gunicorn: {}'.format(
        utils.running_with_pytest(), utils.running_with_flask(), utils.running_with_gunicorn())
    )
    # when running flask in debug it spins up two instances, we only want this code
    # run during startup of the second instance
    if not utils.running_with_pytest() and (utils.running_with_flask() or utils.running_with_gunicorn()):
        load_gics_mappings()
        load_factors(path)
        load_indexes(path)
        pass


@index_builder.route('/force-refresh')
def refresh_cached_data():
    cache.clear_all_caches()

    load_factors(app.config['DATA_PATH'])
    load_indexes(app.config['DATA_PATH'])
    load_gics_mappings()

    return jsonify(results=[])


@index_builder.route('/clear-cache')
def clear_cache():
    cache_name = utils.get_str_arg(request, 'cache')
    if cache_name:
        cache.clear_cache(cache_name)
    return jsonify(results=[])


@cache.custom_memoize(cache.GICS_CACHE)
def load_gics_mappings():
    logger.info('caching gics mappings...')
    with open(os.path.join(os.path.dirname(__file__), 'data', 'gics_mappings.yaml')) as f:
        return yaml.load(f)


@index_builder.route('/gics-mappings')
def get_gics_mappings():
    return jsonify(dict(mappings=load_gics_mappings()))


def process_uptime(pid=os.getpid()):
    # Based on https://gist.github.com/westhood/1073585
    p = re.compile(r"^btime (\d+)$", re.MULTILINE)
    with open("/proc/stat") as f:
        m = p.search(f.read())
    btime = int(m.groups()[0])
    
    clk_tck = os.sysconf(os.sysconf_names["SC_CLK_TCK"])
    with open("/proc/%d/stat" % pid) as f:
        stime = int(f.read().split()[21]) / clk_tck

    return datetime.now() - datetime.fromtimestamp(btime + stime)


def system_uptime():
    with open('/proc/uptime', 'r') as f:
        uptime_seconds = float(f.readline().split()[0])
        return timedelta(seconds=uptime_seconds)


def cache_info():

    def _process_cache(c):
        items = []
        for k in c._cache.keys():
            expiration, insert_time, data = c._cache[k]
            size = stringutils.pp(asizeof(data))
            item = {
                'key': ', '.join(filter(None, (k or [[]])[0] or [])), 'expiration': expiration,
                'saved': insert_time, 'size': size
            }
            items.append(item)

        return {
            'total_size': stringutils.pp(asizeof(c._cache)),
            'total_items': len(c._cache),
            'items': items
        }

    caches = [
        ('FACTOR_CACHE', cache.FACTOR_CACHE),
        ('INDEXES_CACHE', cache.INDEXES_CACHE),
        ('GICS_CACHE', cache.GICS_CACHE),
    ]
    caches = {name: _process_cache(c) for name, c in caches}
    return caches


@index_builder.route('/debug')
@auth.requires_auth
def display_debug():
    commit_message = subprocess.check_output('git log -1', shell=True)

    commit_message = re.sub(
        r'commit ([a-z0-9]+)',
        r'commit <a href="https://github.com/aschonfeld/index_builder/commits/\1">\1</a>',
        commit_message)

    caches = cache_info()
    return render_template(
        'index_builder/debug.html',
        commit_message=commit_message,
        process_uptime=process_uptime(),
        system_uptime=system_uptime(),
        environ=os.environ,
        wsgi_settings=dict(request.environ),
        page='debug',
        caches=caches,
        users=list(utils.get_all_user_factor_settings(locked=False, include_last_update=True))
    )


@cache.custom_memoize(cache.FACTOR_CACHE)
def load_factors(path):
    return model.load_factors(path)


def get_factors():
    return load_factors(app.config['DATA_PATH'])


@cache.custom_memoize(cache.INDEXES_CACHE)
def load_indexes(path):
    return model.load_indexes(path)


def get_indexes():
    return load_indexes(app.config['DATA_PATH'])


@index_builder.route('/factor-options')
def find_factor_options():
    factor_data = get_factors()
    return jsonify(sorted(
        [dict(id=k, label=v['label'], description=v['description']) for k, v in factor_data.items()],
        key=lambda f: int(f['id'].split('_')[-1])
    ))


@index_builder.route('/factor-data')
def find_factor_data():
    factor_id = utils.get_str_arg(request, 'factor')
    factor_data = get_factors().get(factor_id, {})
    return jsonify(factor_data)


@index_builder.route('/load-factor-settings')
def load_factor_settings():
    return jsonify(session.get('factor_settings', {}))


@index_builder.route('/save-factor-settings')
def save_factor_settings():
    try:
        user = session.get('username')
        factor_settings = utils.get_str_arg(request, 'factor_settings')
        factor_settings = json.loads(factor_settings) if factor_settings else {}
        session['factor_settings'] = dict(factors=factor_settings, locked=False)
        utils.dump_factor_settings(user, session['factor_settings'])
        return jsonify(session['factor_settings'])
    except Exception as ex:
        logger.info(ex)
        return jsonify(dict(error=str(ex), traceback=str(traceback.format_exc())))


@index_builder.route('/lock-factor-settings')
def lock_factor_settings():
    try:
        user = session.get('username')
        total_weight = sum(map(lambda x: x.get('weight', 0), session.get('factor_settings', {}).get('factors', {}).values()))
        if total_weight < 100:
            flash("Your total weights are less than 100!")
            return redirect(request.referrer)
        session['factor_settings'] = utils.dict_merge(session['factor_settings'], dict(locked=True))
        utils.dump_factor_settings(user, session['factor_settings'])
        return redirect(request.referrer)
    except Exception as ex:
        logger.info(ex)
        return jsonify(dict(error=str(ex), traceback=str(traceback.format_exc())))


@index_builder.route('/unlock-factor-settings')
def unlock_factor_settings():
    try:
        user = utils.get_str_arg(request, 'user')
        factor_settings = utils.get_factor_settings(user)
        factor_settings['locked'] = False
        utils.dump_factor_settings(user, factor_settings)
        return jsonify(utils.dict_merge(utils.get_user_counts(), dict(success=True)))
    except Exception as ex:
        logger.info(ex)
        return jsonify(dict(error=str(ex), traceback=str(traceback.format_exc())))


@index_builder.route('/unlock-summary')
def unlock_summary():
    try:
        utils.dump_app_settings(utils.dict_merge(utils.get_app_settings(), dict(summary_viewable=True)))
        return redirect('/index-builder/summary')
    except Exception as ex:
        logger.info(ex)
        return jsonify(dict(error=str(ex), traceback=str(traceback.format_exc())))


@index_builder.route('/lock-summary')
def lock_summary():
    try:
        utils.dump_app_settings(utils.dict_merge(utils.get_app_settings(), dict(summary_viewable=False)))
        return redirect('/index-builder/summary')
    except Exception as ex:
        logger.info(ex)
        return jsonify(dict(error=str(ex), traceback=str(traceback.format_exc())))


@index_builder.route('/archive-user-settings')
def archive_user_settings():
    try:
        utils.archive_all_user_factor_settings()
        return jsonify(dict(success=True))
    except Exception as ex:
        logger.info(ex)
        return jsonify(dict(error=str(ex), traceback=str(traceback.format_exc())))


@index_builder.route('/sample-indexes')
def find_sample_indexes():
    try:
        indices = get_indexes()
        samples = dict(
            stats={k: v for k, v in indices['stats'].items() if k in model.SAMPLE_INDEXES},
            returns=dict(excess={}, annualized={}),
            sectors={},
            barra={}
        )
        for ret_type in ['excess', 'annualized']:
            for sample in model.SAMPLE_INDEXES:
                sample_rets = indices['returns'][ret_type][sample]
                sample_rets.name = 'val'
                sample_rets.index.name = 'date'
                samples['returns'][ret_type][sample] = sample_rets.reset_index().to_dict(orient='records')

        for sample in model.SAMPLE_INDEXES:
            for key, df in {key: df for key, df in indices.items() if key in ['sectors', 'barra']}.items():
                if sample in df.columns:
                    samples[key][sample] = {
                        k: g.to_dict(orient='records')
                        for k, g in df[['name', 'date', sample]].rename(columns={sample: 'val'}).groupby('name')
                    }

        return jsonify(samples)
    except Exception as ex:
        logger.info(ex)
        return jsonify(dict(error=str(ex), traceback=str(traceback.format_exc())))


@index_builder.route('/results-stats')
def find_results_stats():
    try:
        archive = utils.get_str_arg(request, 'archive')
        current_user = session.get('username')
        is_admin = current_user == 'admin'
        indices = get_indexes()
        factors = get_factors()
        user_settings = {
            user: factor_settings
            for user, factor_settings in utils.get_all_user_factor_settings(locked=False if is_admin else True, archive=archive)
        }
        unlocked = [user for user, settings in user_settings.items() if not settings['locked']]
        user_settings = {user: settings.get('factors', {}) for user, settings in user_settings.items() if settings['locked']}
        user_results = {
            user: dict(stats=model.load_results_stats(factors, indices, factor_settings))
            for user, factor_settings in user_settings.items()
        }
        for user, result in user_results.items():
            if is_admin:
                result['stats']['unlockable'] = True

        results = dict(
            users=user_results,
            samples=dict(
                stats={k: v for k, v in indices['stats'].items() if k in model.SAMPLE_INDEXES},
            ),
            unlocked=unlocked,
            archives=utils.find_available_archives() if is_admin else []
        )
        return jsonify(results)
    except Exception as ex:
        logger.info(ex)
        return jsonify(dict(error=str(ex), traceback=str(traceback.format_exc())))


@index_builder.route('/user-results')
def find_user_results():
    try:
        archive = utils.get_str_arg(request, 'archive')
        user = utils.get_str_arg(request, 'user')
        indices = get_indexes()
        factors = get_factors()
        factor_settings = utils.get_factor_settings(user, archive=archive)
        results = model.load_user_results(factors, indices, factor_settings.get('factors', {}))
        return jsonify(results)
    except Exception as ex:
        logger.info(ex)
        return jsonify(dict(error=str(ex), traceback=str(traceback.format_exc())))


@index_builder.route('/cumulative-returns')
def find_cumulative_returns():
    try:
        factors = get_factors()
        indices = get_indexes()
        archive = utils.get_str_arg(request, 'archive')
        user = utils.get_str_arg(request, 'user')
        sample_indexes = utils.get_str_arg(request, 'samples')
        factor_settings = utils.get_factor_settings(user, archive=archive)
        cum_returns = {user: model.load_cumulative_returns(factors, indices, factor_settings['factors'])}
        if sample_indexes is not None:
            for sample in sample_indexes.split(','):
                sample_rets = indices['returns']['cumulative'][sample]
                sample_rets.name = 'val'
                sample_rets.index.name = 'date'
                cum_returns[sample] = sample_rets.reset_index().to_dict(orient='records')
        return jsonify(cum_returns)
    except Exception as ex:
        logger.info(ex)
        return jsonify(dict(error=str(ex), traceback=str(traceback.format_exc())))


@index_builder.route('/summary-data')
def find_summary_data():
    try:
        factors = get_factors()
        summary = {}
        for factor_id, factor in factors.items():
            summary[factor_id] = dict(
                label=factor['label'],
                selections=dict(HI=[], LO=[]),
                avg=dict(HI=0, LO=0),
                ethical_wt=dict(HI=0, LO=0),
                reason_avg=dict(HI={}, LO={}),
            )

        users = list(utils.get_all_user_factors())
        for user, factor_settings in users:
            for factor_id, inputs in factor_settings.items():
                summary[factor_id]['selections'][inputs['strength']].append(utils.dict_merge(inputs, dict(user=user)))
        total_users = len(users)
        for factor in summary.values():
            for strength, selections in factor['selections'].items():
                factor['avg'][strength] = (sum(map(itemgetter('weight'), selections)) * 1.0) / total_users
                reason_avg = defaultdict(int)
                total_reason_users = len(selections)
                for s in selections:
                    for r_id in s['reasons']:
                        reason_avg[r_id] += 1
                factor['reason_avg'][strength] = {r_id: ((total * 1.0) / total_reason_users) * 100 for r_id, total in reason_avg.items()}

        return jsonify(summary)
    except Exception as ex:
        logger.info(ex)
        return jsonify(dict(error=str(ex), traceback=str(traceback.format_exc())))


PREEXISTING_USER = (
    "You are re-opening a session for the user <strong>{}</strong>.<br/>"
    "If you haven't logged in before please logout and create a new username."
)


def load_page(page_name):
    prev_page = request.referrer
    warning = None
    if (prev_page or '').endswith('login'):
        pre_existing_user = os.path.isfile(utils.build_factor_settings_file_path(session['username']))
        if pre_existing_user:
            warning = PREEXISTING_USER.format(session['username'])
    return render_template(
        'index_builder/{}.html'.format(page_name),
        page=page_name,
        user_counts=utils.get_user_counts(),
        app_settings=utils.get_app_settings(),
        warning=warning
    )


@index_builder.route('/factors')
@auth.requires_auth
def display_factors():
    return load_page('factors')


@index_builder.route('/results')
@auth.requires_auth
def display_results():
    return load_page('results')


@index_builder.route('/summary')
@auth.requires_auth
def display_summary():
    return load_page('summary')
