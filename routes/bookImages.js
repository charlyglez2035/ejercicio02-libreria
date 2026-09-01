const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const requireAuth = require('../middleware/auth');
const requireAdmin = require('../middleware/authorize');

const {
    getBookSummary,
    getBookImages,
    getBookImage,
    createBookImage,
    updateBookImage,
    deleteBookImage
} = require('../services/bookImageService');

const router = express.Router({
    mergeParams: true
});

router.use(requireAuth);
router.use(requireAdmin);

const UPLOAD_DIRECTORY = path.join(
    __dirname,
    '..',
    'uploads',
    'books'
);

const MAX_FILE_SIZE =
    5 * 1024 * 1024;

fs.mkdirSync(
    UPLOAD_DIRECTORY,
    {
        recursive: true
    }
);

const allowedExtensions = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp']
};

const canonicalExtensions = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp'
};

const storage = multer.diskStorage({
    destination: (
        req,
        file,
        callback
    ) => {
        callback(
            null,
            UPLOAD_DIRECTORY
        );
    },

    filename: (
        req,
        file,
        callback
    ) => {
        const extension =
            canonicalExtensions[
                file.mimetype
            ];

        const generatedName =
            `${crypto.randomUUID()}${extension}`;

        callback(
            null,
            generatedName
        );
    }
});

function fileFilter(
    req,
    file,
    callback
) {
    const extension =
        path
            .extname(file.originalname)
            .toLowerCase();

    const validExtensions =
        allowedExtensions[
            file.mimetype
        ];

    if (
        !validExtensions ||
        !validExtensions.includes(
            extension
        )
    ) {
        return callback(
            new Error(
                'Solo se permiten imágenes JPG, PNG o WebP.'
            )
        );
    }

    callback(
        null,
        true
    );
}

const upload = multer({
    storage,

    limits: {
        fileSize: MAX_FILE_SIZE
    },

    fileFilter
});

function uploadImage(
    req,
    res,
    next
) {
    upload.single('image')(
        req,
        res,
        (error) => {
            if (!error) {
                return next();
            }

            if (
                error instanceof
                    multer.MulterError &&
                error.code ===
                    'LIMIT_FILE_SIZE'
            ) {
                return res
                    .status(400)
                    .send(
                        'La imagen excede el tamaño máximo de 5 MB.'
                    );
            }

            return res
                .status(400)
                .send(
                    'Archivo no válido. Solo se permiten JPG, PNG o WebP.'
                );
        }
    );
}

function validId(value) {
    const id = Number(value);

    return (
        Number.isInteger(id) &&
        id > 0
    )
        ? id
        : null;
}

function validateAltText(value) {
    const altText =
        typeof value === 'string'
            ? value.trim()
            : '';

    if (!altText) {
        return {
            valid: false,
            message:
                'El texto alternativo es obligatorio.'
        };
    }

    if (altText.length > 500) {
        return {
            valid: false,
            message:
                'El texto alternativo no puede exceder 500 caracteres.'
        };
    }

    return {
        valid: true,
        altText
    };
}

async function removeFile(
    filePath
) {
    if (!filePath) {
        return;
    }

    try {
        await fs.promises.unlink(
            filePath
        );
    } catch (error) {
        if (
            error.code !== 'ENOENT'
        ) {
            console.error(
                '[UPLOAD] No fue posible eliminar el archivo:',
                error.message
            );
        }
    }
}

// --------------------------------------------------
// LISTAR
// --------------------------------------------------

router.get('/', async (
    req,
    res,
    next
) => {
    try {
        const bookId =
            validId(
                req.params.bookId
            );

        if (!bookId) {
            return res
                .status(400)
                .send(
                    'Libro inválido.'
                );
        }

        const book =
            await getBookSummary(
                bookId
            );

        if (!book) {
            return res
                .status(404)
                .send(
                    'Libro no encontrado.'
                );
        }

        const images =
            await getBookImages(
                bookId
            );

        res.render(
            'book-images/index',
            {
                book,
                images,
                message:
                    req.query.message ||
                    null
            }
        );
    } catch (error) {
        next(error);
    }
});

// --------------------------------------------------
// FORMULARIO SUBIR
// --------------------------------------------------

router.get('/new', async (
    req,
    res,
    next
) => {
    try {
        const bookId =
            validId(
                req.params.bookId
            );

        const book =
            await getBookSummary(
                bookId
            );

        if (!book) {
            return res
                .status(404)
                .send(
                    'Libro no encontrado.'
                );
        }

        res.render(
            'book-images/form',
            {
                title:
                    'Agregar imagen',
                action:
                    `/library/admin/books/${bookId}/images`,
                book,
                image: null,
                isEdit: false,
                error: null
            }
        );
    } catch (error) {
        next(error);
    }
});

// --------------------------------------------------
// SUBIR
// --------------------------------------------------

router.post(
    '/',
    uploadImage,
    async (
        req,
        res,
        next
    ) => {
        try {
            const bookId =
                validId(
                    req.params.bookId
                );

            const book =
                await getBookSummary(
                    bookId
                );

            if (!book) {
                await removeFile(
                    req.file?.path
                );

                return res
                    .status(404)
                    .send(
                        'Libro no encontrado.'
                    );
            }

            const validation =
                validateAltText(
                    req.body.altText
                );

            if (
                !validation.valid
            ) {
                await removeFile(
                    req.file?.path
                );

                return res
                    .status(400)
                    .render(
                        'book-images/form',
                        {
                            title:
                                'Agregar imagen',
                            action:
                                `/admin/books/${bookId}/images`,
                            book,
                            image:
                                req.body,
                            isEdit:
                                false,
                            error:
                                validation.message
                        }
                    );
            }

            if (!req.file) {
                return res
                    .status(400)
                    .render(
                        'book-images/form',
                        {
                            title:
                                'Agregar imagen',
                            action:
                                `/admin/books/${bookId}/images`,
                            book,
                            image:
                                req.body,
                            isEdit:
                                false,
                            error:
                                'Debes seleccionar una imagen.'
                        }
                    );
            }

            if (
                req.file.size <= 0
            ) {
                await removeFile(
                    req.file.path
                );

                return res
                    .status(400)
                    .send(
                        'El archivo está vacío.'
                    );
            }

            const relativePath =
                path.posix.join(
                    'uploads',
                    'books',
                    req.file.filename
                );

            await createBookImage({
                bookId,

                fileName:
                    req.file.filename,

                filePath:
                    relativePath,

                mimeType:
                    req.file.mimetype,

                fileSizeBytes:
                    req.file.size,

                altText:
                    validation.altText,

                isCover:
                    req.body.isCover ===
                    'on'
            });

            return res.redirect(
                `/library/admin/books/${bookId}/images?message=Imagen cargada correctamente`
            );
        } catch (error) {
            await removeFile(
                req.file?.path
            );

            next(error);
        }
    }
);

// --------------------------------------------------
// EDITAR METADATOS
// --------------------------------------------------

router.get(
    '/:imageId/edit',
    async (
        req,
        res,
        next
    ) => {
        try {
            const bookId =
                validId(
                    req.params.bookId
                );

            const imageId =
                validId(
                    req.params.imageId
                );

            const [
                book,
                image
            ] = await Promise.all([
                getBookSummary(
                    bookId
                ),
                getBookImage(
                    bookId,
                    imageId
                )
            ]);

            if (
                !book ||
                !image
            ) {
                return res
                    .status(404)
                    .send(
                        'Imagen no encontrada.'
                    );
            }

            res.render(
                'book-images/form',
                {
                    title:
                        'Editar imagen',
                    action:
                        `/library/admin/books/${bookId}/images/${imageId}`,
                    book,
                    image,
                    isEdit: true,
                    error: null
                }
            );
        } catch (error) {
            next(error);
        }
    }
);

// --------------------------------------------------
// ACTUALIZAR METADATOS
// --------------------------------------------------

router.post(
    '/:imageId',
    async (
        req,
        res,
        next
    ) => {
        try {
            const bookId =
                validId(
                    req.params.bookId
                );

            const imageId =
                validId(
                    req.params.imageId
                );

            const validation =
                validateAltText(
                    req.body.altText
                );

            if (
                !bookId ||
                !imageId
            ) {
                return res
                    .status(400)
                    .send(
                        'Identificador inválido.'
                    );
            }

            if (
                !validation.valid
            ) {
                const [
                    book,
                    image
                ] =
                    await Promise.all([
                        getBookSummary(
                            bookId
                        ),
                        getBookImage(
                            bookId,
                            imageId
                        )
                    ]);

                return res
                    .status(400)
                    .render(
                        'book-images/form',
                        {
                            title:
                                'Editar imagen',
                            action:
                                `/admin/books/${bookId}/images/${imageId}`,
                            book,
                            image: {
                                ...image,
                                alt_text:
                                    req.body
                                        .altText
                            },
                            isEdit:
                                true,
                            error:
                                validation.message
                        }
                    );
            }

            const updated =
                await updateBookImage(
                    bookId,
                    imageId,
                    validation.altText,
                    req.body.isCover ===
                        'on'
                );

            if (!updated) {
                return res
                    .status(404)
                    .send(
                        'Imagen no encontrada.'
                    );
            }

            return res.redirect(
                `/library/admin/books/${bookId}/images?message=Imagen actualizada correctamente`
            );
        } catch (error) {
            if (
                error.code ===
                'COVER_REQUIRED'
            ) {
                const bookId =
                    Number(
                        req.params.bookId
                    );

                const imageId =
                    Number(
                        req.params.imageId
                    );

                const [
                    book,
                    image
                ] =
                    await Promise.all([
                        getBookSummary(
                            bookId
                        ),
                        getBookImage(
                            bookId,
                            imageId
                        )
                    ]);

                return res
                    .status(409)
                    .render(
                        'book-images/form',
                        {
                            title:
                                'Editar imagen',
                            action:
                                `/admin/books/${bookId}/images/${imageId}`,
                            book,
                            image,
                            isEdit:
                                true,
                            error:
                                'No puedes quitar la portada actual sin marcar otra imagen como portada.'
                        }
                    );
            }

            next(error);
        }
    }
);

// --------------------------------------------------
// ELIMINAR
// --------------------------------------------------

router.post(
    '/:imageId/delete',
    async (
        req,
        res,
        next
    ) => {
        try {
            const bookId =
                validId(
                    req.params.bookId
                );

            const imageId =
                validId(
                    req.params.imageId
                );

            if (
                !bookId ||
                !imageId
            ) {
                return res
                    .status(400)
                    .send(
                        'Identificador inválido.'
                    );
            }

            const deleted =
                await deleteBookImage(
                    bookId,
                    imageId
                );

            if (!deleted) {
                return res
                    .status(404)
                    .send(
                        'Imagen no encontrada.'
                    );
            }

            const absolutePath =
                path.join(
                    __dirname,
                    '..',
                    deleted.file_path
                );

            await removeFile(
                absolutePath
            );

            return res.redirect(
                `/library/admin/books/${bookId}/images?message=Imagen eliminada correctamente`
            );
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;