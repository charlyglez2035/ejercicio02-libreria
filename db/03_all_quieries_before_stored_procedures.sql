-- db/03_all_quieries_before_stored_procedures.sql
-- Baseline verification via psql.
-- Run AFTER db/00_create_database.sql, db/01_schema.sql and
-- db/02_seed_30_per_table.sql, and BEFORE db/04_stored_procedures.sql.
--
-- Purpose: document the state of the database (structure, row counts,
-- relations/FKs, integrity, and the ABSENCE of custom procedures, triggers
-- and views) before those objects are added in 04/05/06. Comparing this
-- output against the one produced after 04-06 is part of the evidence
-- required for the report ("verifica y documenta ... utilizando psql").
--
-- Run with:
--   psql -U postgres -d library_db -f db/03_all_quieries_before_stored_procedures.sql
-- (psql meta-commands like \dt, \d+, \df, \dv are processed directly from
-- this file, same as if typed interactively.)

\echo '=== 1. Tables in the schema ==='
\dt

\echo '=== 2. Structure + constraints + triggers per table (baseline: no triggers expected) ==='
\d+ formats
\d+ categories
\d+ authors
\d+ genres
\d+ concepts
\d+ users
\d+ books
\d+ book_authors
\d+ book_genres
\d+ book_concepts
\d+ book_images

\echo '=== 3. Row counts per table (expected: >= 30 for base tables) ==='
SELECT 'formats' AS tabla, count(*) FROM formats
UNION ALL SELECT 'categories', count(*) FROM categories
UNION ALL SELECT 'authors', count(*) FROM authors
UNION ALL SELECT 'genres', count(*) FROM genres
UNION ALL SELECT 'concepts', count(*) FROM concepts
UNION ALL SELECT 'users', count(*) FROM users
UNION ALL SELECT 'books', count(*) FROM books
UNION ALL SELECT 'book_authors', count(*) FROM book_authors
UNION ALL SELECT 'book_genres', count(*) FROM book_genres
UNION ALL SELECT 'book_concepts', count(*) FROM book_concepts
UNION ALL SELECT 'book_images', count(*) FROM book_images
ORDER BY 1;

\echo '=== 4. Relations / foreign keys and their ON DELETE rules ==='
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS tabla_referenciada,
    ccu.column_name AS columna_referenciada,
    rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
     ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
     ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
JOIN information_schema.referential_constraints rc
     ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;

\echo '=== 5. CHECK / UNIQUE constraints ==='
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.constraint_type IN ('CHECK', 'UNIQUE')
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_type;

\echo '=== 6. Triggers currently defined (expected: 0 rows at this point) ==='
SELECT event_object_table AS tabla, trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
ORDER BY event_object_table, trigger_name;

\echo '=== 7. Functions / procedures currently defined (expected: none of ours yet) ==='
\df public.*

\echo '=== 8. Views currently defined (expected: 0 at this point) ==='
\dv

\echo '=== 9. Role privileges of the application user ==='
\du library_app

\echo 'Baseline verification complete. Proceed to db/04_stored_procedures.sql.'
