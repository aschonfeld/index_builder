#!/bin/bash

# start the index_builder server
exec gunicorn server:app \
    --config gunicorn_config.py \
    --bind 0.0.0.0:8080 \
    -w 8 \
    -t 120 \
    --limit-request-line 8190 \
    --log-file=- \
    --access-logfile ~/stdout \
    --error-logfile ~/stderr \
    --log-level=info
    2>&1

"$@"
