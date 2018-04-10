import pandas as pd
import numpy as np
import random
import os

from utils import get_logger, dict_merge, fmt_df

logger = get_logger()


def load_factors(path):
    logger.info('caching factors...')
    factor_ids = range(1,14)
    build_factor = lambda i: {
        'id': 'factor_{}'.format(i),
        'label': 'Factor {}'.format(i),
        'description': 'Description of "Factor {}"'.format(i),
        'index_name': 'index_{}'.format(i),
        'rating': random.randint(1, 2400) / 100.0
    }
    factors = pd.DataFrame(map(build_factor, factor_ids))
    factors = factors.to_dict(orient='records')
    factors = {r['id']: r for r in factors}

    sectors = {
        'factor_{}'.format(i): dict_merge({
            str(sector): pct * 10000
            for sector, pct in zip(range(10, 61, 5), np.random.dirichlet(np.ones(11), size=1))
        }, dict(Total=10000))
        for i in factor_ids
    }
    
    possible_cols = [3, 5, 6]
    possible_scores = [20, 25, 40, 50, 60, 75, 80]
    def build_scores():
        cols = possible_cols[random.randint(0,2)]
        if cols == 3:
            return {
                str(score): pct * 100
                for score, pct in zip([0, 50, 100], np.random.dirichlet(np.ones(3), size=1))
            }
        random.shuffle(possible_scores)
        return {
            str(score): pct * 100
            for score, pct in zip([0, 100] + possible_scores[2:cols - 3], np.random.dirichlet(np.ones(cols), size=1))
        }
    
    scores = {'factor_{}'.format(i): build_scores() for i in factor_ids}
    score_defs = {
        factor_id: {score: 'Rating of {}'.format(score) for score in scores}
        for factor_id, scores in scores.items()
    }

    securities = map(lambda i: 'Company {}'.format(i), range(1,11))    
    def load_top_bottom():
        random.shuffle(securities)
        return dict(
            top={rank: sec for rank, sec in enumerate(securities[:5])},
            bottom={rank: sec for rank, sec in enumerate(securities[5:])}
        )
    
    def load_ret_summary(factor_scores):
        build_mean = lambda: random.randint(-100, 100) / 100.0
        build_std = lambda: random.randint(-500, 500) / 10000.0
        build_ir = lambda: random.randint(-2500, 2500) / 10000.0
        return {
            score: {
                'sa_Mean': build_mean(), 'total_Mean': build_mean(),
                'sa_STD': build_std(), 'total_STD': build_std(),
                'sa_IR': build_ir(), 'total_IR': build_ir(),
            }
            for score in factor_scores
        }

    def load_returns(factor_scores):
        build_ret = lambda: random.randint(-1000, 1000) / 1000.0
        ret_data = {}
        suffix = 'totret_mtd_usd_mean_cumulative'
        ret_data[suffix] = {score: [{'date': pd.Timestamp('20091201'), 'val': 0}] for score in factor_scores}
        suffix = 'totret_mtd_usd_sect_adj_mean_cumulative'
        ret_data[suffix] = {score: [{'date': pd.Timestamp('20091201'), 'val': 0}] for score in factor_scores}

        curr_cum_rets = {
            suffix: {score: 0 for score in factor_scores} for suffix in ret_data
        }

        for p in pd.period_range('20100101', '20131231', freq='M'):
            date = pd.Timestamp(p.start_time).date()
            for score in factor_scores:
                for suffix in ret_data:
                    curr_cum_rets[suffix][score] += build_ret()
                    ret_data[suffix][score].append(
                        {'date': date, 'val': curr_cum_rets[suffix][score]}
                    )
        return ret_data

    def get_factor_data(factor_id):
        return dict_merge(dict(
            sectors=sectors.get(factor_id, {}),
            scores=scores.get(factor_id, {}),
            score_defs=score_defs.get(factor_id, {}),
            ret_summary=load_ret_summary(scores.get(factor_id, {})),
            returns=load_returns(scores.get(factor_id, {}))
        ), load_top_bottom())

    factors = {k: dict_merge(v, get_factor_data(k)) for k, v in factors.items()}
    logger.info('cached {} factors'.format(len(factors)))

    return factors


def load_indexes(path):
    logger.info('caching indexes...')
    
    index_ids = map(lambda i: ['index_{}_hi'.format(i), 'index_{}_lo'.format(i)], range(1,14)) + SAMPLE_INDEXES
    index_ids = [i_id for sub_ids in index_ids for i_id in sub_ids]
    barra_factors = map(lambda i: 'Barra Factor {}'.format(i), range(1,12))
    build_exp = lambda: random.randint(-100, 100) / 100.0
    years = [pd.Timestamp('{}1231'.format(year)) for year in range(2010, 2018)]
    
    def build_exposures(name):
        for date in years:
            yield dict_merge(
                {'name': name, 'date': date},
                {i_id: build_exp() for i_id in index_ids}
            )
    
    barra = pd.concat([pd.DataFrame(build_exposures(bf_id)) for bf_id in barra_factors])
    logger.info('cached {} barra exposures'.format(len(barra)))
 
    sector_ids = map(str, range(10, 61, 5))
    sectors = pd.concat([pd.DataFrame(build_exposures(s_id)) for s_id in sector_ids])
    logger.info('cached {} sectors exposures'.format(len(sectors)))

    dates = pd.bdate_range('20100101','20171231')
    daily_returns = len(dates) * [{i_id: random.randint(-2500, 2500) / 10000.0 for i_id in index_ids}]
    cum_returns = [{i_id: 1 for i_id in index_ids}]
    for i, dr in enumerate(daily_returns[:-1]):
        cum_returns.append({i_id: dr[i_id] + cum_returns[i][i_id] for i_id in index_ids})
    daily_returns = pd.DataFrame(daily_returns, index=dates)
    logger.info('cached {} daily returns'.format(len(daily_returns)))

    cum_returns = pd.DataFrame(cum_returns, index=dates)
    logger.info('cached {} cumulative returns'.format(len(cum_returns)))

    annualized_returns = pd.DataFrame(
        len(years) * [{i_id: random.randint(-1000, 1000) / 1000.0 for i_id in index_ids}],
        index=years
    )
    logger.info('cached {} annualized returns'.format(len(annualized_returns)))

    excess_returns = pd.DataFrame(
        len(years) * [{i_id: random.randint(-2500, 2500) / 10000.0 for i_id in index_ids}],
        index=years
    )
    logger.info('cached {} excess returns'.format(len(excess_returns)))

    def build_stats():
        return {
            'annualized': random.randint(0, 100) / 100.0,
            'compounded_return': random.randint(0, 20000) / 1000.0,
            'excess over index (annualized)': random.randint(0, 1100) / 10000.0,
            'tracking_error': random.randint(1000, 2100) / 1000.0,
            'volatility': random.randint(0, 1600) / 1000.0,
            'ir': random.randint(-150, 150) / 100.0
        }
    
    stats = {i_id: build_stats() for i_id in index_ids}
    logger.info('cached {} index stats'.format(len(stats)))

    return dict(
        barra=barra,
        sectors=sectors,
        returns=dict(cumulative=cum_returns, daily=daily_returns, annualized=annualized_returns, excess=excess_returns),
        stats=stats
    )

SAMPLE_INDEXES = map(lambda i: 'sample_index_{}'.format(i), range(1,5))


def build_index_id(factors, args):
    factor_id, settings = args
    return '{} {}'.format(factors[factor_id].get('index_name'), settings['strength']).lower()


def load_returns(factors, returns, factor_settings):
    for factor_id, settings in factor_settings.items():
        index = build_index_id(factors, (factor_id, settings))
        if index is None:
            continue
        weight = settings.get('weight', 0) / 100.0
        if index not in returns.columns:
            continue
        yield returns[index] * weight


def load_results_stats(factors, indices, factor_settings):
    def load_stats(args):
        factor_id, settings = args
        index = build_index_id(factors, args)
        if index is None:
            return {}
        weight = settings.get('weight', 0) / 100.0
        stat_vals = {k: v for k, v in indices['stats'].get(index, {}).items()}
        factor_cfg = factors[factor_id]
        # rating should only be applied to HI "Pro" selections
        stat_vals['rating'] = 0 if settings.get('strength') == 'LO' else factor_cfg.get('rating')
        return {k: v * weight for k, v in stat_vals.items()}

    stats = pd.DataFrame(map(load_stats, factor_settings.items())).sum().to_dict()
    if len(stats):
        daily_returns = pd.concat(load_returns(factors, indices['returns']['daily'], factor_settings), axis=1).sum(axis=1)
        annualization_factor = np.sqrt(252) / 100
        stats['volatility'] = daily_returns.std() * annualization_factor
        stats['tracking error'] = (daily_returns - indices['returns']['daily']['index']).std() * annualization_factor
        stats['ir'] = stats['excess over index (annualized)'] / stats['tracking error']
    return stats


def load_user_results(factors, indices, factor_settings):
    results = dict(settings={k: dict_merge(dict(label=factors[k]['label']), v) for k, v in factor_settings.items()})

    def load_exposures(exposures):
        for factor_id, settings in factor_settings.items():
            index = build_index_id(factors, (factor_id, settings))
            if index is None:
                continue
            weight = settings.get('weight', 0) / 100.0
            if index not in exposures.columns:
                continue
            yield exposures.set_index(['date', 'name'])[index] * weight

    sectors = list(load_exposures(indices['sectors']))
    if len(sectors):
        sectors = pd.concat(sectors, axis=1).sum(axis=1)
        sectors.name = 'val'
        sectors = sectors.reset_index(level='date')
        results['sectors'] = {k: g.to_dict(orient='records') for k, g in sectors.groupby(level='name')}

    barra = list(load_exposures(indices['barra']))
    if len(barra):
        barra = pd.concat(barra, axis=1).sum(axis=1)
        barra.name = 'val'
        barra = barra.reset_index(level='date')
        results['barra'] = {k: g.to_dict(orient='records') for k, g in barra.groupby(level='name')}

    returns = {}
    excess_returns = list(load_returns(factors, indices['returns']['excess'], factor_settings))
    if len(excess_returns):
        excess_returns = pd.concat(excess_returns, axis=1).sum(axis=1)
        excess_returns.name = 'val'
        excess_returns.index.name = 'date'
        returns['excess'] = excess_returns.reset_index().to_dict(orient='records')

    annualized_returns = list(load_returns(factors, indices['returns']['annualized'], factor_settings))
    if len(annualized_returns):
        annualized_returns = pd.concat(annualized_returns, axis=1).sum(axis=1)
        annualized_returns.name = 'val'
        annualized_returns.index.name = 'date'
        returns['annualized'] = annualized_returns.reset_index().to_dict(orient='records')

    results['returns'] = returns
    return results


def load_cumulative_returns(factors, indices, factor_settings):
    cumulative_returns = list(load_returns(factors, indices['returns']['cumulative'], factor_settings))
    if len(cumulative_returns):
        cumulative_returns = pd.concat(cumulative_returns, axis=1).sum(axis=1)
        cumulative_returns.name = 'val'
        cumulative_returns.index.name = 'date'
        return cumulative_returns.reset_index().to_dict(orient='records')
    return []
