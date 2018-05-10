from collections import namedtuple


class MockDict(object):
    def __init__(self, data={}):
        self.data = data

    def get(self, key, default=None):
        return self.data.get(key, default)

    def __getitem__(self, key):
        return self.data.get(key)

    def set(self, key, val):
        self.data[key] = val


class MockApp(object):

    def __init__(self, *args, **kwargs):
        self.config = {}
        jinja_obj = namedtuple('jinja_env', 'trim_blocks lstrip_blocks')
        self.jinja_env = jinja_obj(trim_blocks=False, lstrip_blocks=False)

    def register_blueprint(self, view):
        pass

    def run(self, host=None, port=None, debug=None):
        pass
