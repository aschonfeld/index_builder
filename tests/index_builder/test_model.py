import pytest
import os

from index_builder.model import load_factors, load_indexes


@pytest.mark.unit
def test_load_factors(unittest):

    path = os.path.join(__file__, '..', 'index_builder/data')
    factors = load_factors(path)
    assert len(factors) == 12


@pytest.mark.unit
def test_load_indexes(unittest):

    path = os.path.join(__file__, '..', 'index_builder/data')
    indexes = load_indexes(path)
    assert len(indexes) == 4