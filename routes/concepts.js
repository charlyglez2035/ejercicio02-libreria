const express = require('express');

const requireAuth = require('../middleware/auth');
const requireAdmin = require('../middleware/authorize');

const {
    getAllConcepts,
    getConceptById,
    createConcept,
    updateConcept,
    deleteConcept
} = require('../services/conceptService');

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
            message: 'El nombre del concepto es obligatorio.'
        };
    }

    if (name.length > 160) {
        return {
            valid: false,
            message: 'El nombre no puede exceder 160 caracteres.'
        };
    }

    return { valid: true, name };
}

router.get('/', async (req, res, next) => {
    try {
        const items = await getAllConcepts();

        res.render('catalogs/index', {
            title: 'Administración de conceptos',
            singular: 'concepto',
            items,
            idField: 'concept_id',
            basePath: '/library/admin/concepts',
            message: req.query.message || null
        });
    } catch (error) {
        next(error);
    }
});

router.get('/new', (req, res) => {
    res.render('catalogs/form', {
        title: 'Crear concepto',
        label: 'Nombre del concepto',
        action: '/library/admin/concepts',
        basePath: '/library/admin/concepts',
        item: null,
        maxLength: 160,
        error: null
    });
});

router.post('/', async (req, res, next) => {
    try {
        const validation = validateName(req.body.name);

        if (!validation.valid) {
            return res.status(400).render('catalogs/form', {
                title: 'Crear concepto',
                label: 'Nombre del concepto',
                action: '/library/admin/concepts',
                basePath: '/library/admin/concepts',
                item: { name: req.body.name || '' },
                maxLength: 160,
                error: validation.message
            });
        }

        const created = await createConcept(validation.name);

        return res.redirect(
            `/library/admin/concepts/${created.concept_id}`
        );
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).render('catalogs/form', {
                title: 'Crear concepto',
                label: 'Nombre del concepto',
                action: '/library/admin/concepts',
                basePath: '/library/admin/concepts',
                item: { name: req.body.name || '' },
                maxLength: 160,
                error: 'Ya existe un concepto con ese nombre.'
            });
        }

        next(error);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const item = await getConceptById(id);

        if (!item) {
            return res.status(404).send(
                'Concepto no encontrado.'
            );
        }

        res.render('catalogs/detail', {
            title: 'Detalle del concepto',
            item,
            idField: 'concept_id',
            basePath: '/library/admin/concepts'
        });
    } catch (error) {
        next(error);
    }
});

router.get('/:id/edit', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const item = await getConceptById(id);

        if (!item) {
            return res.status(404).send(
                'Concepto no encontrado.'
            );
        }

        res.render('catalogs/form', {
            title: 'Editar concepto',
            label: 'Nombre del concepto',
            action: `/library/admin/concepts/${id}`,
            basePath: '/library/admin/concepts',
            item,
            maxLength: 160,
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
                title: 'Editar concepto',
                label: 'Nombre del concepto',
                action: `/library/admin/concepts/${id}`,
                basePath: '/library/admin/concepts',
                item: { name: req.body.name || '' },
                maxLength: 160,
                error: validation.message
            });
        }

        const updated = await updateConcept(
            id,
            validation.name
        );

        if (!updated) {
            return res.status(404).send(
                'Concepto no encontrado.'
            );
        }

        return res.redirect(
            `/library/admin/concepts/${id}`
        );
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).render('catalogs/form', {
                title: 'Editar concepto',
                label: 'Nombre del concepto',
                action: `/library/admin/concepts/${req.params.id}`,
                basePath: '/library/admin/concepts',
                item: { name: req.body.name || '' },
                maxLength: 160,
                error: 'Ya existe un concepto con ese nombre.'
            });
        }

        next(error);
    }
});

router.post('/:id/delete', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const deleted = await deleteConcept(id);

        if (!deleted) {
            return res.status(404).send(
                'Concepto no encontrado.'
            );
        }

        return res.redirect(
            '/library/admin/concepts?message=Concepto eliminado correctamente'
        );
    } catch (error) {
        if (error.code === '23503') {
            const items = await getAllConcepts();

            return res.status(409).render('catalogs/index', {
                title: 'Administración de conceptos',
                singular: 'concepto',
                items,
                idField: 'concept_id',
                basePath: '/library/admin/concepts',
                message:
                    'No se puede eliminar el concepto porque está asociado a uno o más libros.'
            });
        }

        next(error);
    }
});

module.exports = router;