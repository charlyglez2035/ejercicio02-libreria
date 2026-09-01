function requireAuth(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.redirect('/library/login');
    }

    next();
}

module.exports = requireAuth;