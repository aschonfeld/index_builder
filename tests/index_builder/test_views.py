import pytest
import json
import mock
from contextlib import nested
from functools import wraps

from index_builder.server import app
import index_builder.views as index_builder_views


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


@pytest.mark.unit
def test_200():
    def noauth(f):
        """Pass through decorator"""
        @wraps(f)
        def decorated(*args, **kwargs):
            return f(*args, **kwargs)
        return decorated

    paths = ['/index-builder/factors', '/index-builder/results', '/index-builder/summary',
             '/index-builder/debug', '/login', '/index']
    with nested(mock.patch('index_builder.views.auth.requires_auth', noauth), mock.patch('flask.session', {})):
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