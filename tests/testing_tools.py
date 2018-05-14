TEST_FACTOR_SETTINGS = dict(
    factors=dict(
        factor_1=dict(reasons=['futureRet','riskReduce'], strength='HI', weight=10),
        factor_2=dict(reasons=['ethics'], strength='HI', weight=20),
        factor_3=dict(reasons=['ethics'], strength='HI', weight=30)
    ),
    locked=False
)


class MockDict(object):
    def __init__(self, data={}):
        self.data = data

    def get(self, key, default=None):
        return self.data.get(key, default)

    def __getitem__(self, key):
        return self.data.get(key)

    def set(self, key, val):
        self.data[key] = val


class MockJinjaEnv(object):

    def __init__(self):
        self.trim_blocks = False
        self.lstrip_blocks = False
        self.auto_reload = False


class MockApp(object):

    def __init__(self, *args, **kwargs):
        self.config = {}
        self.jinja_env = MockJinjaEnv()

    def register_blueprint(self, view):
        pass

    def run(self, host=None, port=None, debug=None):
        pass
