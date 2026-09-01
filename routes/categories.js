const express = require('express');

const requireAuth = require('../middleware/auth');
const requireAdmin = require('../middleware/authorize');

const {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
} = require('../services/categoryService');

const router = express.Router();

router.use(requireAuth);
router.use(requireAdmin);

function validateName(value) {
    const name = typeof value === 'string'
        ? value.trim()
        : '';

    if (!name) {
        return {
            valid: false,
            message: 'El nombre de la categoría es obligatorio.'
        };
    }

    if (name.length > 120) {
        return {
            valid: false,
            message: 'El nombre de la categoría es demasiado largo.'
        };
    }

    return { valid: true, name };
}

router.get('/', async (req, res, next) => {
    try {
        const items = await getAllCategories();

        res.render('catalogs/index', {
            title: 'Administración de categorías',
            singular: 'categoría',
            items,
            idField: 'category_id',
            basePath: '/admin/categories',
            message: req.query.message || null
        });
    } catch (error) {
        next(error);
    }
});

router.get('/new', (req, res) => {
    res.render('catalogs/form', {
        title: 'Crear categoría',
        label: 'Nombre de la categoría',
        action: '/admin/categories',
        basePath: '/admin/categories',
        item: null,
        maxLength: 120,
        error: null
    });
});

router.post('/', async (req, res, next) => {
    try {
        const validation = validateName(req.body.name);

        if (!validation.valid) {
            return res.status(400).render('catalogs/form', {
                title: 'Crear categoría',
                label: 'Nombre de la categoría',
                action: '/admin/categories',
                basePath: '/admin/categories',
                item: { name: req.body.name || '' },
                maxLength: 120,
                error: validation.message
            });
        }

        const created = await createCategory(validation.name);

        return res.redirect(
            `/admin/categories/${created.category_id}`
        );
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).render('catalogs/form', {
                title: 'Crear categoría',
                label: 'Nombre de la categoría',
                action: '/admin/categories',
                basePath: '/admin/categories',
                item: { name: req.body.name || '' },
                maxLength: 120,
                error: 'Ya existe una categoría con ese nombre.'
            });
        }

        next(error);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const item = await getCategoryById(id);

        if (!item) {
            return res.status(404).send(
                'Categoría no encontrada.'
            );
        }

        res.render('catalogs/detail', {
            title: 'Detalle de la categoría',
            item,
            idField: 'category_id',
            basePath: '/admin/categories'
        });
    } catch (error) {
        next(error);
    }
});

router.get('/:id/edit', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const item = await getCategoryById(id);

        if (!item) {
            return res.status(404).send(
                'Categoría no encontrada.'
            );
        }

        res.render('catalogs/form', {
            title: 'Editar categoría',
            label: 'Nombre de la categoría',
            action: `/admin/categories/${id}`,
            basePath: '/admin/categories',
            item,
            maxLength: 120,
            error: null
        });
    } catch (error) {
        next(error);
    }
});

router.post('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const validation = validateName(req.body.name);

        if (!validation.valid) {
            return res.status(400).render('catalogs/form', {
                title: 'Editar categoría',
                label: 'Nombre de la categoría',
                action: `/admin/categories/${id}`,
                basePath: '/admin/categories',
                item: { name: req.body.name || '' },
                maxLength: 120,
                error: validation.message
            });
        }

        const updated = await updateCategory(
            id,
            validation.name
        );

        if (!updated) {
            return res.status(404).send(
                'Categoría no encontrada.'
            );
        }

        return res.redirect(
            `/admin/categories/${id}`
        );
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).render('catalogs/form', {
                title: 'Editar categoría',
                label: 'Nombre de la categoría',
                action: `/admin/categories/${req.params.id}`,
                basePath: '/admin/categories',
                item: { name: req.body.name || '' },
                maxLength: 120,
                error: 'Ya existe una categoría con ese nombre.'
            });
        }

        next(error);
    }
});

router.post('/:id/delete', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const deleted = await deleteCategory(id);

        if (!deleted) {
            return res.status(404).send(
                'Categoría no encontrada.'
            );
        }

        return res.redirect(
            '/admin/categories?message=Categoría eliminada correctamente'
        );
    } catch (error) {
        if (error.code === '23503') {
            const items = await getAllCategories();

            return res.status(409).render('catalogs/index', {
                title: 'Administración de categorías',
                singular: 'categoría',
                items,
                idField: 'category_id',
                basePath: '/admin/categories',
                message:
                    'No se puede eliminar la categoría porque está siendo utilizada por uno o más libros.'
            });
        }

        next(error);
    }
});

module.exports = router;