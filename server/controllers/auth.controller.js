const authService = require('../services/auth.service')

async function signup(req, res) {
  const { name, email, password } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Name, email and password are required' } })
  }

  if (password.length < 8) {
    return res.status(400).json({ error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 8 characters' } })
  }

  try {
    const result = await authService.signup(name, email, password)
    res.status(201).json(result)
  } catch (err) {
    res.status(err.status || 500).json({ error: { code: err.code || 'SERVER_ERROR', message: err.message } })
  }
}

async function login(req, res) {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Email and password are required' } })
  }

  try {
    const result = await authService.login(email, password)
    res.json(result)
  } catch (err) {
    res.status(err.status || 500).json({ error: { code: err.code || 'SERVER_ERROR', message: err.message } })
  }
}

function logout(req, res) {
  res.json({ message: 'Logged out' })
}

async function me(req, res) {
  try {
    const streak = await authService.getStreak(req.user._id)
    const u = req.user
    res.json({ user: { id: u._id, name: u.name, email: u.email, loginCount: u.loginCount, streak } })
  } catch (err) {
    res.status(500).json({ error: { message: err.message } })
  }
}

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: { message: 'currentPassword and newPassword are required' } })
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: { message: 'New password must be at least 8 characters' } })
  }
  try {
    await authService.changePassword(req.user._id, currentPassword, newPassword)
    res.json({ message: 'Password updated' })
  } catch (err) {
    res.status(err.status || 500).json({ error: { code: err.code, message: err.message } })
  }
}

module.exports = { signup, login, logout, me, changePassword }
