import pytest
import json
import mock
from contextlib import nested
import flask
import pandas as pd
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
        mock.patch('flask_compress.Compress')
    ):
        server.main()