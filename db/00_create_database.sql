-- db/00_create_database.sql
-- Library monolithic web application - Exercise 02
-- Run this file with psql while connected to the default "postgres" database.
--
-- Example:
--   psql -U postgres -d postgres -v app_password='CHANGE_ME' -f db/00_create_database.sql
--
-- The password is intentionally NOT stored in this file.

\set ON_ERROR_STOP on

\if :{?app_password}
\else
\echo 'ERROR: app_password was not provided.'
\echo 'Example: psql -U postgres -d postgres -v app_password=''CHANGE_ME'' -f db/00_create_database.sql'
\quit 1
\endif

\set app_db 'library_db'
\set app_user 'library_app'

-- Create a non-superuser application role only when it does not already exist.
SELECT format(
    'CREATE ROLE %I LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION',
    :'app_user',
    :'app_password'
)
WHERE NOT EXISTS (
    SELECT 1
    FROM pg_roles
    WHERE rolname = :'app_user'
)
\gexec

-- Create the exercise database only when it does not already exist.
-- CREATE DATABASE cannot run inside a transaction block, therefore psql \gexec is used.
SELECT format(
    'CREATE DATABASE %I WITH ENCODING %L TEMPLATE template0',
    :'app_db',
    'UTF8'
)
WHERE NOT EXISTS (
    SELECT 1
    FROM pg_database
    WHERE datname = :'app_db'
)
\gexec

-- Minimum database-level access for the application role.
-- PUBLIC access is reduced because this is a dedicated exercise database.
SELECT format('REVOKE CONNECT, TEMPORARY ON DATABASE %I FROM PUBLIC', :'app_db')
\gexec

SELECT format('GRANT CONNECT ON DATABASE %I TO %I', :'app_db', :'app_user')
\gexec

\echo 'Database and application role are ready.'
\echo 'Next step: run db/01_schema.sql against library_db as a database owner/administrator.'
