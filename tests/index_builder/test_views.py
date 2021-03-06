import pytest
import json
import mock
from contextlib import nested
import flask
import pandas as pd
from collections import namedtuple

from index_builder.server import app
import index_builder.views as views
from index_builder.model import SAMPLE_INDEXES
from index_builder.utils import dict_merge, USERS_PATH, DATA_PATH
from tests.testing_tools import MockDict, TEST_FACTOR_SETTINGS


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

        with mock.patch('index_builder.views.session', mock.Mock(side_effect=Exception())):
            response = c.get(
                '/index-builder/save-factor-settings',
                query_string=dict(factor_settings=json.dumps({'factor': False}))
            )
            assert response.status_code == 200
            response_data = json.loads(response.data)
            assert 'error' in response_data


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

        with mock.patch('index_builder.views.session', mock.Mock(side_effect=Exception())):
            response = c.get('/index-builder/lock-factor-settings')
            assert response.status_code == 200
            response_data = json.loads(response.data)
            assert 'error' in response_data

        session['factor_settings']['factors']['factor 2']['weight'] = 40
        with nested(
            mock.patch('index_builder.views.session', session),
            mock.patch('index_builder.views.flash'),
            mock.patch('__builtin__.open'),
            mock.patch('yaml.safe_dump'),
            mock.patch('index_builder.views.redirect', mock.Mock(return_value=json.dumps(dict(success=True)))),
        ) as (_, mock_flash, mock_open, yaml_dump, mock_redirect):
            response = c.get('/index-builder/lock-factor-settings')
            assert response.status_code == 200
            assert all((not mock_open.called, not yaml_dump.called))
            assert mock_redirect.called

            args, _ = mock_flash.call_args
            assert args[0] == "Your total weights are less than 100!"


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

    with mock.patch('index_builder.views.get_indexes', mock.Mock(side_effect=Exception())):
        response = app.test_client().get('/index-builder/sample-indexes')
        assert response.status_code == 200
        assert response.content_type == 'application/json'
        response_data = json.loads(response.data)
        assert 'error' in response_data


@pytest.mark.unit
def test_load_results_stats(unittest):
    with nested(
        mock.patch('flask.session', mock.Mock(return_value=dict(username='test'))),
        mock.patch('os.listdir', mock.Mock(return_value=['test.yaml'])),
        mock.patch('os.path.isfile', mock.Mock(return_value=True)),
        mock.patch('__builtin__.open'),
        mock.patch('yaml.load', mock.Mock(return_value=dict_merge(TEST_FACTOR_SETTINGS, dict(locked=True))))
    ):
        response = app.test_client().get('/index-builder/results-stats')
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


    def mock_listdir(path):
        if path == DATA_PATH:
            return ['users_test', 'noise']
        return ['test.yaml']

    with nested(
        mock.patch('index_builder.views.session', MockDict(dict(username='admin'))),
        mock.patch('os.listdir', mock_listdir),
        mock.patch('os.path.isfile', mock.Mock(return_value=True)),
        mock.patch('__builtin__.open'),
        mock.patch('yaml.load', mock.Mock(return_value=dict_merge(TEST_FACTOR_SETTINGS, dict(locked=True))))
    ):
        response = app.test_client().get('/index-builder/results-stats')
        assert response.status_code == 200
        assert response.content_type == 'application/json'
        response_data = json.loads(response.data)
        assert response_data['users']['test']['stats']['unlockable']
        assert response_data['archives'] == [u'test']

    with mock.patch('index_builder.views.get_indexes', mock.Mock(side_effect=Exception())):
        response = app.test_client().get('/index-builder/results-stats')
        assert response.status_code == 200
        assert response.content_type == 'application/json'
        response_data = json.loads(response.data)
        assert 'error' in response_data


@pytest.mark.unit
def test_load_cumulative_returns(unittest):
    with mock.patch('index_builder.views.utils.get_factor_settings', mock.Mock(return_value=TEST_FACTOR_SETTINGS)):
        response = app.test_client().get(
            '/index-builder/cumulative-returns',
            query_string=dict(user='Test User', samples='sample_index_1')
        )
        assert response.status_code == 200
        assert response.content_type == 'application/json'
        response_data = json.loads(response.data)
        assert 'error' not in response_data

    with mock.patch('index_builder.views.get_indexes', mock.Mock(side_effect=Exception())):
        response = app.test_client().get(
            '/index-builder/cumulative-returns',
            query_string=dict(user='Test User', samples='sample_index_1')
        )
        assert response.status_code == 200
        assert response.content_type == 'application/json'
        response_data = json.loads(response.data)
        assert 'error' in response_data


@pytest.mark.unit
def test_load_user_results(unittest):
    with mock.patch('index_builder.views.utils.get_factor_settings', mock.Mock(return_value=TEST_FACTOR_SETTINGS)):
        response = app.test_client().get('/index-builder/user-results', query_string=dict(user='Test User'))
        assert response.status_code == 200
        assert response.content_type == 'application/json'
        response_data = json.loads(response.data)
        assert 'error' not in response_data

    with mock.patch('index_builder.views.get_indexes', mock.Mock(side_effect=Exception())):
        response = app.test_client().get('/index-builder/user-results', query_string=dict(user='Test User'))
        assert response.status_code == 200
        assert response.content_type == 'application/json'
        response_data = json.loads(response.data)
        assert 'error' in response_data


@pytest.mark.unit
def test_find_summary_data(unittest):
    with mock.patch(
            'index_builder.views.utils.get_all_user_factors',
            mock.Mock(return_value=[('TestUser', TEST_FACTOR_SETTINGS['factors'])])
    ):
        response = app.test_client().get('/index-builder/summary-data')
        assert response.status_code == 200
        assert response.content_type == 'application/json'
        response_data = json.loads(response.data)
        assert 'error' not in response_data

    with mock.patch('index_builder.views.get_factors', mock.Mock(side_effect=Exception())):
        response = app.test_client().get('/index-builder/summary-data')
        assert response.status_code == 200
        assert response.content_type == 'application/json'
        response_data = json.loads(response.data)
        assert 'error' in response_data


@pytest.mark.unit
def test_unlock_factor_settings(unittest):
    factor_settings = dict(
        factors={
            'factor_1': dict(weight=20, strength='HI', reasons=['blah']),
            'factor_2': dict(weight=80, strength='HI', reasons=['blah'])
        }
    )
    with nested(
        mock.patch('index_builder.utils.dump_yaml'),
        mock.patch('os.listdir', mock.Mock(return_value=['test.yaml'])),
        mock.patch('index_builder.utils.load_yaml', mock.Mock(
            return_value=dict(username='test', factor_settings=factor_settings, locked=False))
        ),
    ) as (mock_dump, _, _):
        with app.test_client() as c:
            response = c.get('/index-builder/unlock-factor-settings', query_string=dict(user='test'))
            assert response.status_code == 200

            args, _ = mock_dump.call_args
            settings, name = args
            assert name.endswith('test.yaml')
            assert not settings['locked']

            response_data = json.loads(response.data)
            assert response_data['locked'] == 0
            assert response_data['unlocked'] == 1

    with mock.patch('index_builder.utils.get_factor_settings', mock.Mock(side_effect=Exception())):
            response = c.get('/index-builder/unlock-factor-settings', query_string=dict(user='test'))
            assert response.status_code == 200
            response_data = json.loads(response.data)
            assert 'error' in response_data


@pytest.mark.unit
def test_lock_summary(unittest):

    with nested(
        mock.patch('index_builder.utils.load_yaml', mock.Mock(return_value=dict(summary_viewable=True))),
        mock.patch('index_builder.utils.dump_yaml'),
    ) as (_, mock_dump):
        with app.test_client() as c:
            response = c.get('/index-builder/lock-summary')
            assert response.status_code == 302
            args, _ = mock_dump.call_args
            settings, name = args
            assert name.endswith('app_settings.yaml')
            assert not settings['summary_viewable']

    with mock.patch('index_builder.utils.dump_app_settings', mock.Mock(side_effect=Exception())):
        response = c.get('/index-builder/lock-summary')
        assert response.status_code == 200
        response_data = json.loads(response.data)
        assert 'error' in response_data


@pytest.mark.unit
def test_unlock_summary(unittest):

    with nested(
        mock.patch('index_builder.utils.load_yaml', mock.Mock(return_value=dict(summary_viewable=False))),
        mock.patch('index_builder.utils.dump_yaml'),
    ) as (_, mock_dump):
        with app.test_client() as c:
            response = c.get('/index-builder/unlock-summary')
            assert response.status_code == 302
            args, _ = mock_dump.call_args
            settings, name = args
            assert name.endswith('app_settings.yaml')
            assert settings['summary_viewable']

    with mock.patch('index_builder.utils.dump_app_settings', mock.Mock(side_effect=Exception())):
        response = c.get('/index-builder/unlock-summary')
        assert response.status_code == 200
        response_data = json.loads(response.data)
        assert 'error' in response_data


@pytest.mark.unit
def test_archive_user_settings(unittest):
    with nested(
        mock.patch('os.rename'),
        mock.patch('os.path.isdir', mock.Mock(return_value=False)),
        mock.patch('os.makedirs')
    ) as (mock_rename, _, mock_makedirs):
        with app.test_client() as c:
            response = c.get('/index-builder/archive-user-settings')
            assert response.status_code == 200
            args, _ = mock_rename.call_args
            path1, path2 = args
            assert path1 == USERS_PATH
            assert path2.startswith('{}_{}'.format(USERS_PATH, pd.Timestamp('now').strftime('%Y%m%d')))
            args, _ = mock_makedirs.call_args
            assert args[0] == USERS_PATH

    with mock.patch('index_builder.utils.archive_all_user_factor_settings', mock.Mock(side_effect=Exception())):
        response = c.get('/index-builder/archive-user-settings')
        assert response.status_code == 200
        response_data = json.loads(response.data)
        assert 'error' in response_data


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
        for path in ['/', '/index-builder', '/index-builder/main', '/logout', '/favicon.ico']:
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


@pytest.mark.unit
def test_load_page():
    with app.test_request_context():
        req = namedtuple('req', 'referrer')
        with nested(
            mock.patch('index_builder.views.request', mock.Mock(return_value=req('login'))),
            mock.patch('index_builder.views.session', MockDict(dict(username='test'))),
            mock.patch('os.path.isfile', mock.Mock(return_value=True)),
            mock.patch('index_builder.utils.get_user_counts', mock.Mock(return_value=dict(locked=0, unlocked=0))),
            mock.patch('index_builder.utils.get_app_settings', mock.Mock(return_value=dict(summary_viewable=False))),
            mock.patch('index_builder.views.render_template'),
        ) as (_, _, _, _, _, mock_render):
            views.load_page('factors')
            args, kwargs = mock_render.call_args
            assert args[0] == 'index_builder/factors.html'
            assert kwargs['page'] == 'factors'
            assert 'user_counts' in kwargs
            assert 'app_settings' in kwargs
            assert kwargs['warning'] == views.PREEXISTING_USER.format('test')