import os
import sys
from flask import (Flask, redirect, request,
                   url_for, render_template,
                   session)
from flask_compress import Compress
import traceback
from getpass import getuser
import re

from utils import logger, get_factor_settings
from views import index_builder, startup

SHORT_LIFE_PATHS = ['dist']
SHORT_LIFE_TIMEOUT = 60
INVALID_FILENAME_CHARS = re.compile(r"[<>/{}[\]~`]")
INVALID_FILENAME_CHARS_MSG = 'Your Team contains one of the following invalid characters: <>/{}[\]~`'


def authenticate(password):
    return password == 'BukuBucks'


class IndexBuilderFlask(Flask):

    def __init__(self, *args, **kwargs):
        super(IndexBuilderFlask, self).__init__(*args, **kwargs)

    """

    Overriding Flask's implementation of
    get_send_file_max_age so we can lower the
    timeout for javascript and css files which
    are changed more often

    """
    def get_send_file_max_age(self, name):
        if name and any([name.startswith(path) for path in SHORT_LIFE_PATHS]):
            return SHORT_LIFE_TIMEOUT
        return super(IndexBuilderFlask, self).get_send_file_max_age(name)


tmpl_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '', 'templates')
static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '', 'static')
app = IndexBuilderFlask('index_builder', template_folder=tmpl_dir, static_folder=static_dir)
# required to use flask session
app.config['SECRET_KEY'] = 'IndexBuilder'
# required for authentication
app.config['AUTH'] = os.environ.get('AUTH')
# required for data loading
DEFAULT_DATA_PATH = os.path.join(os.path.dirname(__file__), 'data', 'factors')
app.config['DATA_PATH'] = os.environ.get('DATA_PATH', DEFAULT_DATA_PATH)


# configuration from command-line
def update_app_from_command_line(app, rargs):
    for i, arg in enumerate(rargs):
        if arg.startswith('-'):
            logger.info('parsing arg: {}...'.format(arg))
            prop = arg.replace('--', '')
            val = rargs[i + 1] if (i + 1) < len(rargs) else ''
            val = val if not val.startswith('-') else ''
            app.config[prop] = val


rargs = sys.argv[1:]
if rargs:
    update_app_from_command_line(app, rargs)

app.jinja_env.trim_blocks = True
app.jinja_env.lstrip_blocks = True
app.register_blueprint(index_builder)
compress = Compress()
compress.init_app(app)


@app.route('/')
@app.route('/index-builder')
@app.route('/index-builder/main')
def root():
    return redirect('/index-builder/factors')


@app.route('/favicon.ico')
def favicon():
    return redirect(url_for('static', filename='images/favicon.ico'))


@app.errorhandler(404)
def page_not_found(e=None):
    return render_template('index_builder/errors/404.html', error=e, stacktrace=str(traceback.format_exc())), 404


@app.route('/500')
@app.errorhandler(500)
def internal_server_error(e=None):
    return render_template('index_builder/errors/500.html', error=e, stacktrace=str(traceback.format_exc())), 500


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        if app.config.get('AUTH') and not authenticate(request.form['password']):
            return render_template('index_builder/login.html', error='Invalid credentials!', page='login')
        if not request.form['username']:
            return render_template('index_builder/login.html', error='Team is required!', page='login')
        if INVALID_FILENAME_CHARS.search(request.form['username']):
            return render_template('index_builder/login.html', error=INVALID_FILENAME_CHARS_MSG, page='login')
        session['logged_in'] = True
        session['username'] = request.form['username']
        session['factor_settings'] = get_factor_settings(session['username'])
        return redirect(session.get('next') or '/')
    return render_template('index_builder/login.html', page='login')


@app.route('/index')
def index():
    return render_template(
        'index_builder/login.html', page='login',
        error='You do not have the proper permissions to view this page. Please e-mail support-NI@man.com'
    )


@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))


startup(app.config['DATA_PATH'])


def main():
    debug = getuser() != 'root'
    if debug:
        app.jinja_env.auto_reload = True
        app.config['TEMPLATES_AUTO_RELOAD'] = True
    app.run(host=app.config.get('HOST'), port=int(app.config.get('PORT', 9200)), debug=debug)

if __name__ == '__main__':
    main()
