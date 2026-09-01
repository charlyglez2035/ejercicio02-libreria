const { Pool } = require('pg');

const requiredEnvVariables = [
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD'
];

for (const variable of requiredEnvVariables) {
    if (!process.env[variable]) {
        throw new Error(
            `Falta la variable de entorno ${variable}`
        );
    }
}

const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,

    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
});

pool.on('error', (error) => {
    console.error(
        '[PostgreSQL] Error inesperado en el pool:',
        error.message
    );
});

async function query(text, params = []) {
    return pool.query(text, params);
}

async function getClient() {
    return pool.connect();
}

async function testConnection() {
    const result = await pool.query(`
        SELECT
            current_database() AS database,
            current_user AS db_user
    `);

    return result.rows[0];
}

module.exports = {
    query,
    getClient,
    testConnection
};