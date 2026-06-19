const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const CheckIn = require('../models/CheckIn')

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

async function signup(name, email, password) {
  const existing = await User.findOne({ email })
  if (existing) {
    const err = new Error('An account with this email already exists')
    err.code = 'EMAIL_TAKEN'
    err.status = 409
    throw err
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await User.create({ name, email, passwordHash })
  const token = signToken(user._id)

  return {
    token,
    user: { id: user._id, name: user.name, email: user.email },
  }
}

async function login(email, password) {
  const user = await User.findOne({ email })

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    const err = new Error('Invalid email or password')
    err.code = 'INVALID_CREDENTIALS'
    err.status = 401
    throw err
  }

  user.loginCount += 1
  await user.save()

  await recordCheckIn(user._id)

  const token = signToken(user._id)

  return {
    token,
    user: { id: user._id, name: user.name, email: user.email, loginCount: user.loginCount },
  }
}

async function recordCheckIn(userId) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  await CheckIn.updateOne(
    { userId, date: today },
    { $setOnInsert: { userId, date: today } },
    { upsert: true }
  )
}

module.exports = { signup, login, recordCheckIn }
