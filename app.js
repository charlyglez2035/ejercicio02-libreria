require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');

const { testConnection } = require('./config/db');

const requireAuth =
    require('./middleware/auth');

const errorHandler =
    require('./middleware/errorHandler');

// --------------------------------------------------
// RUTAS
// --------------------------------------------------

// Autenticación / catálogo
const authRoutes =
    require('./routes/auth');

const catalogRoutes =
    require('./routes/catalog');

// Administración
const adminRoutes =
    require('./routes/admin');

const booksRoutes =
    require('./routes/books');

const authorsRoutes =
    require('./routes/authors');

const genresRoutes =
    require('./routes/genres');

const formatsRoutes =
    require('./routes/formats');

const categoriesRoutes =
    require('./routes/categories');

const conceptsRoutes =
    require('./routes/concepts');

// Relaciones del libro
const bookConceptRoutes =
    require('./routes/bookConcepts');

const bookImageRoutes =
    require('./routes/bookImages');

// --------------------------------------------------
// APP
// --------------------------------------------------

const app = express();

const libraryRouter = express.Router();

const HOST =
    process.env.HOST ||
    '127.0.0.1';

const PORT =
    Number(
        process.env.PORT
    ) || 3000;

// --------------------------------------------------
// EJS
// --------------------------------------------------

app.set(
    'view engine',
    'ejs'
);

app.set(
    'views',
    path.join(
        __dirname,
        'views'
    )
);

// --------------------------------------------------
// FORMULARIOS
// --------------------------------------------------

app.use(
    express.urlencoded({
        extended: false
    })
);

// --------------------------------------------------
// SESIONES
// --------------------------------------------------

if (!process.env.SESSION_SECRET) {
    throw new Error(
        'SESSION_SECRET no está definida en .env'
    );
}

app.use(
    session({
        name: 'library.sid',

        secret:
            process.env
                .SESSION_SECRET,

        resave: false,

        saveUninitialized:
            false,

        cookie: {
            httpOnly: true,

            sameSite: 'lax',

            secure:
                process.env
                    .NODE_ENV ===
                'production',

            maxAge:
                60 *
                60 *
                1000,

            path: '/library'
        }
    })
);

// --------------------------------------------------
// RECURSOS ESTÁTICOS
// --------------------------------------------------

// public/
// Ejemplo:
// public/css/styles.css
// -> /library/css/styles.css
app.use(
    '/library',
    express.static(
        path.join(
            __dirname,
            'public'
        ),
        {
            dotfiles: 'deny'
        }
    )
);

// uploads/ requieren autenticación.
// Ejemplo:
// uploads/book.jpg
// -> /library/uploads/book.jpg
app.use(
    '/library/uploads',
    requireAuth,
    express.static(
        path.join(
            __dirname,
            'uploads'
        ),
        {
            dotfiles: 'deny',
            index: false
        }
    )
);

// --------------------------------------------------
// REDIRECCIÓN DE RAÍZ
// --------------------------------------------------

// Si alguien entra a:
// http://127.0.0.1:3000/
// lo enviamos a /library
app.get(
    '/',
    (req, res) => {
        return res.redirect(
            '/library'
        );
    }
);

// --------------------------------------------------
// HOME DE /library
// --------------------------------------------------

libraryRouter.get(
    '/',
    (req, res) => {
        if (
            req.session &&
            req.session.user
        ) {
            return res.redirect(
                '/library/catalog'
            );
        }

        return res.redirect(
            '/library/login'
        );
    }
);

// --------------------------------------------------
// AUTENTICACIÓN
// --------------------------------------------------

libraryRouter.use(
    '/',
    authRoutes
);

// --------------------------------------------------
// CATÁLOGO
// --------------------------------------------------

libraryRouter.use(
    '/catalog',
    catalogRoutes
);

// --------------------------------------------------
// RELACIONES DEL LIBRO
// Deben montarse antes del router general de books.
// --------------------------------------------------

libraryRouter.use(
    '/admin/books/:bookId/concepts',
    bookConceptRoutes
);

libraryRouter.use(
    '/admin/books/:bookId/images',
    bookImageRoutes
);

// --------------------------------------------------
// CRUD ADMINISTRATIVOS
// --------------------------------------------------

libraryRouter.use(
    '/admin/books',
    booksRoutes
);

libraryRouter.use(
    '/admin/authors',
    authorsRoutes
);

libraryRouter.use(
    '/admin/genres',
    genresRoutes
);

libraryRouter.use(
    '/admin/formats',
    formatsRoutes
);

libraryRouter.use(
    '/admin/categories',
    categoriesRoutes
);

libraryRouter.use(
    '/admin/concepts',
    conceptsRoutes
);

// --------------------------------------------------
// PANEL ADMIN
// --------------------------------------------------

libraryRouter.use(
    '/admin',
    adminRoutes
);

// --------------------------------------------------
// MONTAR TODA LA APLICACIÓN EN /library
// --------------------------------------------------

app.use(
    '/library',
    libraryRouter
);

// --------------------------------------------------
// 404
// --------------------------------------------------

app.use(
    (req, res) => {
        res
            .status(404)
            .send(
                '404 - Página no encontrada.'
            );
    }
);

// --------------------------------------------------
// ERROR HANDLER
// --------------------------------------------------

app.use(
    errorHandler
);

// --------------------------------------------------
// START
// --------------------------------------------------

async function startServer() {
    try {
        const info =
            await testConnection();

        console.log(
            'PostgreSQL conectado correctamente'
        );

        console.log(
            `Base de datos: ${info.database}`
        );

        console.log(
            `Usuario de BD: ${info.db_user}`
        );

        app.listen(
            PORT,
            HOST,
            () => {
                console.log(
                    `Servidor: http://${HOST}:${PORT}/library`
                );
            }
        );
    } catch (error) {
        console.error(
            'No fue posible conectarse a PostgreSQL:',
            error.message
        );

        process.exit(1);
    }
}

startServer();