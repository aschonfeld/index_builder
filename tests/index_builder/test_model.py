import pytest
import os
import mock
import pandas as pd

import index_builder.model as model


@pytest.mark.unit
def test_load_factors(unittest):

    path = os.path.join(__file__, '..', 'index_builder/data')
    factors = model.load_factors(path)
    assert len(factors) == 13


@pytest.mark.unit
def test_load_indexes(unittest):

    path = os.path.join(__file__, '..', 'index_builder/data')
    indexes = model.load_indexes(path)
    assert len(indexes) == 4


@pytest.mark.unit
def test_load_weighted_values(unittest):
    with mock.patch('index_builder.model.build_index_id', mock.Mock(return_value=None)):
        assert not len(list(model.load_weighted_values(None, None, {'factor_1': {'weight': 50}})))

    with mock.patch('index_builder.model.build_index_id', mock.Mock(return_value='index_1')):
        assert not len(list(model.load_weighted_values(
            None, pd.DataFrame(columns=['index_2', 'index_3']), {'factor_1': {'weight': 50}}
        )))


@pytest.mark.unit
def test_load_results_stats(unittest):
    with mock.patch('index_builder.model.build_index_id', mock.Mock(return_value=None)):
        assert model.load_results_stats(None, None, {'factor_1': {'weight': 50}}) == {}


def test_load_cumulative_returns(unittest):
    with mock.patch('index_builder.model.build_index_id', mock.Mock(return_value=None)):
        assert model.load_cumulative_returns(
            None,
            {'returns': {'cumulative': None}},
            {'factor_1': {'weight': 50}}
        ) == []