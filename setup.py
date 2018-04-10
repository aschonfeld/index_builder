import logging
import sys
from setuptools import setup, find_packages
from setuptools.command.test import test as TestCommand


class PyTest(TestCommand):
    user_options = [('pytest-args=', 'a', "Arguments to pass to py.test")]

    def initialize_options(self):
        TestCommand.initialize_options(self)
        self.pytest_args = []

    def finalize_options(self):
        TestCommand.finalize_options(self)
        self.test_args = []
        self.test_suite = True

    def run_tests(self):
        logging.basicConfig(
            format='%(asctime)s %(levelname)s %(name)s %(message)s',
            level='DEBUG')

        # import here because outside the eggs aren't loaded
        import pytest

        args = self.pytest_args

        args.extend([
            '--cov', 'grail',
            '--cov-report', 'xml:grail_cov.xml',
            '--cov-report', 'html:grail_cov',
            '--junitxml', 'TEST-grail-tests.xml',
            '-v',
            # uncomment this in order to capture all logging
            #'-s',
            'tests/grail',
        ])

        errno = pytest.main(args)
        sys.exit(errno)

setup(
    name='grail',
    cmdclass={'test': PyTest},
    use_scm_version=True,
    setup_requires=['setuptools_scm'],
    packages=find_packages(exclude=['test']),
    package_data={'grail': ['*.yaml']},
    tests_require=[
        'mock',
        'pytest',
        'coverage',
        'pytest-cov',
        'pytest-server-fixtures',
    ],
    install_requires=[
        'scipy',
        'flask',
        'flask-compress',
        'flask-cache',
        'gunicorn',
        'gevent',
        'pympler',
        'XlsxWriter',
    ],
)
