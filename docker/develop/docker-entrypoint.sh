#!/bin/bash
python setup.py develop
python setup.grail_gen.py develop
exec "$@"