const express = require('express');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
    res.send(`
        <h1>Catálogo</h1>

        <p>
            Sesión iniciada como:
            ${req.session.user.email}
        </p>

        <p>
            Rol:
            ${req.session.user.role}
        </p>

        <form method="POST" action="/logout">
            <button type="submit">
                Cerrar sesión
            </button>
        </form>
    `);
});

module.exports = router;