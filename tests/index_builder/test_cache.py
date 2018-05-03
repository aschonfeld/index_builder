import pytest
import mock
from contextlib import nested

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
