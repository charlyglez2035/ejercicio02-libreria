const db = require('../config/db');

async function getAllAuthors() {
    const sql = `
        SELECT
            author_id,
            name
        FROM authors
        ORDER BY name
    `;

    const result = await db.query(sql);

    return result.rows;
}

async function getAuthorById(authorId) {
    const sql = `
        SELECT
            author_id,
            name
        FROM authors
        WHERE author_id = $1
    `;

    const result = await db.query(sql, [authorId]);

    return result.rows[0] || null;
}

async function createAuthor(name) {
    const sql = `
        INSERT INTO authors (
            name
        )
        VALUES ($1)
        RETURNING
            author_id,
            name
    `;

    const result = await db.query(sql, [name]);

    return result.rows[0];
}

async function updateAuthor(authorId, name) {
    const sql = `
        UPDATE authors
        SET name = $1
        WHERE author_id = $2
        RETURNING
            author_id,
            name
    `;

    const result = await db.query(sql, [
        name,
        authorId
    ]);

    return result.rows[0] || null;
}

async function deleteAuthor(authorId) {
    const sql = `
        DELETE FROM authors
        WHERE author_id = $1
        RETURNING author_id
    `;

    const result = await db.query(sql, [authorId]);

    return result.rows[0] || null;
}

module.exports = {
    getAllAuthors,
    getAuthorById,
    createAuthor,
    updateAuthor,
    deleteAuthor
};