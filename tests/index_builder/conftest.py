import pytest
from mock import patch
from functools import wraps

pytest_plugins = ['tests.fixtures']


def noauth(f):
    """Pass through decorator"""
    @wraps(f)
    def decorated(*args, **kwargs):
        return f(*args, **kwargs)
    return decorated


# These must be patched before flask is imported by otehr means
patch('index_builder.auth.requires_auth', noauth).start()

# This sets the flask global session object usually configured in
# app.IndexBuilderFlask.authenticate. It is patched to allow access outside
# of the request context
patch('flask.session', {}).start()


def pytest_configure(config):
    import sys
    sys._called_from_test = True


def pytest_unconfigure(config):
    import sys
    del sys._called_from_test