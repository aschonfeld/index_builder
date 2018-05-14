import pytest
import mock
from contextlib import nested
from collections import namedtuple
from decorator import decorator
from dateutil import rrule
import datetime as dt

import index_builder.cache as cache


@pytest.mark.unit
def test_clear_cache():
    with mock.patch('index_builder.cache.GICS_CACHE.clear') as mock_clear:
        cache.clear_cache('GICS_CACHE')
        assert mock_clear.called


@pytest.mark.unit
def test_clear_all_caches():
    with nested(
        mock.patch('index_builder.cache.FACTOR_CACHE.clear'),
        mock.patch('index_builder.cache.INDEXES_CACHE.clear'),
        mock.patch('index_builder.cache.GICS_CACHE.clear')
    ) as mocks:
        cache.clear_all_caches()
        assert all(m.called for m in mocks)


@pytest.mark.unit
def test_clear_memory_value():

    with mock.patch('index_builder.cache.ExpiryCache.__delitem__') as mock_del:
        cache.clear_memory_value('GICS_CACHE', None)
        args, _ = mock_del.call_args
        assert args[0] == ((), frozenset([]))

    with mock.patch('index_builder.cache.ExpiryCache.__delitem__') as mock_del:
        cache.clear_memory_value('GICS_CACHE', ['test'])
        args, _ = mock_del.call_args
        assert args[0] == (('test',), frozenset([]))


@pytest.mark.unit
def test_getargspec(unittest):
    func = namedtuple('func', '')
    with mock.patch('index_builder.cache._getargspec', mock.Mock(side_effect=TypeError())):
        try:
            cache.getargspec(func())
            unittest.fail('should throw TypeError')
        except TypeError as ex:
            assert ex.message == "Sorry, this really is not a function, is it?"


@pytest.mark.unit
def test_copy_wrapped_attributes():
    with mock.patch('index_builder.cache.getargspec', mock.Mock(side_effect=TypeError())):
        from index_builder.model import load_factors
        func = load_factors
        decorated_func = decorator(cache._memoize_function, func)
        cache.copy_wrapped_attributes(func, decorated_func)


@pytest.mark.unit
def test_ismethod():
    spec = namedtuple('spec', 'args')
    with mock.patch('index_builder.cache._getargspec', mock.Mock(return_value=spec(args=['self']))):
        assert cache.ismethod(None)


@pytest.mark.unit
def test_get_fn_value(unittest):
    try:
        cache._get_fn_value(None, None, None)
        unittest.fail('Should throw TypeError')
    except Exception as ex:
        assert isinstance(ex, TypeError)


@pytest.mark.unit
def test_custom_memoize(unittest):
    with mock.patch('index_builder.cache.ismethod', mock.Mock(return_value=True)):
        try:
            cache.custom_memoize(None)(None)
            unittest.fail('Should throw TypeError')
        except Exception as ex:
            assert isinstance(ex, TypeError)
            assert ex.message == "Custom memoization for methods is done by defining self._cache in the instance"


@pytest.mark.unit
def test_expiry_cache(unittest):
    ec = cache.ExpiryCache(rrule.rrule(rrule.DAILY, byhour=(13, 22), byminute=(0,)))
    ec.dt_current = dt.datetime.today() - dt.timedelta(days=1)
    ec.check_rrule_timeout()
    assert ec.dt_current.hour in [13, 22]
    assert next(iter(ec.midnight())).hour == 0
    ec['test'] = 'here'
    del ec['test']
    ec['test'] = 'here'
    ec._cache['test'] = dt.datetime.today() - dt.timedelta(days=1), ec._cache['test'][1], ec._cache['test'][2]
    try:
        ec['test']
        unittest.fail('should invalidate key')
    except Exception as ex:
        assert isinstance(ex, KeyError)
    ec['test'] = 'here'
    assert len(ec) == 1
    ec.clear()
    assert len(ec) == 0


