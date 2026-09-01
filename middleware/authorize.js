function requireAdmin(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.redirect('/login');
    }

    if (req.session.user.role !== 'ADMIN') {
        return res.status(403).render('errors/403');
    }

    next();
}

module.exports = requireAdmin;