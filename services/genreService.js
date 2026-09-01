const db = require('../config/db');

async function getAllGenres() {
    const result = await db.query(`
        SELECT genre_id, name
        FROM genres
        ORDER BY name
    `);

    return result.rows;
}

async function getGenreById(genreId) {
    const result = await db.query(`
        SELECT genre_id, name
        FROM genres
        WHERE genre_id = $1
    `, [genreId]);

    return result.rows[0] || null;
}

async function createGenre(name) {
    const result = await db.query(`
        INSERT INTO genres (name)
        VALUES ($1)
        RETURNING genre_id, name
    `, [name]);

    return result.rows[0];
}

async function updateGenre(genreId, name) {
    const result = await db.query(`
        UPDATE genres
        SET name = $1
        WHERE genre_id = $2
        RETURNING genre_id, name
    `, [name, genreId]);

    return result.rows[0] || null;
}

async function deleteGenre(genreId) {
    const result = await db.query(`
        DELETE FROM genres
        WHERE genre_id = $1
        RETURNING genre_id
    `, [genreId]);

    return result.rows[0] || null;
}

module.exports = {
    getAllGenres,
    getGenreById,
    createGenre,
    updateGenre,
    deleteGenre
};