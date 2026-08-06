#!/bin/sh
# Runs once on first boot of a fresh database volume (L19: least privilege).
# Creates a dedicated application role (musica_app) that owns the public schema,
# so the backend no longer connects to the database as the bootstrap superuser.
#
# NOTE (existing deployments): docker-entrypoint-initdb.d only runs on a brand
# new data directory. If the DB already has data, run the equivalent statements
# manually against the live DB before pointing the backend at musica_app.
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE ROLE musica_app LOGIN PASSWORD '${APP_DB_PASSWORD}';
    GRANT CONNECT ON DATABASE musica_db TO musica_app;
    ALTER SCHEMA public OWNER TO musica_app;
EOSQL
