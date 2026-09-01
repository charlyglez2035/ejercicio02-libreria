require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');

const { testConnection } = require('./config/db');

const requireAuth =
    require('./middleware/auth');

const errorHandler =
    require('./middleware/errorHandler');

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

const app = express();

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

app.use(
    session({
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
                1000
        }
    })
);

// --------------------------------------------------
// RECURSOS ESTÁTICOS
// --------------------------------------------------

app.use(
    express.static(
        path.join(
            __dirname,
            'public'
        )
    )
);

// uploads no se sirven como código ejecutable.
// Requieren una sesión válida.
app.use(
    '/uploads',
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
// HOME
// --------------------------------------------------

app.get(
    '/',
    (req, res) => {
        if (
            req.session.user
        ) {
            return res.redirect(
                '/catalog'
            );
        }

        return res.redirect(
            '/login'
        );
    }
);

// --------------------------------------------------
// AUTENTICACIÓN
// --------------------------------------------------

app.use(
    '/',
    authRoutes
);

// --------------------------------------------------
// CATÁLOGO
// --------------------------------------------------

app.use(
    '/catalog',
    catalogRoutes
);

// --------------------------------------------------
// RELACIONES DEL LIBRO
// Deben montarse antes del router general de books.
// --------------------------------------------------

app.use(
    '/admin/books/:bookId/concepts',
    bookConceptRoutes
);

app.use(
    '/admin/books/:bookId/images',
    bookImageRoutes
);

// --------------------------------------------------
// CRUD ADMINISTRATIVOS
// --------------------------------------------------

app.use(
    '/admin/books',
    booksRoutes
);

app.use(
    '/admin/authors',
    authorsRoutes
);

app.use(
    '/admin/genres',
    genresRoutes
);

app.use(
    '/admin/formats',
    formatsRoutes
);

app.use(
    '/admin/categories',
    categoriesRoutes
);

app.use(
    '/admin/concepts',
    conceptsRoutes
);

// --------------------------------------------------
// PANEL ADMIN
// --------------------------------------------------

app.use(
    '/admin',
    adminRoutes
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
                    `Servidor: http://${HOST}:${PORT}`
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