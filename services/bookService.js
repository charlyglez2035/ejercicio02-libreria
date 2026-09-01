const db = require('../config/db');

async function getAllBooks() {
    const sql = `
        SELECT
            b.book_id,
            b.isbn,
            b.title,
            b.publication_year,
            b.price,
            b.stock,
            f.name AS format_name,
            c.name AS category_name
        FROM books b
        INNER JOIN formats f
            ON f.format_id = b.format_id
        INNER JOIN categories c
            ON c.category_id = b.category_id
        ORDER BY b.book_id
    `;

    const result = await db.query(sql);

    return result.rows;
}

async function getBookById(bookId) {
    const sql = `
        SELECT
            b.book_id,
            b.isbn,
            b.title,
            b.publication_year,
            b.price,
            b.stock,
            b.format_id,
            b.category_id,
            f.name AS format_name,
            c.name AS category_name
        FROM books b
        INNER JOIN formats f
            ON f.format_id = b.format_id
        INNER JOIN categories c
            ON c.category_id = b.category_id
        WHERE b.book_id = $1
    `;

    const result = await db.query(sql, [bookId]);

    return result.rows[0] || null;
}

async function getFormats() {
    const sql = `
        SELECT
            format_id,
            name
        FROM formats
        ORDER BY name
    `;

    const result = await db.query(sql);

    return result.rows;
}

async function getCategories() {
    const sql = `
        SELECT
            category_id,
            name
        FROM categories
        ORDER BY name
    `;

    const result = await db.query(sql);

    return result.rows;
}

async function createBook(book) {
    const sql = `
        INSERT INTO books (
            isbn,
            title,
            publication_year,
            price,
            stock,
            format_id,
            category_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING book_id
    `;

    const values = [
        book.isbn,
        book.title,
        book.publicationYear,
        book.price,
        book.stock,
        book.formatId,
        book.categoryId
    ];

    const result = await db.query(sql, values);

    return result.rows[0];
}

async function updateBook(bookId, book) {
    const sql = `
        UPDATE books
        SET
            isbn = $1,
            title = $2,
            publication_year = $3,
            price = $4,
            stock = $5,
            format_id = $6,
            category_id = $7
        WHERE book_id = $8
        RETURNING book_id
    `;

    const values = [
        book.isbn,
        book.title,
        book.publicationYear,
        book.price,
        book.stock,
        book.formatId,
        book.categoryId,
        bookId
    ];

    const result = await db.query(sql, values);

    return result.rows[0] || null;
}

async function deleteBook(bookId) {
    const sql = `
        DELETE FROM books
        WHERE book_id = $1
        RETURNING book_id
    `;

    const result = await db.query(sql, [bookId]);

    return result.rows[0] || null;
}

module.exports = {
    getAllBooks,
    getBookById,
    getFormats,
    getCategories,
    createBook,
    updateBook,
    deleteBook
};