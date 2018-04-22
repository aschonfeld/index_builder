import requests
import numpy as np
import pandas as pd
import json
import os
import sys
import logging as log
import yaml
import decimal
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
        f = lambda x: json_float(x, precision)
        self.fmts.append([idx, name, f])

    def add_date(self, idx, name=None):
        self.fmts.append([idx, name, json_date])

    def format_dict(self, lst, encoded=True):
        return {name: f(lst[idx]) for idx, name, f in self.fmts}

    def format_dicts(self, lsts, encoded=True):
        return [self.format_dict(l) for l in lsts]


MAX_RETRIES = 3


def read_url(url):
    from requests.exceptions import ConnectionError, Timeout
    retry_count = 0
    while retry_count < MAX_RETRIES:
        try:
            return requests.get(url, timeout=1).json()
        except Timeout as ex:
            retry_count += 1
            if retry_count == MAX_RETRIES:
                raise Exception('there was an issue reading {}, {}'.format(url, ex))
        except ConnectionError as ex:
            raise Exception('there was an issue reading {}, {}'.format(url, ex))
        except Exception as ex:
            retry_count = MAX_RETRIES
            logger.info(ex)


# DATAFRAME FORMATTING FOR REPORTS
def convert_to_float(val):
    try:
        return float(val)
    except (ValueError, TypeError):
        return None


def fmt_int(val, **kwargs):
    return '{0:.{1}f}'.format(val, 0)


# hack to solve issues with formatting floats with a precision more than 4 decimal points
# https://stackoverflow.com/questions/38847690/convert-float-to-string-without-scientific-notation-and-false-precision
decimal_ctx = decimal.Context()
decimal_ctx.prec = 20


def float_to_str(f):
    d1 = decimal_ctx.create_decimal(repr(f))
    return format(d1, 'f')


def fmt_float(val, max_decimal_places=3, min_decimal_places=None, **kwargs):
    '''
    the way our float formatting works is figure out
    how many positive digits we have in our number and
    then subtract that from the max_decimal_places allowed
    and trim the decimal side of the number to that.
    Once that is complete, if our decimal value is zero we
    drop it as well.

    Examples:
      val=0.100, max_decimal_places=3 => 0.100
      val=0.100, max_decimal_places=2 => 0.10
      val=1.000, max_decimal_places=3 => 1
      val=1.100, max_decimal_places=3 => 1.10
      val=1.1111, max_decimal_places=3 => 1.11
      val=10.1111, max_decimal_places=3 => 10.1
    '''
    val_strs = float_to_str(val).replace('-', '').split('.')
    whole_digits = 0 if '0' == val_strs[0] else len(val_strs[0])
    decimals = max_decimal_places - whole_digits
    if len(val_strs) > 1 and float(val_strs[1]) == 0:
        decimals = 0
    return '{0:.{1}f}'.format(val, max(0, min_decimal_places or decimals))


def fmt_string(val, **kwargs):
    digit_val = convert_to_float(val)
    if digit_val:
        return fmt_float(digit_val)
    else:
        return val


def fmt_date(val, **kwargs):
    try:
        return val.strftime('%Y-%m-%d')
    except (AttributeError, ValueError):
        if isinstance(val, str):
            return val
    return '-'


def fmt_bool(val, **kwargs):
    return str(val)


def date_formatter(df):
    '''
    format all date columns up front, because otherwise
    when trying to format by value you will start to receive
    "invalid literal for long() with base 10" errors
    '''
    if df is not None and len(df):
        for col, dtype in get_dtypes(df).items():
            if classify_type(dtype) == 'D':
                df[col] = df[col].apply(fmt_date)
    return df


def classify_type(type_name):
    lower_type_name = type_name.lower()
    if lower_type_name.startswith('str'):
        return 'S'
    if lower_type_name.startswith('bool'):
        return 'B'
    if lower_type_name.startswith('float'):
        return 'F'
    if lower_type_name.startswith('int'):
        return 'I'
    if any([t for t in ['timestamp', 'datetime'] if lower_type_name.startswith(t)]):
        return 'D'
    return 'S'


def get_fmt_func(type_name):
    type_classification = classify_type(type_name)
    if 'S' == type_classification:
        return fmt_string
    if 'B' == type_classification:
        return fmt_bool
    if 'I' == type_classification:
        return fmt_int
    if 'F' == type_classification:
        return fmt_float
    if 'D' == type_classification:
        return lambda x: x
    return fmt_string


def type_formatter(type_fmt, fmt_args={}):

    def _formatter(val):
        if val is None or str(val).lower() in ['nan', 'nat']:
            return '-'
        if 'custom_format' in fmt_args:
            return globals()[fmt_args['custom_format']](val)
        if not type_fmt:
            return get_fmt_func(type(val).__name__)(val, **fmt_args)
        return type_fmt(val, **fmt_args)

    return lambda x: _formatter(x)


def fmt_df(df, drop_cols=[], custom_args={}, to_dict=True):
    tmp = date_formatter(df.drop(drop_cols, axis=1, errors='ignore'))
    for col, dtype in get_dtypes(tmp).items():
        formatter = type_formatter(get_fmt_func(dtype), custom_args.get(col, {}))
        tmp.loc[:, col] = tmp[col].apply(formatter)
    return tmp.to_dict(orient='records') if to_dict else tmp, tmp.columns


def retrieve_base_params(req, props=None):
    params = dict()
    params['security_id'] = get_int_arg(req, 'security_id')
    if props:
        return filter_params(params, props)
    return params


def retrieve_tewsys_params(req, props=None):
    params = retrieve_base_params(req)
    params['report'] = get_str_arg(req, 'report')
    params['tags'] = get_str_arg(req, 'tags')
    if params['tags']:
        params['tags'] = params['tags'].split(',')
    params['universe'] = get_str_arg(req, 'universe')
    if props:
        return filter_params(params, props)
    return params


def retrieve_grid_params(req, props=None, base=retrieve_base_params):
    params = base(req)
    filters = get_str_arg(req, 'filters')
    if filters:
        filters = json.loads(filters)
        # any value entered in the grid filter will supersede the
        # main security filter
        if 'security_id' in filters:
            params['security_id'] = None
        params['filters'] = filters

    params['page'] = get_int_arg(req, 'page', 1)
    params['page_size'] = get_int_arg(req, 'page_size')
    params['sort_column'] = get_str_arg(req, 'sortColumn')
    params['sort_direction'] = get_str_arg(req, 'sortDirection')
    if props:
        return filter_params(params, props)
    return params


def retrieve_atlas_params(req, props=None):
    params = retrieve_base_params(req)
    params['start_date'] = get_str_arg(req, 'start_date')
    params['end_date'] = get_str_arg(req, 'end_date')
    securities = get_str_arg(req, 'securities', '')
    params['securities'] = [int(s) for s in securities.split(',') if len(s)]
    if props:
        return filter_params(params, props)
    return params


def filter_params(params, props):
    return map(params.get, props)


def sort_df_for_grid(df, params):
    sort_column = params.get('sort_column')
    if sort_column:
        return df.sort(sort_column, ascending=params.get('sort_direction') == 'ASC')
    return df


def filter_df_for_grid(df, params):
    data_type_info = get_dtypes(df)
    for col, filter_cfg in params.get('filters', {}).items():
        filter_val = filter_cfg['value']
        if filter_cfg.get('type') == 'NumericFilter':
            for numeric_operation in filter_val:
                operation_type = numeric_operation['type']
                df_filter = None
                if operation_type == 1: #Number
                    if numeric_operation['value'] is not None:
                        df_filter = df[col] == numeric_operation['value']
                elif operation_type == 2: #Range
                    begin = numeric_operation.get('begin')
                    end = numeric_operation.get('end')
                    if begin is not None and end is not None:
                        df_filter = ((df[col] >= begin) & (df[col] <= end))
                elif operation_type == 3: #GreaterThan
                    if numeric_operation['value'] is not None:
                        df_filter = df[col] > numeric_operation['value']
                elif operation_type == 4: #LessThan
                    if numeric_operation['value'] is not None:
                        df_filter = df[col] < numeric_operation['value']

                if df_filter is not None:
                    df = df[df_filter]
        else:
            stringified_col = df[col]
            if classify_type(data_type_info[col]) == 'D':
                stringified_col = df[col].apply(lambda d: d.strftime('%Y-%m-%d'))
            df = df[stringified_col.astype(str).str.lower().str.contains(filter_val.lower(), na=False)]
    return df


def get_df_page_for_grid(df, params):
    page, page_size = filter_params(params, ['page', 'page_size'])
    page_size = page_size or len(df)
    end = page * page_size
    start = end - page_size
    return df[start:] if end > len(df) else df[start:end]


def sort_filter_page(df, params):
    df = sort_df_for_grid(df, params)
    df = filter_df_for_grid(df, params)
    return get_df_page_for_grid(df, params)


def get_dtypes(df):
    return {c: d.name for c, d in df.dtypes.to_dict().items()}


def format_grid(df):
    f = JSONFormatter()
    i = 1
    data_type_info = get_dtypes(df)
    col_types = []
    for c in df.columns:
        type_classification = classify_type(data_type_info[c])
        if 'I' == type_classification:
            f.add_int(i, c)
        elif 'D' == type_classification:
            f.add_date(i, c)
        elif 'F' == type_classification:
            f.add_float(i, c, 4)
        else:
            f.add_string(i, c)
        i += 1
        col_types.append(dict(name=c, dtype=data_type_info[c]))
    return {
        'results': f.format_dicts(df.itertuples(), encoded=False),
        'columns': col_types
    }


def get_chunk_range(start_date, end_date):
    if start_date or end_date:
        if start_date and not end_date:
            end_date = start_date
        elif end_date and not start_date:
            start_date = end_date
        return pd.date_range(start_date, end_date)
    return None


def make_periods(start_date, end_date, freq):
    """
    Returns a list of DatetimeIndex that is the business days
    between the start_date and end_date with the frequency
    being the frequency between DatetimeIndex, e.g. Y - year,
    M - month, D - day

    Parameters:
    ----------
    start_date : date
        date to start sequence
    end_date: date
        date to end sequence
    freq: str
        frequency of DatetimeIndex

    Returns
    -------
        list of DatetimeIndex
    """
    min_time = pd.to_datetime(start_date)
    max_time = pd.to_datetime(end_date)
    periods = pd.period_range(start_date, end_date, freq=freq)
    ranges = [pd.date_range(max(p.start_time, min_time),
                             min(p.end_time, max_time), name='date')
              for p in periods]
    return [r for r in ranges if len(r) > 0]


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


def get_all_user_factor_settings(locked=True):
    for fname in os.listdir(USERS_PATH):
        user, _ = os.path.splitext(fname)
        factor_settings = get_factor_settings(user)
        if not locked or factor_settings['locked']:
            yield user, factor_settings


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
