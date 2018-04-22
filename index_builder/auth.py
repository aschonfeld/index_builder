from flask import (request, session, redirect, url_for)
from functools import wraps


def requires_auth(f):

    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get('logged_in'):
            session['next'] = request.url
            return redirect(url_for('login'))
        elif not session.get('username'):
            session['next'] = request.url
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated
