const express = require('express');

const requireAuth = require('../middleware/auth');
const requireAdmin = require('../middleware/authorize');

const router = express.Router();

// --------------------------------------------------
// PROTECCIÓN DEL PANEL
// --------------------------------------------------

router.use(requireAuth);
router.use(requireAdmin);

// --------------------------------------------------
// PANEL PRINCIPAL
// --------------------------------------------------

router.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>

        <html lang="es">

        <head>

            <meta charset="UTF-8">

            <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
            >

            <title>
                Administración | Librería
            </title>

        </head>

        <body>

            <h1>
                Panel de administración
            </h1>

            <p>
                <strong>Usuario:</strong>
                ${req.session.user.email}
            </p>

            <p>
                <strong>Rol:</strong>
                ${req.session.user.role}
            </p>

            <hr>

            <h2>
                Administración del sistema
            </h2>

            <ul>

                <li>
                    <a href="/admin/books">
                        Administrar libros
                    </a>
                </li>

                <li>
                    <a href="/admin/authors">
                        Administrar autores
                    </a>
                </li>

                <li>
                    <a href="/admin/genres">
                        Administrar géneros
                    </a>
                </li>

                <li>
                    <a href="/admin/formats">
                        Administrar formatos
                    </a>
                </li>

                <li>
                    <a href="/admin/categories">
                        Administrar categorías
                    </a>
                </li>

                <li>
                    <a href="/admin/concepts">
                        Administrar conceptos
                    </a>
                </li>

            </ul>

            <hr>

            <p>
                <a href="/catalog">
                    Ir al catálogo
                </a>
            </p>

            <form
                method="POST"
                action="/logout"
            >

                <button type="submit">
                    Cerrar sesión
                </button>

            </form>

        </body>

        </html>
    `);
});

module.exports = router;