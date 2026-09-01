const db = require('../config/db');

async function findUserByEmail(email) {
    const sql = `
        SELECT
            user_id,
            email,
            password_hash,
            role
        FROM users
        WHERE LOWER(email) = LOWER($1)
        LIMIT 1
    `;

    const result = await db.query(sql, [email]);

    return result.rows[0] || null;
}

async function createUser(email, passwordHash) {
    const sql = `
        INSERT INTO users (
            email,
            password_hash,
            role
        )
        VALUES ($1, $2, 'USER')
        RETURNING
            user_id,
            email,
            role
    `;

    const result = await db.query(sql, [
        email,
        passwordHash
    ]);

    return result.rows[0];
}

module.exports = {
    findUserByEmail,
    createUser
};