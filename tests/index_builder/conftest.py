from mock import patch

pytest_plugins = ['tests.fixtures']


# This sets the flask global session object usually configured in
# app.IndexBuilderFlask.authenticate. It is patched to allow access outside
# of the request context
patch('flask.session', {'logged_in': True, 'username': 'test'}).start()


def pytest_configure(config):
    import sys
    sys._called_from_test = True


def pytest_unconfigure(config):
    import sys
    del sys._called_from_test