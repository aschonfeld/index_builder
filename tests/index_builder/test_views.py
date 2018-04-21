import pytest
import json
import mock

from index_builder.server import app


@pytest.mark.unit
def test_load_results_stats(unittest):
    with mock.patch('flask.session', mock.Mock(return_value=dict(username='test'))):
        with app.test_client() as c:
            response = c.get('/index-builder/results-stats')
            assert response.status_code == 200
            assert response.content_type == 'application/json'
            response_data = json.loads(response.data)
            assert 'error' not in response_data


@pytest.mark.unit
def test_load_cumulative_returns(unittest):
    factor_settings = dict(
        factors=dict(
            factor_1=dict(reasons=['futureRet','riskReduce'], strength='HI', weight=10),
            factor_2=dict(reasons=['ethics'], strength='HI', weight=20),
            factor_3=dict(reasons=['ethics'], strength='HI', weight=30)
        ),
        locked=False
    )
    with mock.patch('index_builder.views.utils.get_factor_settings', mock.Mock(return_value=factor_settings)):
        with app.test_client() as c:
            response = c.get(
                '/index-builder/cumulative-returns',
                query_string=dict(user='Test User', samples='sample_index_1')
            )
            assert response.status_code == 200
            assert response.content_type == 'application/json'
            response_data = json.loads(response.data)
            assert 'error' not in response_data


@pytest.mark.unit
def test_load_user_results(unittest):
    with app.test_client() as c:
        response = c.get('/index-builder/user-results', query_string=dict(user='ethan'))
        assert response.status_code == 200
        assert response.content_type == 'application/json'
        response_data = json.loads(response.data)
        assert 'error' not in response_data