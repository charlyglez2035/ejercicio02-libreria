const db = require('../config/db');

async function getAllCategories() {
    const result = await db.query(`
        SELECT category_id, name
        FROM categories
        ORDER BY name
    `);

    return result.rows;
}

async function getCategoryById(categoryId) {
    const result = await db.query(`
        SELECT category_id, name
        FROM categories
        WHERE category_id = $1
    `, [categoryId]);

    return result.rows[0] || null;
}

async function createCategory(name) {
    const result = await db.query(`
        INSERT INTO categories (name)
        VALUES ($1)
        RETURNING category_id, name
    `, [name]);

    return result.rows[0];
}

async function updateCategory(categoryId, name) {
    const result = await db.query(`
        UPDATE categories
        SET name = $1
        WHERE category_id = $2
        RETURNING category_id, name
    `, [name, categoryId]);

    return result.rows[0] || null;
}

async function deleteCategory(categoryId) {
    const result = await db.query(`
        DELETE FROM categories
        WHERE category_id = $1
        RETURNING category_id
    `, [categoryId]);

    return result.rows[0] || null;
}

module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};