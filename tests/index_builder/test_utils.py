import pytest
import mock
from collections import namedtuple
from contextlib import nested
import pandas as pd
import numpy as np

import index_builder.utils as utils


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
