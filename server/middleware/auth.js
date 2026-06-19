const jwt = require('jsonwebtoken')
const User = require('../models/User')

// protect — middleware that verifies the JWT and attaches req.user
// Usage: router.get('/me', protect, (req, res) => { ... })
async function protect(req, res, next) {
  const authHeader = req.headers.authorization

  // Tokens are sent as: Authorization: Bearer <token>
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: { code: 'NO_TOKEN', message: 'Not authorised' } })
  }

  const token = authHeader.split(' ')[1]

  try {
    // jwt.verify throws if the token is expired or tampered with
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Attach the user to the request — routes read req.user
    // select('-passwordHash') — never load the hash into memory unnecessarily
    req.user = await User.findById(decoded.id).select('-passwordHash')

    if (!req.user) {
      return res.status(401).json({ error: { code: 'USER_NOT_FOUND', message: 'Not authorised' } })
    }

    next()
  } catch (err) {
    return res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Not authorised' } })
  }
}

module.exports = protect
