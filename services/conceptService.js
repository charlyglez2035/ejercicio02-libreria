const db = require('../config/db');

async function getAllConcepts() {
    const result = await db.query(`
        SELECT concept_id, name
        FROM concepts
        ORDER BY name
    `);

    return result.rows;
}

async function getConceptById(conceptId) {
    const result = await db.query(`
        SELECT concept_id, name
        FROM concepts
        WHERE concept_id = $1
    `, [conceptId]);

    return result.rows[0] || null;
}

async function createConcept(name) {
    const result = await db.query(`
        INSERT INTO concepts (name)
        VALUES ($1)
        RETURNING concept_id, name
    `, [name]);

    return result.rows[0];
}

async function updateConcept(conceptId, name) {
    const result = await db.query(`
        UPDATE concepts
        SET name = $1
        WHERE concept_id = $2
        RETURNING concept_id, name
    `, [name, conceptId]);

    return result.rows[0] || null;
}

async function deleteConcept(conceptId) {
    const result = await db.query(`
        DELETE FROM concepts
        WHERE concept_id = $1
        RETURNING concept_id
    `, [conceptId]);

    return result.rows[0] || null;
}

module.exports = {
    getAllConcepts,
    getConceptById,
    createConcept,
    updateConcept,
    deleteConcept
};