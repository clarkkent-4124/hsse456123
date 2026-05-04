/**
 * Role access:
 *   admin  -> full access, including User Management
 *   user   -> full access except User Management
 *   viewer -> full access except User Management
 *
 * Usage:
 *   router.get('/resource', auth, allow('admin','user','viewer'), handler)
 *   router.post('/resource', auth, allow('admin','user','viewer'), handler)
 *   router.delete('/users/:id', auth, allow('admin'), handler)
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
