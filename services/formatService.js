const db = require('../config/db');

async function getAllFormats() {
    const result = await db.query(`
        SELECT format_id, name
        FROM formats
        ORDER BY name
    `);

    return result.rows;
}

async function getFormatById(formatId) {
    const result = await db.query(`
        SELECT format_id, name
        FROM formats
        WHERE format_id = $1
    `, [formatId]);

    return result.rows[0] || null;
}

async function createFormat(name) {
    const result = await db.query(`
        INSERT INTO formats (name)
        VALUES ($1)
        RETURNING format_id, name
    `, [name]);

    return result.rows[0];
}

async function updateFormat(formatId, name) {
    const result = await db.query(`
        UPDATE formats
        SET name = $1
        WHERE format_id = $2
        RETURNING format_id, name
    `, [name, formatId]);

    return result.rows[0] || null;
}

async function deleteFormat(formatId) {
    const result = await db.query(`
        DELETE FROM formats
        WHERE format_id = $1
        RETURNING format_id
    `, [formatId]);

    return result.rows[0] || null;
}

module.exports = {
    getAllFormats,
    getFormatById,
    createFormat,
    updateFormat,
    deleteFormat
};