import numpy as np
import pandas as pd
import os
import sys
import logging as log
import yaml
import time

log.basicConfig(format="%(asctime)s - %(levelname)-8s - %(message)s", level=log.DEBUG)
for handler in log.getLogger().handlers:
    handler.setLevel(log.INFO)


def running_with_pytest():
    return hasattr(sys, '_called_from_test')


def running_with_gunicorn():
    return "gunicorn" in os.environ.get("SERVER_SOFTWARE", "")


def running_with_flask():
    return os.environ.get('WERKZEUG_RUN_MAIN') == 'true'


def get_logger():
    if running_with_gunicorn():
        # this will attach our application logging to gunicorn's error log
        return log.getLogger('gunicorn.error')
    return log.getLogger()

logger = get_logger()


def get_str_arg(r, name, default=None):
    val = r.args.get(name)
    if val is None or val == '':
        return default
    else:
        try:
            return str(val)
        except:
            return default


def get_int_arg(r, name, default=None):
    val = r.args.get(name)
    if val is None or val == '':
        return default
    else:
        try:
            return int(val)
        except:
            return default


def get_bool_arg(r, name):
    return r.args.get(name, 'false').lower() == 'true'


def json_string(x):
    if x is None:
        return None
    else:
        return str(x)


def json_int(x):
    try:
        return int(x) if not np.isnan(x) else 'nan'
    except:
        return None


def json_float(x, precision=2):
    try:
        return float(round(x, precision)) if not np.isnan(x) else 'nan'
    except:
        return None


def json_date(x):
    try:
        return x.strftime('%Y-%m-%d')
    except:
        return ''


class JSONFormatter(object):

    def __init__(self):
        self.fmts = []

    def add_string(self, idx, name=None):
        self.fmts.append([idx, name, json_string])

    def add_int(self, idx, name=None):
        self.fmts.append([idx, name, json_int])

    def add_float(self, idx, name=None, precision=6):
        self.fmts.append([idx, name, lambda x: json_float(x, precision)])

    def add_date(self, idx, name=None):
        self.fmts.append([idx, name, json_date])

    def format_dict(self, lst):
        return {name: f(lst[idx]) for idx, name, f in self.fmts}

    def format_dicts(self, lsts):
        return [self.format_dict(l) for l in lsts]


def dict_merge(d1, d2):
    """
    Merges two dictionaries.  Items of the second dictionary will
    replace items of the first dictionary if there are any overlaps.
    Either dictionary can be None.  An empty dictionary {} will be
    returned if both dictionaries are None.

    Parameters
    ----------
    d1: dictionary
        First dictionary can be None
    d2: dictionary
        Second dictionary can be None

    Returns
    -------
    Dictionary
    """
    if not d1:
        return d2 or {}
    elif not d2:
        return d1 or {}
    return dict(d1.items() + d2.items())


def mkdir_p(path):
    try:
        if not os.path.isdir(path):
            os.makedirs(path)
    except Exception as ex:
        logger.error(ex)

DATA_PATH = os.path.join(os.path.dirname(__file__), 'data')
USERS_PATH = os.path.join(DATA_PATH, 'users')  # build folder structure if it doesn't exist
mkdir_p(USERS_PATH)
APP_SETTINGS_FNAME = os.path.join(DATA_PATH, 'app_settings.yaml')


def build_factor_settings_file_path(user):
    return os.path.join(USERS_PATH, '{}.yaml'.format(user))


def dump_yaml(data, fname):
    with open(fname, "w+") as f:
        yaml.safe_dump(data, f, default_flow_style=False, allow_unicode=True)


def load_yaml(fname):
    if os.path.isfile(fname):
        with open(fname) as f:
            return yaml.load(f)
    return None


def dump_factor_settings(user, factor_settings):
    dump_yaml(factor_settings, build_factor_settings_file_path(user))


def get_all_user_factors(locked=True):
    for user, factor_settings in get_all_user_factor_settings(locked):
        yield user, factor_settings.get('factors', {})


def get_all_user_factor_settings(locked=True, include_last_update=False):
    for fname in os.listdir(USERS_PATH):
        user, _ = os.path.splitext(fname)
        factor_settings = get_factor_settings(user)
        if not locked or factor_settings['locked']:
            if include_last_update:
                last_update = time.ctime(os.path.getmtime(os.path.join(USERS_PATH, fname)))
                yield user, factor_settings, last_update
            else:
                yield user, factor_settings


def archive_all_user_factor_settings():
    try:
        current_timestamp = pd.Timestamp('now').strftime('%Y%m%d%H%M%S')
        os.rename(USERS_PATH, USERS_PATH.replace('users', 'users_{}'.format(current_timestamp)))
        mkdir_p(USERS_PATH)
    except Exception as ex:
        logger.error(ex)


def get_user_counts():
    user_counts = dict(locked=0, unlocked=0)
    for _, factor_settings in get_all_user_factor_settings(locked=False):
        user_counts['locked'] += int(factor_settings['locked'])
        user_counts['unlocked'] += int(not factor_settings['locked'])
    return user_counts


def get_factor_settings(user):
    fname = build_factor_settings_file_path(user)
    return load_yaml(fname) or dict(factors={}, locked=False)


def get_app_settings():
    return load_yaml(APP_SETTINGS_FNAME) or dict(summary_viewable=False)


def dump_app_settings(settings):
    dump_yaml(settings, APP_SETTINGS_FNAME)
