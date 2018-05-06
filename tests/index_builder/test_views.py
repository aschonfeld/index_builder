import pytest
import json
import mock
from contextlib import nested
import flask

from index_builder.server import app
import index_builder.views as views
from index_builder.model import SAMPLE_INDEXES
from index_builder.utils import dict_merge


TEST_FACTOR_SETTINGS = dict(
    factors=dict(
        factor_1=dict(reasons=['futureRet','riskReduce'], strength='HI', weight=10),
        factor_2=dict(reasons=['ethics'], strength='HI', weight=20),
        factor_3=dict(reasons=['ethics'], strength='HI', weight=30)
    ),
    locked=False
)


@pytest.mark.unit
def test_startup(unittest):
    with nested(
        mock.patch('index_builder.views.utils.running_with_pytest', mock.Mock(return_value=False)),
        mock.patch('index_builder.views.utils.running_with_flask', mock.Mock(return_value=True)),
        mock.patch('index_builder.views.utils.running_with_gunicorn', mock.Mock(return_value=False)),
        mock.patch('index_builder.views.load_gics_mappings'),
        mock.patch('index_builder.views.load_factors'),
        mock.patch('index_builder.views.load_indexes')
    ) as (_, _, _, load_gics, load_factors, load_indexes):
        views.startup('path')
        assert all((load_gics.called, load_factors.called, load_indexes.called)), 'should load data when running flask'

    with nested(
        mock.patch('index_builder.views.utils.running_with_pytest', mock.Mock(return_value=True)),
        mock.patch('index_builder.views.utils.running_with_flask', mock.Mock(return_value=True)),
        mock.patch('index_builder.views.utils.running_with_gunicorn', mock.Mock(return_value=False)),
        mock.patch('index_builder.views.load_gics_mappings'),
        mock.patch('index_builder.views.load_factors'),
        mock.patch('index_builder.views.load_indexes')
    ) as (_, _, _, load_gics, load_factors, load_indexes):
        views.startup('path')
        unittest.assertTrue(
            all((not load_gics.called, not load_factors.called, not load_indexes.called)),
            'should not load data when running pytest'
        )


@pytest.mark.unit
def test_refresh_cached_data(unittest):
    with nested(
        mock.patch('index_builder.views.cache.clear_all_caches', mock.Mock(return_value=True)),
        mock.patch('index_builder.views.load_gics_mappings'),
        mock.patch('index_builder.views.load_factors'),
        mock.patch('index_builder.views.load_indexes')
    ) as (clear_caches, load_gics, load_factors, load_indexes):
        app.test_client().get('/index-builder/force-refresh')
        unittest.assertTrue(
            all((clear_caches.called, load_gics.called, load_factors.called, load_indexes.called)),
            'should reload data and clear cache'
        )


@pytest.mark.unit
def test_clear_cache():
    with mock.patch('index_builder.views.cache.clear_cache') as clear_cache:
        app.test_client().get('/index-builder/clear-cache', query_string=dict(cache='test'))
        args, _ = clear_cache.call_args
        name = args[0]
        assert name == 'test', 'should clear cache'

    with mock.patch('index_builder.views.cache.clear_cache') as clear_cache:
        app.test_client().get('/index-builder/clear-cache')
        assert not clear_cache.called, 'should not clear cache'


@pytest.mark.unit
def test_get_gics_mappings():
    with app.test_client() as c:
        response = c.get('/index-builder/gics-mappings')
        assert response.status_code == 200
        response_data = json.loads(response.data)
        assert isinstance(response_data, dict)

        with mock.patch('__builtin__.open') as mock_open:
            c.get('/index-builder/gics-mappings')
            assert not mock_open.called, "should not reload cached data"

        with nested(
            mock.patch('index_builder.cache.ExpiryCache.__getitem__', mock.Mock(side_effect=KeyError)),
            mock.patch('__builtin__.open'),
            mock.patch('yaml.load', mock.Mock(return_value={}))
        ) as (_, mock_open, yaml_load):
            c.get('/index-builder/gics-mappings')
            assert all((mock_open.called, yaml_load.called)), "should load uncached data"


@pytest.mark.unit
def test_load_factor_settings(unittest):
    with app.test_client() as c:
        response = c.get('/index-builder/load-factor-settings')
        assert response.status_code == 200
        assert json.loads(response.data) == {}

        test_settings = {'factor': False}
        with mock.patch('index_builder.views.session', {'factor_settings': test_settings}):
            response = c.get('/index-builder/load-factor-settings')
            unittest.assertEquals(json.loads(response.data), test_settings, 'should load factor settings')


@pytest.mark.unit
def test_save_factor_settings(unittest):
    with app.test_client() as c:
        with nested(
                mock.patch('index_builder.views.session', {'username': 'test', 'factor_settings': {}}),
                mock.patch('__builtin__.open'),
                mock.patch('yaml.safe_dump')
        ) as (_, mock_open, yaml_dump):
            response = c.get(
                '/index-builder/save-factor-settings',
                query_string=dict(factor_settings=json.dumps({'factor': False}))
            )
            assert response.status_code == 200
            args, _ = mock_open.call_args
            assert args[0].endswith('index_builder/data/users/test.yaml')
            args, _ = yaml_dump.call_args
            unittest.assertEquals(args[0], {'locked': False, 'factors': {u'factor': False}}, 'should dump updated settings')


@pytest.mark.unit
def test_lock_factor_settings(unittest):
    with app.test_client() as c:
        factor_settings = {'factor 1': dict(weight=50), 'factor 2': dict(weight=50)}
        session = {'username': 'test', 'factor_settings': dict(factors=factor_settings)}
        with nested(
                mock.patch('index_builder.views.session', session),
                mock.patch('__builtin__.open'),
                mock.patch('yaml.safe_dump'),
                mock.patch('index_builder.views.redirect', mock.Mock(return_value=json.dumps(dict(success=True)))),
        ) as (_, mock_open, yaml_dump, mock_redirect):
            response = c.get('/index-builder/lock-factor-settings')
            assert response.status_code == 200
            args, _ = mock_open.call_args
            assert args[0].endswith('index_builder/data/users/test.yaml')
            args, _ = yaml_dump.call_args
            unittest.assertEquals(args[0], {'locked': True, 'factors': factor_settings}, 'should dump updated settings')
            assert mock_redirect.called

        factor_settings['factor 2']['weight'] = 40
        session = {'username': 'test', 'factor_settings': dict(factors=factor_settings)}
        with nested(
                mock.patch('index_builder.views.session', session),
                mock.patch('__builtin__.open'),
                mock.patch('yaml.safe_dump'),
                mock.patch('index_builder.views.redirect', mock.Mock(return_value=json.dumps(dict(success=True)))),
        ) as (_, mock_open, yaml_dump, mock_redirect):
            response = c.get('/index-builder/lock-factor-settings')
            assert response.status_code == 200
            assert all((not mock_open.called, not yaml_dump.called))
            assert mock_redirect.called


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
    with nested(
        mock.patch('flask.session', mock.Mock(return_value=dict(username='test'))),
        mock.patch('os.listdir', mock.Mock(return_value=['test.yaml'])),
        mock.patch('os.path.isfile', mock.Mock(return_value=True)),
        mock.patch('__builtin__.open'),
        mock.patch('yaml.load', mock.Mock(return_value=dict_merge(TEST_FACTOR_SETTINGS, dict(locked=True))))
    ):
        with app.test_client() as c:
            response = c.get('/index-builder/results-stats')
            assert response.status_code == 200
            assert response.content_type == 'application/json'
            response_data = json.loads(response.data)
            assert 'error' not in response_data
            assert 'test' in response_data['users']
            unittest.assertEquals(
                sorted(response_data['samples']['stats'].keys()),
                sorted(SAMPLE_INDEXES),
                'should load indexes'
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
        with nested(
            mock.patch('index_builder.utils.get_user_counts', mock.Mock(return_value={'locked': 1, 'unlocked': 1})),
            mock.patch('index_builder.utils.get_app_settings', mock.Mock(return_value=dict(summary_viewable=False))),
        ):
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


@pytest.mark.unit
def test_auth():
    with app.test_client() as c:
        with mock.patch('index_builder.auth.session', flask.session):
            app.config['AUTH'] = True
            c.post('/login', data=dict(username='auth_test', password='BukuBucks'), follow_redirects=True)
            assert flask.session['username'] == 'auth_test'
            rv = c.get('/index-builder/factors')
            assert rv.status_code == 200
            del flask.session['username']
            rv = c.get('/index-builder/factors', follow_redirects=True)
            assert 'login-label">Password</span>' in rv.data
            rv = c.get('/logout', follow_redirects=True)
            assert 'login-label">Password</span>' in rv.data
            rv = c.get('/index-builder/factors', follow_redirects=True)
            assert 'login-label">Password</span>' in rv.data
            rv = c.post('/login', data=dict(username='test', password='badpass'), follow_redirects=True)
            assert 'Invalid credentials!' in rv.data
            rv = c.post('/login', data=dict(username='', password='BukuBucks'), follow_redirects=True)
            assert 'Team is required!' in rv.data
            rv = c.post('/login', data=dict(username='>GreaterThan', password='BukuBucks'), follow_redirects=True)
            assert 'Your Team contains one of the following invalid characters: &lt;&gt;/{}[\]~`' in rv.data
            app.config['AUTH'] = None