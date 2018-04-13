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

        import shlex

        # import here because outside the eggs aren't loaded
        import pytest

        args = [
            '--cov', 'index_builder',
            '--cov-report', 'xml:index_builder_cov.xml',
            '--cov-report', 'htmlindex_builder_cov',
            '--junitxml', 'TEST-index_builder-tests.xml',
            '-v',
            # uncomment this in order to capture all logging
            #'-s',
            'tests/index_builder',
        ]

        pt_args = self.pytest_args
        test_dir = 'tests'
        if len(pt_args):
            if '-a' in sys.argv:
                sys.argv.remove('-a')
            sys.argv.remove(pt_args)
            args = args + shlex.split(pt_args)

        if (not len(pt_args)) or (not re.search('(^|\/| )' + test_dir + '(\/| |$)?', pt_args)):
            args.append(test_dir)
        for arg in ['a', 'b', '', '--fixtures']:
            if arg in sys.argv:
                sys.argv.remove(arg)

        errno = pytest.main(args)
        sys.exit(errno)

setup(
    name='index_builder',
    cmdclass={'test': PyTest},
    use_scm_version=True,
    setup_requires=['setuptools_scm'],
    packages=find_packages(exclude=['test']),
    package_data={'index_builder': ['*.yaml']},
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
