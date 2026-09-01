const express = require('express');

const requireAuth = require('../middleware/auth');
const requireAdmin = require('../middleware/authorize');

const {
    getAllBooks,
    getBookById,
    getFormats,
    getCategories,
    createBook,
    updateBook,
    deleteBook
} = require('../services/bookService');

const router = express.Router();

router.use(requireAuth);
router.use(requireAdmin);

function validateBook(body) {
    const isbn = typeof body.isbn === 'string'
        ? body.isbn.trim()
        : '';

    const title = typeof body.title === 'string'
        ? body.title.trim()
        : '';

    const publicationYear = Number(body.publicationYear);
    const price = Number(body.price);
    const stock = Number(body.stock);
    const formatId = Number(body.formatId);
    const categoryId = Number(body.categoryId);

    if (!isbn || isbn.length > 20) {
        return {
            valid: false,
            message: 'El ISBN es obligatorio y debe tener máximo 20 caracteres.'
        };
    }

    if (!title || title.length > 255) {
        return {
            valid: false,
            message: 'El título es obligatorio y debe tener máximo 255 caracteres.'
        };
    }

    if (
        !Number.isInteger(publicationYear) ||
        publicationYear < 1 ||
        publicationYear > 9999
    ) {
        return {
            valid: false,
            message: 'El año de publicación no es válido.'
        };
    }

    if (!Number.isFinite(price) || price < 0) {
        return {
            valid: false,
            message: 'El precio debe ser un número mayor o igual a cero.'
        };
    }

    if (!Number.isInteger(stock) || stock < 0) {
        return {
            valid: false,
            message: 'El stock debe ser un entero mayor o igual a cero.'
        };
    }

    if (!Number.isInteger(formatId) || formatId <= 0) {
        return {
            valid: false,
            message: 'Debes seleccionar un formato válido.'
        };
    }

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
        return {
            valid: false,
            message: 'Debes seleccionar una categoría válida.'
        };
    }

    return {
        valid: true,

        book: {
            isbn,
            title,
            publicationYear,
            price,
            stock,
            formatId,
            categoryId
        }
    };
}


// LISTAR
router.get('/', async (req, res, next) => {
    try {
        const books = await getAllBooks();

        res.render('books/index', {
            books,
            message: req.query.message || null
        });
    } catch (error) {
        next(error);
    }
});


// FORMULARIO CREAR
router.get('/new', async (req, res, next) => {
    try {
        const [formats, categories] = await Promise.all([
            getFormats(),
            getCategories()
        ]);

        res.render('books/form', {
            title: 'Crear libro',
            action: '/admin/books',
            book: null,
            formats,
            categories,
            error: null
        });
    } catch (error) {
        next(error);
    }
});


// CREAR
router.post('/', async (req, res, next) => {
    try {
        const validation = validateBook(req.body);

        const [formats, categories] = await Promise.all([
            getFormats(),
            getCategories()
        ]);

        if (!validation.valid) {
            return res.status(400).render('books/form', {
                title: 'Crear libro',
                action: '/admin/books',
                book: req.body,
                formats,
                categories,
                error: validation.message
            });
        }

        const created = await createBook(validation.book);

        return res.redirect(
            `/admin/books/${created.book_id}`
        );
    } catch (error) {
        if (error.code === '23505') {
            const [formats, categories] = await Promise.all([
                getFormats(),
                getCategories()
            ]);

            return res.status(409).render('books/form', {
                title: 'Crear libro',
                action: '/admin/books',
                book: req.body,
                formats,
                categories,
                error: 'Ya existe un libro con ese ISBN.'
            });
        }

        if (error.code === '23503') {
            const [formats, categories] = await Promise.all([
                getFormats(),
                getCategories()
            ]);

            return res.status(400).render('books/form', {
                title: 'Crear libro',
                action: '/admin/books',
                book: req.body,
                formats,
                categories,
                error: 'El formato o la categoría seleccionada no existe.'
            });
        }

        next(error);
    }
});


// DETALLE
router.get('/:id', async (req, res, next) => {
    try {
        const bookId = Number(req.params.id);

        if (!Number.isInteger(bookId) || bookId <= 0) {
            return res.status(400).send('Identificador inválido.');
        }

        const book = await getBookById(bookId);

        if (!book) {
            return res.status(404).send('Libro no encontrado.');
        }

        res.render('books/detail', {
            book
        });
    } catch (error) {
        next(error);
    }
});


// FORMULARIO EDITAR
router.get('/:id/edit', async (req, res, next) => {
    try {
        const bookId = Number(req.params.id);

        if (!Number.isInteger(bookId) || bookId <= 0) {
            return res.status(400).send('Identificador inválido.');
        }

        const [book, formats, categories] = await Promise.all([
            getBookById(bookId),
            getFormats(),
            getCategories()
        ]);

        if (!book) {
            return res.status(404).send('Libro no encontrado.');
        }

        res.render('books/form', {
            title: 'Editar libro',
            action: `/admin/books/${bookId}`,
            book,
            formats,
            categories,
            error: null
        });
    } catch (error) {
        next(error);
    }
});


// ACTUALIZAR
router.post('/:id', async (req, res, next) => {
    try {
        const bookId = Number(req.params.id);

        if (!Number.isInteger(bookId) || bookId <= 0) {
            return res.status(400).send('Identificador inválido.');
        }

        const validation = validateBook(req.body);

        const [formats, categories] = await Promise.all([
            getFormats(),
            getCategories()
        ]);

        if (!validation.valid) {
            return res.status(400).render('books/form', {
                title: 'Editar libro',
                action: `/admin/books/${bookId}`,
                book: {
                    ...req.body,
                    book_id: bookId
                },
                formats,
                categories,
                error: validation.message
            });
        }

        const updated = await updateBook(
            bookId,
            validation.book
        );

        if (!updated) {
            return res.status(404).send('Libro no encontrado.');
        }

        return res.redirect(
            `/admin/books/${bookId}`
        );
    } catch (error) {
        if (error.code === '23505') {
            const [formats, categories] = await Promise.all([
                getFormats(),
                getCategories()
            ]);

            return res.status(409).render('books/form', {
                title: 'Editar libro',
                action: `/admin/books/${req.params.id}`,
                book: req.body,
                formats,
                categories,
                error: 'Ya existe otro libro con ese ISBN.'
            });
        }

        next(error);
    }
});


// ELIMINAR
router.post('/:id/delete', async (req, res, next) => {
    try {
        const bookId = Number(req.params.id);

        if (!Number.isInteger(bookId) || bookId <= 0) {
            return res.status(400).send('Identificador inválido.');
        }

        const deleted = await deleteBook(bookId);

        if (!deleted) {
            return res.status(404).send('Libro no encontrado.');
        }

        return res.redirect(
            '/admin/books?message=Libro eliminado correctamente'
        );
    } catch (error) {
        next(error);
    }
});

module.exports = router;