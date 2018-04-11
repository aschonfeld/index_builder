import pytest
import json
import mock

from index_builder.server import app


@pytest.mark.unit
def test_load_results_stats(unittest):
    with mock.patch('flask.session', mock.Mock(return_value=dict(username='test'))):
        with app.test_client() as c:
            response = c.get('/index_builder/results-stats')
            assert response.status_code == 200
            assert response.content_type == 'application/json'
            response_data = json.loads(response.data)
            assert 'error' not in response_data


@pytest.mark.unit
def test_load_cumulative_returns(unittest):
    with app.test_client() as c:
        response = c.get('/index_builder/cumulative-returns', query_string=dict(user='Fur Tailors', samples='sin'))
        assert response.status_code == 200
        assert response.content_type == 'application/json'
        response_data = json.loads(response.data)
        assert 'error' not in response_data


@pytest.mark.unit
def test_load_user_results(unittest):
    with app.test_client() as c:
        response = c.get('/index_builder/user-results', query_string=dict(user='ethan'))
        assert response.status_code == 200
        assert response.content_type == 'application/json'
        response_data = json.loads(response.data)
        assert 'error' not in response_data