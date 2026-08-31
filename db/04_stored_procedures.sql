-- db/04_stored_procedures.sql
-- Stored procedures and functions for Exercise 02.
-- Run once against library_db as the database owner / PostgreSQL administrator,
-- AFTER db/03_all_quieries_before_stored_procedures.sql:
--
--   psql -U postgres -d library_db -f db/04_stored_procedures.sql

\set ON_ERROR_STOP on

BEGIN;

-- ===========================================================================
-- PROCEDURE 1 - Create a book with its authors and genres in one call
-- (RF-06, RF-12, RF-13). Wraps the multi-table INSERT the service layer
-- would otherwise perform by hand, inside a single transactional unit.
-- ===========================================================================
CREATE OR REPLACE PROCEDURE sp_create_book_with_relations(
    p_isbn VARCHAR,
    p_title VARCHAR,
    p_publication_year SMALLINT,
    p_price NUMERIC,
    p_stock INTEGER,
    p_format_id BIGINT,
    p_category_id BIGINT,
    p_author_ids BIGINT[],
    p_genre_ids BIGINT[],
    INOUT p_book_id BIGINT DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_author_id BIGINT;
    v_genre_id BIGINT;
BEGIN
    INSERT INTO books (isbn, title, publication_year, price, stock, format_id, category_id)
    VALUES (p_isbn, p_title, p_publication_year, p_price, p_stock, p_format_id, p_category_id)
    RETURNING book_id INTO p_book_id;

    FOREACH v_author_id IN ARRAY p_author_ids LOOP
        INSERT INTO book_authors (book_id, author_id) VALUES (p_book_id, v_author_id);
    END LOOP;

    FOREACH v_genre_id IN ARRAY p_genre_ids LOOP
        INSERT INTO book_genres (book_id, genre_id) VALUES (p_book_id, v_genre_id);
    END LOOP;
END;
$$;

-- ===========================================================================
-- PROCEDURE 2 - Set a book's cover image explicitly (RF-16)
-- Validates the image belongs to the book, then relies on
-- trg_book_images_single_cover (created in db/05_triggers.sql) to unset
-- any previous cover automatically.
-- ===========================================================================
CREATE OR REPLACE PROCEDURE sp_set_book_cover(
    p_book_id BIGINT,
    p_image_id BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM book_images
        WHERE image_id = p_image_id
          AND book_id = p_book_id
    ) THEN
        RAISE EXCEPTION 'La imagen % no pertenece al libro %', p_image_id, p_book_id;
    END IF;

    UPDATE book_images SET is_cover = TRUE WHERE image_id = p_image_id;
END;
$$;

-- ===========================================================================
-- FUNCTION 3 - Search books by ISBN or partial title (RF-05)
-- A read-only, reusable function the service layer can call instead of
-- duplicating the ISBN/title search query in application code.
-- ===========================================================================
CREATE OR REPLACE FUNCTION fn_search_books(p_term VARCHAR)
RETURNS TABLE (
    book_id BIGINT,
    isbn VARCHAR,
    title VARCHAR,
    price NUMERIC,
    stock INTEGER
)
LANGUAGE sql
STABLE
AS $$
    SELECT b.book_id, b.isbn, b.title, b.price, b.stock
    FROM books b
    WHERE b.isbn = p_term
       OR lower(b.title) LIKE lower('%' || p_term || '%')
    ORDER BY b.title;
$$;

-- ===========================================================================
-- Minimum privileges for the Node.js application role (RNF-13).
-- ===========================================================================
GRANT EXECUTE ON FUNCTION fn_search_books(VARCHAR) TO library_app;
GRANT EXECUTE ON PROCEDURE sp_create_book_with_relations(
    VARCHAR, VARCHAR, SMALLINT, NUMERIC, INTEGER, BIGINT, BIGINT, BIGINT[], BIGINT[], BIGINT
) TO library_app;
GRANT EXECUTE ON PROCEDURE sp_set_book_cover(BIGINT, BIGINT) TO library_app;

COMMIT;

\echo '2 stored procedures and 1 function created successfully.'
