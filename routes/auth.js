const express = require('express');
const bcrypt = require('bcrypt');

const {
    findUserByEmail,
    createUser
} = require('../services/authService');

const router = express.Router();

const SALT_ROUNDS = 12;

// --------------------------------------------------
// REGISTRO
// --------------------------------------------------

router.get('/register', (req, res) => {
    if (req.session.user) {
        return res.redirect('/catalog');
    }

    res.render('auth/register', {
        error: null,
        email: ''
    });
});

router.post('/register', async (req, res, next) => {
    try {
        let { email, password, confirmPassword } = req.body;

        email = typeof email === 'string'
            ? email.trim().toLowerCase()
            : '';

        if (!email || !password || !confirmPassword) {
            return res.status(400).render('auth/register', {
                error: 'Todos los campos son obligatorios.',
                email
            });
        }

        if (password.length < 8) {
            return res.status(400).render('auth/register', {
                error: 'La contraseña debe tener al menos 8 caracteres.',
                email
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).render('auth/register', {
                error: 'Las contraseñas no coinciden.',
                email
            });
        }

        const existingUser = await findUserByEmail(email);

        if (existingUser) {
            return res.status(409).render('auth/register', {
                error: 'Ya existe una cuenta registrada con ese correo.',
                email
            });
        }

        const passwordHash = await bcrypt.hash(
            password,
            SALT_ROUNDS
        );

        await createUser(email, passwordHash);

        return res.redirect('/login?registered=1');
    } catch (error) {
        // Protección adicional por si ocurre una condición
        // de carrera con el UNIQUE de users.email.
        if (error.code === '23505') {
            return res.status(409).render('auth/register', {
                error: 'Ya existe una cuenta registrada con ese correo.',
                email: req.body.email || ''
            });
        }

        next(error);
    }
});

// --------------------------------------------------
// LOGIN
// --------------------------------------------------

router.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/catalog');
    }

    res.render('auth/login', {
        error: null,
        registered: req.query.registered === '1'
    });
});

router.post('/login', async (req, res, next) => {
    try {
        let { email, password } = req.body;

        email = typeof email === 'string'
            ? email.trim().toLowerCase()
            : '';

        if (!email || !password) {
            return res.status(400).render('auth/login', {
                error: 'Correo y contraseña son obligatorios.',
                registered: false
            });
        }

        const user = await findUserByEmail(email);

        if (!user) {
            return res.status(401).render('auth/login', {
                error: 'Correo o contraseña incorrectos.',
                registered: false
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatches) {
            return res.status(401).render('auth/login', {
                error: 'Correo o contraseña incorrectos.',
                registered: false
            });
        }

        // Regenera la sesión después de autenticar.
        req.session.regenerate((error) => {
            if (error) {
                return next(error);
            }

            req.session.user = {
                id: user.user_id,
                email: user.email,
                role: user.role
            };

            req.session.save((saveError) => {
                if (saveError) {
                    return next(saveError);
                }

                if (user.role === 'ADMIN') {
                    return res.redirect('/admin');
                }

                return res.redirect('/catalog');
            });
        });
    } catch (error) {
        next(error);
    }
});

// --------------------------------------------------
// LOGOUT
// --------------------------------------------------

router.post('/logout', (req, res, next) => {
    if (!req.session) {
        return res.redirect('/login');
    }

    req.session.destroy((error) => {
        if (error) {
            return next(error);
        }

        res.clearCookie('connect.sid');

        return res.redirect('/login');
    });
});

module.exports = router;