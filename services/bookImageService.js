const db = require('../config/db');

async function getBookSummary(bookId) {
    const result = await db.query(`
        SELECT
            book_id,
            isbn,
            title
        FROM books
        WHERE book_id = $1
    `, [bookId]);

    return result.rows[0] || null;
}

async function getBookImages(bookId) {
    const result = await db.query(`
        SELECT
            image_id,
            book_id,
            file_name,
            file_path,
            mime_type,
            file_size_bytes,
            alt_text,
            is_cover
        FROM book_images
        WHERE book_id = $1
        ORDER BY is_cover DESC, image_id
    `, [bookId]);

    return result.rows;
}

async function getBookImage(bookId, imageId) {
    const result = await db.query(`
        SELECT
            image_id,
            book_id,
            file_name,
            file_path,
            mime_type,
            file_size_bytes,
            alt_text,
            is_cover
        FROM book_images
        WHERE book_id = $1
          AND image_id = $2
    `, [
        bookId,
        imageId
    ]);

    return result.rows[0] || null;
}

async function createBookImage(data) {
    const client = await db.getClient();

    try {
        await client.query('BEGIN');

        const countResult = await client.query(`
            SELECT COUNT(*)::int AS total
            FROM book_images
            WHERE book_id = $1
        `, [data.bookId]);

        const firstImage =
            countResult.rows[0].total === 0;

        // La primera imagen siempre será portada.
        const shouldBeCover =
            data.isCover || firstImage;

        if (shouldBeCover) {
            await client.query(`
                UPDATE book_images
                SET is_cover = FALSE
                WHERE book_id = $1
                  AND is_cover = TRUE
            `, [data.bookId]);
        }

        const result = await client.query(`
            INSERT INTO book_images (
                book_id,
                file_name,
                file_path,
                mime_type,
                file_size_bytes,
                alt_text,
                is_cover
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7
            )
            RETURNING
                image_id,
                book_id,
                file_name,
                file_path,
                mime_type,
                file_size_bytes,
                alt_text,
                is_cover
        `, [
            data.bookId,
            data.fileName,
            data.filePath,
            data.mimeType,
            data.fileSizeBytes,
            data.altText,
            shouldBeCover
        ]);

        await client.query('COMMIT');

        return result.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

async function updateBookImage(
    bookId,
    imageId,
    altText,
    isCover
) {
    const client = await db.getClient();

    try {
        await client.query('BEGIN');

        const currentResult = await client.query(`
            SELECT
                image_id,
                is_cover
            FROM book_images
            WHERE book_id = $1
              AND image_id = $2
            FOR UPDATE
        `, [
            bookId,
            imageId
        ]);

        if (currentResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return null;
        }

        const current = currentResult.rows[0];

        if (isCover) {
            await client.query(`
                UPDATE book_images
                SET is_cover = FALSE
                WHERE book_id = $1
                  AND image_id <> $2
            `, [
                bookId,
                imageId
            ]);

            const result = await client.query(`
                UPDATE book_images
                SET
                    alt_text = $1,
                    is_cover = TRUE
                WHERE book_id = $2
                  AND image_id = $3
                RETURNING *
            `, [
                altText,
                bookId,
                imageId
            ]);

            await client.query('COMMIT');

            return result.rows[0];
        }

        // No permitimos dejar un libro con imágenes
        // sin una portada activa.
        if (current.is_cover) {
            const otherResult = await client.query(`
                SELECT image_id
                FROM book_images
                WHERE book_id = $1
                  AND image_id <> $2
                LIMIT 1
            `, [
                bookId,
                imageId
            ]);

            if (otherResult.rows.length > 0) {
                const error = new Error(
                    'Debe existir una portada.'
                );

                error.code = 'COVER_REQUIRED';

                throw error;
            }

            // Si es la única imagen, permanece como portada.
            const result = await client.query(`
                UPDATE book_images
                SET alt_text = $1
                WHERE book_id = $2
                  AND image_id = $3
                RETURNING *
            `, [
                altText,
                bookId,
                imageId
            ]);

            await client.query('COMMIT');

            return result.rows[0];
        }

        const result = await client.query(`
            UPDATE book_images
            SET
                alt_text = $1,
                is_cover = FALSE
            WHERE book_id = $2
              AND image_id = $3
            RETURNING *
        `, [
            altText,
            bookId,
            imageId
        ]);

        await client.query('COMMIT');

        return result.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

async function deleteBookImage(bookId, imageId) {
    const client = await db.getClient();

    try {
        await client.query('BEGIN');

        const imageResult = await client.query(`
            SELECT *
            FROM book_images
            WHERE book_id = $1
              AND image_id = $2
            FOR UPDATE
        `, [
            bookId,
            imageId
        ]);

        if (imageResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return null;
        }

        const image = imageResult.rows[0];

        await client.query(`
            DELETE FROM book_images
            WHERE book_id = $1
              AND image_id = $2
        `, [
            bookId,
            imageId
        ]);

        // Si se elimina la portada y quedan imágenes,
        // asignamos automáticamente otra portada.
        if (image.is_cover) {
            const nextResult = await client.query(`
                SELECT image_id
                FROM book_images
                WHERE book_id = $1
                ORDER BY image_id
                LIMIT 1
            `, [bookId]);

            if (nextResult.rows.length > 0) {
                await client.query(`
                    UPDATE book_images
                    SET is_cover = TRUE
                    WHERE image_id = $1
                `, [
                    nextResult.rows[0].image_id
                ]);
            }
        }

        await client.query('COMMIT');

        return image;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    getBookSummary,
    getBookImages,
    getBookImage,
    createBookImage,
    updateBookImage,
    deleteBookImage
};