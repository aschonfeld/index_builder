import pytest
import mock
from contextlib import nested
from collections import namedtuple

import index_builder.server as server
from tests.testing_tools import MockApp


@pytest.mark.unit
def test_update_app_from_command_line(unittest):
    app_obj = namedtuple('app', 'config')
    app = app_obj({})
    server.update_app_from_command_line(app, ['--TEST', 'TEST_VAL'])

    assert app.config['TEST'] == 'TEST_VAL'


@pytest.mark.unit
def test_main(unittest):
    with nested(
        mock.patch('index_builder.server.app', MockApp()),
        mock.patch('flask_compress.Compress'),
        mock.patch('index_builder.server.getuser', mock.Mock(return_value='test'))
    ) as (mock_app, _, _):
        server.main()
        assert mock_app.config['TEMPLATES_AUTO_RELOAD']
        assert mock_app.jinja_env.auto_reload

    with nested(
        mock.patch('index_builder.server.app', MockApp()),
        mock.patch('flask_compress.Compress'),
        mock.patch('index_builder.server.getuser', mock.Mock(return_value='root'))
    ) as (mock_app, _, _):
        server.main()
        assert not mock_app.jinja_env.auto_reload


@pytest.mark.unit
def test_get_send_file_max_age(unittest):
    with server.app.app_context():
        assert 43200 == server.app.get_send_file_max_age('test')
        assert 60 == server.app.get_send_file_max_age('dist/factor_viewer_bundle.js')