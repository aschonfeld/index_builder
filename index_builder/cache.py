from dateutil import rrule
import datetime as dt
from decorator import decorator
from inspect import getargspec as _getargspec

from utils import get_logger


def getargspec(func):
    try:
        return func.argspec
    except AttributeError:
        try:
            return _getargspec(func)
        except TypeError:
            raise TypeError("Sorry, this really is not a function, is it?")


def copy_wrapped_attributes(wrapped_fn, fn):

    fn.__doc__ = wrapped_fn.__doc__
    fn.__name__ = wrapped_fn.__name__
    fn.__wrapped__ = getattr(wrapped_fn, '__wrapped__', wrapped_fn)
    if hasattr(wrapped_fn, '__module__'):
        fn.__module__ = wrapped_fn.__module__
    fn.place_as = fn.__wrapped__  # for pytest
    try:
        fn.argspec = getargspec(wrapped_fn)
    except TypeError:
        pass


def ismethod(func):
    try:
        assert _getargspec(func).args[0] == 'self'
        return True
    except:
        pass
    return False


def _get_fn_value(func, cache, key, *args, **kw):
    try:
        return cache[key]
    except KeyError:
        cache[key] = value = func(*args, **kw)
        return value
    except TypeError:
        # Case where key is not hashable, can't use this memoize implementation
        raise


def _memoize_function(func, *args, **kw):
    arglist = tuple(tuple(arg) if isinstance(arg, list) else arg for arg in args)
    key = arglist, frozenset(kw.items())  # frozenset is used to ensure hashability
    cache = func._cache  # attribute added by memoize
    return _get_fn_value(func, cache, key, *args, **kw)


def custom_memoize(cache):
    def inner(func):
        if not ismethod(func):
            # Only initialize cache if it is a functions; methods need
            # to provide their own cache on the object.
            func._cache = cache
            decorated_func = decorator(_memoize_function, func)
            copy_wrapped_attributes(func, decorated_func)
            return decorated_func
        else:
            raise TypeError("Custom memoization for methods is done by defining self._cache in the instance")
    return inner


class ExpiryCache(object):
    """
    A dictionary based cache where entries expire based on an a user specified
    rrule (recurrence rule). See the python-dateutil module for more details
    on defining recurrence rules.
    """
    def __init__(self, expiry):
        """
        Constructor.

        Parameters
        ----------
        expiry : `rrule`
            A user defined dateutil recurrency rule object.
        """
        self._cache = {}
        self.rrule = iter(expiry)
        self.dt_current = next(self.rrule)

    def check_rrule_timeout(self):
        """
        If the current datetime exceeds the current rrule datetime, moves
        to current rrule datetime to the next value defined by the rrule.
        """
        if dt.datetime.now() >= self.dt_current:
            self.dt_current = next(self.rrule)

    @classmethod
    def midnight(cls):
        """
        Returns an rrule that generates datetimes for midnight (local time)
        starting with the current day.
        """
        dt_midnight = dt.datetime(*(dt.datetime.now() + dt.timedelta(days=1)).timetuple()[0:3])
        return rrule.rrule(rrule.DAILY, dtstart=dt_midnight)

    def __getitem__(self, name):
        self.check_rrule_timeout()

        try:
            dt_timeout, insert_time, value = self._cache[name]
        except KeyError:
            raise KeyError('no key %s!' % str(name))

        if dt.datetime.now() >= dt_timeout:
            del self._cache[name]
            raise KeyError('no key %s!' % str(name))

        return value

    def __setitem__(self, name, value):
        self.check_rrule_timeout()
        self._cache[name] = self.dt_current, dt.datetime.now(), value

    def __delitem__(self, name):
        self.check_rrule_timeout()
        del self._cache[name]

    def __len__(self):
        return len(self._cache)

    def clear(self):
        self.check_rrule_timeout()
        self._cache.clear()


logger = get_logger()

PROD_SCHEDULE = rrule.rrule(rrule.DAILY, byhour=(13, 22), byminute=(0,))
FACTOR_CACHE = ExpiryCache(PROD_SCHEDULE)
INDEXES_CACHE = ExpiryCache(PROD_SCHEDULE)
GICS_CACHE = ExpiryCache(PROD_SCHEDULE)


def clear_cache(cache):
    globals()[cache].clear()


def clear_all_caches():
    FACTOR_CACHE.clear()
    INDEXES_CACHE.clear()
    GICS_CACHE.clear()


def create_memory_cache_key(args):
    return tuple(args or []), frozenset()


def clear_memory_value(cache, args):
    # the empty frozenset is because the read_cached_node_data has no kwargs
    key = create_memory_cache_key(args)
    del globals()[cache][key]
