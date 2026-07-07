const authService = require('../services/auth.service')
const asyncHandler = require('../utils/asyncHandler')

// MongoDB query operators (e.g. { "$gt": "" }) are truthy, so a plain `!email`
// check lets them through — they'd reach User.findOne({ email }) as a live
// query operator instead of a literal string. Require strings explicitly.
function isNonEmptyString(value) {
  return typeof value === 'string' && value.length > 0
}

async function signup(req, res) {
  const { name, email, password } = req.body

  if (!isNonEmptyString(name) || !isNonEmptyString(email) || !isNonEmptyString(password)) {
    return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Name, email and password are required' } })
  }

  if (password.length < 8) {
    return res.status(400).json({ error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 8 characters' } })
  }

  const result = await authService.signup(name, email, password)
  res.status(201).json(result)
}

async function login(req, res) {
  const { email, password, localDate } = req.body

  if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
    return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Email and password are required' } })
  }

  const result = await authService.login(email, password, localDate)
  res.json(result)
}

function logout(req, res) {
  res.json({ message: 'Logged out' })
}

async function me(req, res) {
  const streak = await authService.getStreak(req.user._id, req.query.localDate)
  const u = req.user
  res.json({ user: { id: u._id, name: u.name, email: u.email, loginCount: u.loginCount, streak } })
}

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body
  if (!isNonEmptyString(currentPassword) || !isNonEmptyString(newPassword)) {
    return res.status(400).json({ error: { message: 'currentPassword and newPassword are required' } })
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: { message: 'New password must be at least 8 characters' } })
  }
  await authService.changePassword(req.user._id, currentPassword, newPassword)
  res.json({ message: 'Password updated' })
}

module.exports = {
  signup: asyncHandler(signup),
  login: asyncHandler(login),
  logout,
  me: asyncHandler(me),
  changePassword: asyncHandler(changePassword),
}
