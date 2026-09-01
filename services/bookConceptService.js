const db = require('../config/db');

async function getBookSummary(bookId) {
    const result = await db.query(`
        SELECT
            book_id,
            isbn,
            title
        FROM books
        WHERE book_id = $1
    `, [bookId]);

    return result.rows[0] || null;
}

async function getBookConcepts(bookId) {
    const result = await db.query(`
        SELECT
            bc.book_id,
            bc.concept_id,
            c.name AS concept_name,
            bc.definition,
            bc.chapter_reference,
            bc.page_reference
        FROM book_concepts bc
        INNER JOIN concepts c
            ON c.concept_id = bc.concept_id
        WHERE bc.book_id = $1
        ORDER BY c.name
    `, [bookId]);

    return result.rows;
}

async function getAvailableConcepts(bookId) {
    const result = await db.query(`
        SELECT
            c.concept_id,
            c.name
        FROM concepts c
        WHERE NOT EXISTS (
            SELECT 1
            FROM book_concepts bc
            WHERE bc.book_id = $1
              AND bc.concept_id = c.concept_id
        )
        ORDER BY c.name
    `, [bookId]);

    return result.rows;
}

async function getBookConcept(bookId, conceptId) {
    const result = await db.query(`
        SELECT
            bc.book_id,
            bc.concept_id,
            c.name AS concept_name,
            bc.definition,
            bc.chapter_reference,
            bc.page_reference
        FROM book_concepts bc
        INNER JOIN concepts c
            ON c.concept_id = bc.concept_id
        WHERE bc.book_id = $1
          AND bc.concept_id = $2
    `, [
        bookId,
        conceptId
    ]);

    return result.rows[0] || null;
}

async function createBookConcept(
    bookId,
    conceptId,
    definition,
    chapterReference,
    pageReference
) {
    const result = await db.query(`
        INSERT INTO book_concepts (
            book_id,
            concept_id,
            definition,
            chapter_reference,
            page_reference
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING
            book_id,
            concept_id
    `, [
        bookId,
        conceptId,
        definition,
        chapterReference,
        pageReference
    ]);

    return result.rows[0];
}

async function updateBookConcept(
    bookId,
    conceptId,
    definition,
    chapterReference,
    pageReference
) {
    const result = await db.query(`
        UPDATE book_concepts
        SET
            definition = $1,
            chapter_reference = $2,
            page_reference = $3
        WHERE book_id = $4
          AND concept_id = $5
        RETURNING
            book_id,
            concept_id
    `, [
        definition,
        chapterReference,
        pageReference,
        bookId,
        conceptId
    ]);

    return result.rows[0] || null;
}

async function deleteBookConcept(bookId, conceptId) {
    const result = await db.query(`
        DELETE FROM book_concepts
        WHERE book_id = $1
          AND concept_id = $2
        RETURNING
            book_id,
            concept_id
    `, [
        bookId,
        conceptId
    ]);

    return result.rows[0] || null;
}

module.exports = {
    getBookSummary,
    getBookConcepts,
    getAvailableConcepts,
    getBookConcept,
    createBookConcept,
    updateBookConcept,
    deleteBookConcept
};