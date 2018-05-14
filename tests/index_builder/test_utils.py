import pytest
import mock
from collections import namedtuple
from contextlib import nested
import pandas as pd
import numpy as np
import time
import datetime

import index_builder.utils as utils
from tests.testing_tools import TEST_FACTOR_SETTINGS


def build_req_tuple(args):
    req = namedtuple('req', 'args')
    return req(args)


@pytest.mark.unit
def test_getters():

    req = build_req_tuple({'int': '1', 'empty_int': '', 'str': 'hello', 'empty_str': '',  'bool': 'true'})
    val = utils.get_str_arg(req, 'str')
    assert isinstance(val, str) and val == 'hello'
    val = utils.get_str_arg(req, 'str_def', default='def')
    assert val == 'def'
    val = utils.get_str_arg(req, 'empty_str')
    assert val is None
    with mock.patch('__builtin__.str', mock.Mock(side_effect=Exception)):
        val = utils.get_str_arg(req, 'str', default='def')
        assert val == 'def'
    val = utils.get_int_arg(req, 'int')
    assert isinstance(val, int) and val == 1
    val = utils.get_int_arg(req, 'int_def', default=2)
    assert val == 2
    val = utils.get_int_arg(req, 'empty_int')
    assert val is None
    with mock.patch('__builtin__.int', mock.Mock(side_effect=Exception)):
        val = utils.get_int_arg(req, 'int', default=2)
        assert val == 2
    val = utils.get_bool_arg(req, 'bool')
    assert isinstance(val, bool) and val


@pytest.mark.unit
def test_formatters(unittest):
    formatters = utils.JSONFormatter()
    formatters.add_string(0, name='str')
    formatters.add_int(1, name='int')
    formatters.add_float(2, name='float')
    formatters.add_date(3, name='date')

    data = [['hello', 1, 1.6666666, pd.Timestamp('20180430')]]
    unittest.assertEquals(
        formatters.format_dicts(data),
        [{'int': 1, 'date': '2018-04-30', 'float': 1.666667, 'str': 'hello'}]
    )
    bad_data = [[None, np.nan, np.nan, np.nan]]
    unittest.assertEquals(
        formatters.format_dicts(bad_data),
        [{'int': 'nan', 'date': '', 'float': 'nan', 'str': None}]
    )
    bad_data = [['hello', 'hello', 'hello', 'hello']]
    unittest.assertEquals(
        formatters.format_dicts(bad_data),
        [{'int': None, 'date': '', 'float': None, 'str': 'hello'}]
    )


@pytest.mark.unit
def test_get_logger():
    with mock.patch('index_builder.utils.log.getLogger') as mock_log:
        utils.get_logger()
        args, _ = mock_log.call_args
        assert not len(args)

    with nested(
        mock.patch('index_builder.utils.log.getLogger'),
        mock.patch('index_builder.utils.running_with_gunicorn', mock.Mock(return_value=True))
    ) as (mock_log, _):
        utils.get_logger()
        args, _ = mock_log.call_args
        assert args[0] == 'gunicorn.error'


@pytest.mark.unit
def test_mkdir_p():
    with nested(
        mock.patch('index_builder.utils.logger.error'),
        mock.patch('os.path.isdir', mock.Mock(side_effect=Exception()))
    ) as (mock_logger, _):
        utils.mkdir_p('test')
        assert mock_logger.is_called


@pytest.mark.unit
def test_build_users_path():
    assert utils.build_users_path().endswith('users')
    assert utils.build_users_path(archive='test').endswith('users_test')


@pytest.mark.unit
def test_get_all_users(unittest):
    def mock_get_factor_settings(user):
        user_ct = int(user.replace('test', ''))
        if user_ct % 2 == 0:
            return TEST_FACTOR_SETTINGS
        return utils.dict_merge(TEST_FACTOR_SETTINGS, dict(locked=True))

    with nested(
        mock.patch('os.listdir', mock.Mock(return_value=['test{}.yaml'.format(i) for i in range(3)])),
        mock.patch('index_builder.utils.get_factor_settings', mock_get_factor_settings),
        mock.patch('os.path.getmtime', mock.Mock(return_value=time.time()))
    ):
        assert 1 == len(list(utils.get_all_user_factors()))
        assert 3 == len(list(utils.get_all_user_factors(locked=False)))
        assert 1 == len(list(utils.get_all_user_factors(archive='test')))
        assert 3 == len(list(utils.get_all_user_factors(locked=False, archive='test')))
        _, _, last_update = next(utils.get_all_user_factor_settings(include_last_update=True))
        try:
            datetime.datetime.strptime(last_update, "%a %b %d %H:%M:%S %Y")
        except ValueError:
            unittest.fail("Incorrect last update date format, expecting %a %b %d %H:%M:%S %Y")


@pytest.mark.unit
def test_archive_all_user_factor_settings():
    with nested(
        mock.patch('index_builder.utils.logger.error'),
        mock.patch('os.rename', mock.Mock(side_effect=Exception()))
    ) as (mock_logger, _):
        utils.archive_all_user_factor_settings()
        assert mock_logger.is_called


@pytest.mark.unit
def test_dict_merge():
    assert utils.dict_merge(None, None) == {}
    assert utils.dict_merge(dict(a=1), None) == dict(a=1)
    assert utils.dict_merge(None, dict(a=1)) == dict(a=1)
    assert utils.dict_merge(dict(a=1), dict(a=2, b=2)) == dict(a=2, b=2)


