/**
 * Role hierarchy:
 *   admin  → full access (GET + POST + PUT + PATCH + DELETE)
 *   user   → GET + POST + PATCH status
 *   viewer → GET only
 *
 * Usage:
 *   router.get('/resource', auth, allow('admin','user','viewer'), handler)
 *   router.post('/resource', auth, allow('admin','user'), handler)
 *   router.delete('/resource/:id', auth, allow('admin'), handler)
 */
module.exports = function allow(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Tidak terautentikasi.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Akses ditolak. Role tidak memiliki izin.' });
    }
    next();
  };
};
