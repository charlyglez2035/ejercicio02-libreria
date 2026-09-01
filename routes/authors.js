const express = require('express');

const requireAuth = require('../middleware/auth');
const requireAdmin = require('../middleware/authorize');

const {
    getAllAuthors,
    getAuthorById,
    createAuthor,
    updateAuthor,
    deleteAuthor
} = require('../services/authorService');

const router = express.Router();

// Todo este CRUD es exclusivo del ADMIN.
router.use(requireAuth);
router.use(requireAdmin);


function validateName(value) {
    const name = typeof value === 'string'
        ? value.trim()
        : '';

    if (!name) {
        return {
            valid: false,
            message: 'El nombre del autor es obligatorio.'
        };
    }

    if (name.length > 160) {
        return {
            valid: false,
            message: 'El nombre no puede exceder 160 caracteres.'
        };
    }

    return {
        valid: true,
        name
    };
}


// --------------------------------------------------
// LISTAR
// --------------------------------------------------

router.get('/', async (req, res, next) => {
    try {
        const authors = await getAllAuthors();

        res.render('authors/index', {
            authors,
            message: req.query.message || null
        });
    } catch (error) {
        next(error);
    }
});


// --------------------------------------------------
// FORMULARIO CREAR
// --------------------------------------------------

router.get('/new', (req, res) => {
    res.render('authors/form', {
        title: 'Crear autor',
        action: '/admin/authors',
        author: null,
        error: null
    });
});


// --------------------------------------------------
// CREAR
// --------------------------------------------------

router.post('/', async (req, res, next) => {
    try {
        const validation = validateName(req.body.name);

        if (!validation.valid) {
            return res.status(400).render('authors/form', {
                title: 'Crear autor',
                action: '/admin/authors',
                author: {
                    name: req.body.name || ''
                },
                error: validation.message
            });
        }

        const created = await createAuthor(
            validation.name
        );

        return res.redirect(
            `/admin/authors/${created.author_id}`
        );
    } catch (error) {
        next(error);
    }
});


// --------------------------------------------------
// DETALLE
// --------------------------------------------------

router.get('/:id', async (req, res, next) => {
    try {
        const authorId = Number(req.params.id);

        if (
            !Number.isInteger(authorId) ||
            authorId <= 0
        ) {
            return res
                .status(400)
                .send('Identificador inválido.');
        }

        const author = await getAuthorById(authorId);

        if (!author) {
            return res
                .status(404)
                .send('Autor no encontrado.');
        }

        res.render('authors/detail', {
            author
        });
    } catch (error) {
        next(error);
    }
});


// --------------------------------------------------
// FORMULARIO EDITAR
// --------------------------------------------------

router.get('/:id/edit', async (req, res, next) => {
    try {
        const authorId = Number(req.params.id);

        if (
            !Number.isInteger(authorId) ||
            authorId <= 0
        ) {
            return res
                .status(400)
                .send('Identificador inválido.');
        }

        const author = await getAuthorById(authorId);

        if (!author) {
            return res
                .status(404)
                .send('Autor no encontrado.');
        }

        res.render('authors/form', {
            title: 'Editar autor',
            action: `/admin/authors/${authorId}`,
            author,
            error: null
        });
    } catch (error) {
        next(error);
    }
});


// --------------------------------------------------
// ACTUALIZAR
// --------------------------------------------------

router.post('/:id', async (req, res, next) => {
    try {
        const authorId = Number(req.params.id);

        if (
            !Number.isInteger(authorId) ||
            authorId <= 0
        ) {
            return res
                .status(400)
                .send('Identificador inválido.');
        }

        const validation = validateName(req.body.name);

        if (!validation.valid) {
            return res.status(400).render('authors/form', {
                title: 'Editar autor',
                action: `/admin/authors/${authorId}`,
                author: {
                    author_id: authorId,
                    name: req.body.name || ''
                },
                error: validation.message
            });
        }

        const updated = await updateAuthor(
            authorId,
            validation.name
        );

        if (!updated) {
            return res
                .status(404)
                .send('Autor no encontrado.');
        }

        return res.redirect(
            `/admin/authors/${authorId}`
        );
    } catch (error) {
        next(error);
    }
});


// --------------------------------------------------
// ELIMINAR
// --------------------------------------------------

router.post('/:id/delete', async (req, res, next) => {
    try {
        const authorId = Number(req.params.id);

        if (
            !Number.isInteger(authorId) ||
            authorId <= 0
        ) {
            return res
                .status(400)
                .send('Identificador inválido.');
        }

        const deleted = await deleteAuthor(authorId);

        if (!deleted) {
            return res
                .status(404)
                .send('Autor no encontrado.');
        }

        return res.redirect(
            '/admin/authors?message=Autor eliminado correctamente'
        );
    } catch (error) {
        // FK RESTRICT de book_authors -> authors.
        if (error.code === '23503') {
            const authors = await getAllAuthors();

            return res.status(409).render(
                'authors/index',
                {
                    authors,
                    message:
                        'No se puede eliminar el autor porque está asociado a uno o más libros.'
                }
            );
        }

        next(error);
    }
});

module.exports = router;