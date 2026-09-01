const express = require('express');

const requireAuth = require('../middleware/auth');
const requireAdmin = require('../middleware/authorize');

const {
    getBookSummary,
    getBookConcepts,
    getAvailableConcepts,
    getBookConcept,
    createBookConcept,
    updateBookConcept,
    deleteBookConcept
} = require('../services/bookConceptService');

const router = express.Router({
    mergeParams: true
});

router.use(requireAuth);
router.use(requireAdmin);

function validateBookId(value) {
    const id = Number(value);

    return Number.isInteger(id) && id > 0
        ? id
        : null;
}

function validateConceptId(value) {
    const id = Number(value);

    return Number.isInteger(id) && id > 0
        ? id
        : null;
}

function validateForm(body) {
    const conceptId = validateConceptId(
        body.conceptId
    );

    const definition =
        typeof body.definition === 'string'
            ? body.definition.trim()
            : '';

    const chapterReference =
        typeof body.chapterReference === 'string'
            ? body.chapterReference.trim()
            : '';

    const pageReference =
        typeof body.pageReference === 'string'
            ? body.pageReference.trim()
            : '';

    if (!conceptId) {
        return {
            valid: false,
            message:
                'Debes seleccionar un concepto válido.'
        };
    }

    if (!definition) {
        return {
            valid: false,
            message:
                'La definición es obligatoria.'
        };
    }

    if (chapterReference.length > 120) {
        return {
            valid: false,
            message:
                'La referencia de capítulo no puede exceder 120 caracteres.'
        };
    }

    if (pageReference.length > 50) {
        return {
            valid: false,
            message:
                'La referencia de página no puede exceder 50 caracteres.'
        };
    }

    return {
        valid: true,
        conceptId,
        definition,
        chapterReference:
            chapterReference || null,
        pageReference:
            pageReference || null
    };
}

// LISTADO
router.get('/', async (req, res, next) => {
    try {
        const bookId = validateBookId(
            req.params.bookId
        );

        if (!bookId) {
            return res
                .status(400)
                .send('Libro inválido.');
        }

        const book = await getBookSummary(bookId);

        if (!book) {
            return res
                .status(404)
                .send('Libro no encontrado.');
        }

        const bookConcepts =
            await getBookConcepts(bookId);

        res.render('book-concepts/index', {
            book,
            bookConcepts,
            message: req.query.message || null
        });
    } catch (error) {
        next(error);
    }
});

// FORMULARIO NUEVO
router.get('/new', async (req, res, next) => {
    try {
        const bookId = validateBookId(
            req.params.bookId
        );

        if (!bookId) {
            return res
                .status(400)
                .send('Libro inválido.');
        }

        const book = await getBookSummary(bookId);

        if (!book) {
            return res
                .status(404)
                .send('Libro no encontrado.');
        }

        const concepts =
            await getAvailableConcepts(bookId);

        res.render('book-concepts/form', {
            title: 'Agregar concepto al libro',
            action:
                `/library/admin/books/${bookId}/concepts`,
            book,
            concepts,
            bookConcept: null,
            isEdit: false,
            error: null
        });
    } catch (error) {
        next(error);
    }
});

// CREAR RELACIÓN
router.post('/', async (req, res, next) => {
    try {
        const bookId = validateBookId(
            req.params.bookId
        );

        if (!bookId) {
            return res
                .status(400)
                .send('Libro inválido.');
        }

        const validation =
            validateForm(req.body);

        if (!validation.valid) {
            const book =
                await getBookSummary(bookId);

            const concepts =
                await getAvailableConcepts(bookId);

            return res.status(400).render(
                'book-concepts/form',
                {
                    title:
                        'Agregar concepto al libro',
                    action:
                        `/library/admin/books/${bookId}/concepts`,
                    book,
                    concepts,
                    bookConcept: req.body,
                    isEdit: false,
                    error: validation.message
                }
            );
        }

        await createBookConcept(
            bookId,
            validation.conceptId,
            validation.definition,
            validation.chapterReference,
            validation.pageReference
        );

        return res.redirect(
            `/library/admin/books/${bookId}/concepts?message=Concepto asociado correctamente`
        );
    } catch (error) {
        if (error.code === '23505') {
            const bookId = Number(
                req.params.bookId
            );

            const book =
                await getBookSummary(bookId);

            const concepts =
                await getAvailableConcepts(bookId);

            return res.status(409).render(
                'book-concepts/form',
                {
                    title:
                        'Agregar concepto al libro',
                    action:
                        `/library/admin/books/${bookId}/concepts`,
                    book,
                    concepts,
                    bookConcept: req.body,
                    isEdit: false,
                    error:
                        'Ese concepto ya está asociado a este libro.'
                }
            );
        }

        if (error.code === '23503') {
            return res
                .status(400)
                .send(
                    'El libro o concepto seleccionado no existe.'
                );
        }

        next(error);
    }
});

// FORMULARIO EDITAR
router.get(
    '/:conceptId/edit',
    async (req, res, next) => {
        try {
            const bookId =
                validateBookId(
                    req.params.bookId
                );

            const conceptId =
                validateConceptId(
                    req.params.conceptId
                );

            if (!bookId || !conceptId) {
                return res
                    .status(400)
                    .send(
                        'Identificador inválido.'
                    );
            }

            const book =
                await getBookSummary(bookId);

            const bookConcept =
                await getBookConcept(
                    bookId,
                    conceptId
                );

            if (!book || !bookConcept) {
                return res
                    .status(404)
                    .send(
                        'Relación libro-concepto no encontrada.'
                    );
            }

            res.render(
                'book-concepts/form',
                {
                    title:
                        'Editar definición',
                    action:
                        `/library/admin/books/${bookId}/concepts/${conceptId}`,
                    book,
                    concepts: [],
                    bookConcept,
                    isEdit: true,
                    error: null
                }
            );
        } catch (error) {
            next(error);
        }
    }
);

// ACTUALIZAR
router.post(
    '/:conceptId',
    async (req, res, next) => {
        try {
            const bookId =
                validateBookId(
                    req.params.bookId
                );

            const conceptId =
                validateConceptId(
                    req.params.conceptId
                );

            if (!bookId || !conceptId) {
                return res
                    .status(400)
                    .send(
                        'Identificador inválido.'
                    );
            }

            const definition =
                typeof req.body.definition ===
                'string'
                    ? req.body.definition.trim()
                    : '';

            const chapterReference =
                typeof req.body
                    .chapterReference === 'string'
                    ? req.body
                          .chapterReference
                          .trim()
                    : '';

            const pageReference =
                typeof req.body
                    .pageReference === 'string'
                    ? req.body
                          .pageReference
                          .trim()
                    : '';

            if (!definition) {
                const book =
                    await getBookSummary(bookId);

                const current =
                    await getBookConcept(
                        bookId,
                        conceptId
                    );

                return res.status(400).render(
                    'book-concepts/form',
                    {
                        title:
                            'Editar definición',
                        action:
                            `/library/admin/books/${bookId}/concepts/${conceptId}`,
                        book,
                        concepts: [],
                        bookConcept: {
                            ...current,
                            definition,
                            chapter_reference:
                                chapterReference,
                            page_reference:
                                pageReference
                        },
                        isEdit: true,
                        error:
                            'La definición es obligatoria.'
                    }
                );
            }

            if (
                chapterReference.length > 120 ||
                pageReference.length > 50
            ) {
                return res
                    .status(400)
                    .send(
                        'Las referencias exceden el tamaño permitido.'
                    );
            }

            const updated =
                await updateBookConcept(
                    bookId,
                    conceptId,
                    definition,
                    chapterReference || null,
                    pageReference || null
                );

            if (!updated) {
                return res
                    .status(404)
                    .send(
                        'Relación libro-concepto no encontrada.'
                    );
            }

            return res.redirect(
                `/library/admin/books/${bookId}/concepts?message=Definición actualizada correctamente`
            );
        } catch (error) {
            next(error);
        }
    }
);

// ELIMINAR RELACIÓN
router.post(
    '/:conceptId/delete',
    async (req, res, next) => {
        try {
            const bookId =
                validateBookId(
                    req.params.bookId
                );

            const conceptId =
                validateConceptId(
                    req.params.conceptId
                );

            if (!bookId || !conceptId) {
                return res
                    .status(400)
                    .send(
                        'Identificador inválido.'
                    );
            }

            const deleted =
                await deleteBookConcept(
                    bookId,
                    conceptId
                );

            if (!deleted) {
                return res
                    .status(404)
                    .send(
                        'Relación libro-concepto no encontrada.'
                    );
            }

            return res.redirect(
                `/library/admin/books/${bookId}/concepts?message=Concepto removido del libro correctamente`
            );
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;