#!/bin/sh
set -e

echo "Waiting for database $POSTGRES_HOST:$POSTGRES_PORT..."
until nc -z "$POSTGRES_HOST" "$POSTGRES_PORT"; do
  sleep 1
done

echo "Applying database migrations"
python manage.py migrate --noinput

echo "Collecting static files"
python manage.py collectstatic --noinput

echo "Starting Gunicorn"
exec gunicorn gestor_estagios.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers 3 \
  --timeout 60


