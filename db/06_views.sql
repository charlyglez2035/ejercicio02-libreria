-- db/06_views.sql
-- Views for Exercise 02.
-- Run once against library_db as the database owner / PostgreSQL administrator,
-- AFTER db/05_triggers.sql:
--
--   psql -U postgres -d library_db -f db/06_views.sql

\set ON_ERROR_STOP on

BEGIN;

-- ===========================================================================
-- VIEW 1 - Public catalog listing (RF-04, RF-05)
-- Denormalizes format/category names and aggregates authors, genres and
-- the cover image path so a single SELECT can render the catalog page.
-- ===========================================================================
CREATE OR REPLACE VIEW v_book_catalog AS
SELECT
    b.book_id,
    b.isbn,
    b.title,
    b.publication_year,
    b.price,
    b.stock,
    f.name AS format_name,
    c.name AS category_name,
    (
        SELECT bi.file_path
        FROM book_images bi
        WHERE bi.book_id = b.book_id AND bi.is_cover = TRUE
        LIMIT 1
    ) AS cover_image_path,
    (
        SELECT string_agg(a.name, ', ' ORDER BY a.name)
        FROM book_authors ba
        JOIN authors a ON a.author_id = ba.author_id
        WHERE ba.book_id = b.book_id
    ) AS authors,
    (
        SELECT string_agg(g.name, ', ' ORDER BY g.name)
        FROM book_genres bg
        JOIN genres g ON g.genre_id = bg.genre_id
        WHERE bg.book_id = b.book_id
    ) AS genres
FROM books b
JOIN formats f ON f.format_id = b.format_id
JOIN categories c ON c.category_id = b.category_id;

-- ===========================================================================
-- VIEW 2 - Concept definitions per book (RF-14)
-- ===========================================================================
CREATE OR REPLACE VIEW v_book_concepts_detail AS
SELECT
    b.book_id,
    b.title AS book_title,
    co.concept_id,
    co.name AS concept_name,
    bc.definition,
    bc.chapter_reference,
    bc.page_reference
FROM book_concepts bc
JOIN books b ON b.book_id = bc.book_id
JOIN concepts co ON co.concept_id = bc.concept_id;

-- ===========================================================================
-- VIEW 3 - Safe user listing (RNF-01)
-- Never exposes password_hash. Any admin listing screen or report should
-- read from this view instead of the users table directly.
-- ===========================================================================
CREATE OR REPLACE VIEW v_users_safe AS
SELECT user_id, email, role
FROM users;

-- ===========================================================================
-- Minimum privileges for the Node.js application role (RNF-13).
-- ===========================================================================
GRANT SELECT ON v_book_catalog, v_book_concepts_detail, v_users_safe TO library_app;

COMMIT;

\echo '3 views created successfully.'
