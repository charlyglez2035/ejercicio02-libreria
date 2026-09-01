const express = require('express');

const requireAuth = require('../middleware/auth');
const requireAdmin = require('../middleware/authorize');

const {
    getAllGenres,
    getGenreById,
    createGenre,
    updateGenre,
    deleteGenre
} = require('../services/genreService');

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
            message: 'El nombre del género es obligatorio.'
        };
    }

    if (name.length > 120) {
        return {
            valid: false,
            message: 'El nombre no puede exceder 120 caracteres.'
        };
    }

    return { valid: true, name };
}

router.get('/', async (req, res, next) => {
    try {
        const items = await getAllGenres();

        res.render('catalogs/index', {
            title: 'Administración de géneros',
            singular: 'género',
            items,
            idField: 'genre_id',
            basePath: '/admin/genres',
            message: req.query.message || null
        });
    } catch (error) {
        next(error);
    }
});

router.get('/new', (req, res) => {
    res.render('catalogs/form', {
        title: 'Crear género',
        label: 'Nombre del género',
        action: '/admin/genres',
        basePath: '/admin/genres',
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
                title: 'Crear género',
                label: 'Nombre del género',
                action: '/admin/genres',
                basePath: '/admin/genres',
                item: { name: req.body.name || '' },
                maxLength: 120,
                error: validation.message
            });
        }

        const created = await createGenre(validation.name);

        return res.redirect(
            `/admin/genres/${created.genre_id}`
        );
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).render('catalogs/form', {
                title: 'Crear género',
                label: 'Nombre del género',
                action: '/admin/genres',
                basePath: '/admin/genres',
                item: { name: req.body.name || '' },
                maxLength: 120,
                error: 'Ya existe un género con ese nombre.'
            });
        }

        next(error);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).send(
                'Identificador inválido.'
            );
        }

        const item = await getGenreById(id);

        if (!item) {
            return res.status(404).send(
                'Género no encontrado.'
            );
        }

        res.render('catalogs/detail', {
            title: 'Detalle del género',
            item,
            idField: 'genre_id',
            basePath: '/admin/genres'
        });
    } catch (error) {
        next(error);
    }
});

router.get('/:id/edit', async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        const item = await getGenreById(id);

        if (!item) {
            return res.status(404).send(
                'Género no encontrado.'
            );
        }

        res.render('catalogs/form', {
            title: 'Editar género',
            label: 'Nombre del género',
            action: `/admin/genres/${id}`,
            basePath: '/admin/genres',
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
                title: 'Editar género',
                label: 'Nombre del género',
                action: `/admin/genres/${id}`,
                basePath: '/admin/genres',
                item: { name: req.body.name || '' },
                maxLength: 120,
                error: validation.message
            });
        }

        const updated = await updateGenre(
            id,
            validation.name
        );

        if (!updated) {
            return res.status(404).send(
                'Género no encontrado.'
            );
        }

        return res.redirect(`/admin/genres/${id}`);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).render('catalogs/form', {
                title: 'Editar género',
                label: 'Nombre del género',
                action: `/admin/genres/${req.params.id}`,
                basePath: '/admin/genres',
                item: { name: req.body.name || '' },
                maxLength: 120,
                error: 'Ya existe un género con ese nombre.'
            });
        }

        next(error);
    }
});

router.post('/:id/delete', async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        const deleted = await deleteGenre(id);

        if (!deleted) {
            return res.status(404).send(
                'Género no encontrado.'
            );
        }

        return res.redirect(
            '/admin/genres?message=Género eliminado correctamente'
        );
    } catch (error) {
        if (error.code === '23503') {
            const items = await getAllGenres();

            return res.status(409).render('catalogs/index', {
                title: 'Administración de géneros',
                singular: 'género',
                items,
                idField: 'genre_id',
                basePath: '/admin/genres',
                message:
                    'No se puede eliminar el género porque está asociado a uno o más libros.'
            });
        }

        next(error);
    }
});

module.exports = router;