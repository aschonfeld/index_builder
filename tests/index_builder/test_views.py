import pytest
import json
import mock

from index_builder.server import app


@pytest.mark.unit
def test_find_factor_options(unittest):
    with app.test_client() as c:
        response = c.get('/index-builder/factor-options')
        assert response.status_code == 200
        assert response.content_type == 'application/json'
        response_data = json.loads(response.data)
        assert 'error' not in response_data


@pytest.mark.unit
def test_find_factor_data(unittest):
    with app.test_client() as c:
        response = c.get('/index-builder/factor-data', query_string=dict(factor='Factor 1'))
        assert response.status_code == 200
        assert response.content_type == 'application/json'
        response_data = json.loads(response.data)
        assert 'error' not in response_data


@pytest.mark.unit
def test_find_sample_indexes(unittest):
    with app.test_client() as c:
        response = c.get('/index-builder/sample-indexes')
        assert response.status_code == 200
        assert response.content_type == 'application/json'
        response_data = json.loads(response.data)
        assert 'error' not in response_data


@pytest.mark.unit
def test_load_results_stats(unittest):
    with mock.patch('flask.session', mock.Mock(return_value=dict(username='test'))):
        with app.test_client() as c:
            response = c.get('/index-builder/results-stats')
            assert response.status_code == 200
            assert response.content_type == 'application/json'
            response_data = json.loads(response.data)
            assert 'error' not in response_data

TEST_FACTOR_SETTINGS = dict(
    factors=dict(
        factor_1=dict(reasons=['futureRet','riskReduce'], strength='HI', weight=10),
        factor_2=dict(reasons=['ethics'], strength='HI', weight=20),
        factor_3=dict(reasons=['ethics'], strength='HI', weight=30)
    ),
    locked=False
)

@pytest.mark.unit
def test_load_cumulative_returns(unittest):
    with mock.patch('index_builder.views.utils.get_factor_settings', mock.Mock(return_value=TEST_FACTOR_SETTINGS)):
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
def test_load_results_stats(unittest):
    with mock.patch(
            'index_builder.views.utils.get_all_user_factors',
            mock.Mock(return_value=[('Test User', TEST_FACTOR_SETTINGS['factors'])])
    ):
        with app.test_client() as c:
            response = c.get('/index-builder/results-stats')
            assert response.status_code == 200
            assert response.content_type == 'application/json'
            response_data = json.loads(response.data)
            assert 'error' not in response_data


@pytest.mark.unit
def test_load_user_results(unittest):
    with mock.patch('index_builder.views.utils.get_factor_settings', mock.Mock(return_value=TEST_FACTOR_SETTINGS)):
        with app.test_client() as c:
            response = c.get('/index-builder/user-results', query_string=dict(user='Test User'))
            assert response.status_code == 200
            assert response.content_type == 'application/json'
            response_data = json.loads(response.data)
            assert 'error' not in response_data


@pytest.mark.unit
def test_find_summary_data(unittest):
    with mock.patch(
            'index_builder.views.utils.get_all_user_factors',
            mock.Mock(return_value=[('TestUser', TEST_FACTOR_SETTINGS['factors'])])
    ):
        with app.test_client() as c:
            response = c.get('/index-builder/summary-data')
            assert response.status_code == 200
            assert response.content_type == 'application/json'
            response_data = json.loads(response.data)
            assert 'error' not in response_data


@pytest.mark.unit
def test_200(unittest):
    paths = ['/index-builder/factors', '/index-builder/results', '/index-builder/summary',
             '/index-builder/debug', '/login', '/index']
    with app.test_client() as c:
        for path in paths:
            response = c.get(path)
            assert response.status_code == 200, '{} should return 200 response'.format(path)


@pytest.mark.unit
def test_302():
    with app.test_client() as c:
        for path in ['/', '/index-builder', '/index-builder/main', '/logout']:
            response = c.get(path)
            assert response.status_code == 302, '{} should return 302 response'.format(path)


@pytest.mark.unit
def test_404():
    response = app.test_client().get('/index-builder/invalid-location')
    assert response.status_code == 404
    # make sure custom 404 page is returned
    assert 'The page you were looking for <code>/index-builder/invalid-location</code> does not exist.' in response.data


@pytest.mark.unit
def test_500():
    response = app.test_client().get('/500')
    assert response.status_code == 500
    assert '<h1>Internal Server Error</h1>' in response.data