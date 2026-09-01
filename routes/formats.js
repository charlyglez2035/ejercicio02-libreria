const express = require('express');

const requireAuth = require('../middleware/auth');
const requireAdmin = require('../middleware/authorize');

const {
    getAllFormats,
    getFormatById,
    createFormat,
    updateFormat,
    deleteFormat
} = require('../services/formatService');

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
            message: 'El nombre del formato es obligatorio.'
        };
    }

    if (name.length > 120) {
        return {
            valid: false,
            message: 'El nombre del formato es demasiado largo.'
        };
    }

    return { valid: true, name };
}

router.get('/', async (req, res, next) => {
    try {
        const items = await getAllFormats();

        res.render('catalogs/index', {
            title: 'Administración de formatos',
            singular: 'formato',
            items,
            idField: 'format_id',
            basePath: '/admin/formats',
            message: req.query.message || null
        });
    } catch (error) {
        next(error);
    }
});

router.get('/new', (req, res) => {
    res.render('catalogs/form', {
        title: 'Crear formato',
        label: 'Nombre del formato',
        action: '/admin/formats',
        basePath: '/admin/formats',
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
                title: 'Crear formato',
                label: 'Nombre del formato',
                action: '/admin/formats',
                basePath: '/admin/formats',
                item: { name: req.body.name || '' },
                maxLength: 120,
                error: validation.message
            });
        }

        const created = await createFormat(validation.name);

        return res.redirect(
            `/admin/formats/${created.format_id}`
        );
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).render('catalogs/form', {
                title: 'Crear formato',
                label: 'Nombre del formato',
                action: '/admin/formats',
                basePath: '/admin/formats',
                item: { name: req.body.name || '' },
                maxLength: 120,
                error: 'Ya existe un formato con ese nombre.'
            });
        }

        next(error);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const item = await getFormatById(id);

        if (!item) {
            return res.status(404).send(
                'Formato no encontrado.'
            );
        }

        res.render('catalogs/detail', {
            title: 'Detalle del formato',
            item,
            idField: 'format_id',
            basePath: '/admin/formats'
        });
    } catch (error) {
        next(error);
    }
});

router.get('/:id/edit', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const item = await getFormatById(id);

        if (!item) {
            return res.status(404).send(
                'Formato no encontrado.'
            );
        }

        res.render('catalogs/form', {
            title: 'Editar formato',
            label: 'Nombre del formato',
            action: `/admin/formats/${id}`,
            basePath: '/admin/formats',
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
                title: 'Editar formato',
                label: 'Nombre del formato',
                action: `/admin/formats/${id}`,
                basePath: '/admin/formats',
                item: { name: req.body.name || '' },
                maxLength: 120,
                error: validation.message
            });
        }

        const updated = await updateFormat(
            id,
            validation.name
        );

        if (!updated) {
            return res.status(404).send(
                'Formato no encontrado.'
            );
        }

        return res.redirect(`/admin/formats/${id}`);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).render('catalogs/form', {
                title: 'Editar formato',
                label: 'Nombre del formato',
                action: `/admin/formats/${req.params.id}`,
                basePath: '/admin/formats',
                item: { name: req.body.name || '' },
                maxLength: 120,
                error: 'Ya existe un formato con ese nombre.'
            });
        }

        next(error);
    }
});

router.post('/:id/delete', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const deleted = await deleteFormat(id);

        if (!deleted) {
            return res.status(404).send(
                'Formato no encontrado.'
            );
        }

        return res.redirect(
            '/admin/formats?message=Formato eliminado correctamente'
        );
    } catch (error) {
        if (error.code === '23503') {
            const items = await getAllFormats();

            return res.status(409).render('catalogs/index', {
                title: 'Administración de formatos',
                singular: 'formato',
                items,
                idField: 'format_id',
                basePath: '/admin/formats',
                message:
                    'No se puede eliminar el formato porque está siendo utilizado por uno o más libros.'
            });
        }

        next(error);
    }
});

module.exports = router;