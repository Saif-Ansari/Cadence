const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const CheckIn = require('../models/CheckIn')
const { resolveDateOnly } = require('../utils/dateOnly')

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

  // MAX_USERS is unset in dev/test (Number(undefined) is NaN, so `> 0` is
  // false and this is skipped entirely) — only enforced when explicitly
  // configured, e.g. on a public deploy meant for a small, known group.
  const maxUsers = Number(process.env.MAX_USERS)
  if (maxUsers > 0) {
    const userCount = await User.countDocuments()
    if (userCount >= maxUsers) {
      const err = new Error('Signups are currently closed')
      err.code = 'SIGNUPS_CLOSED'
      err.status = 403
      throw err
    }
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await User.create({ name, email, passwordHash })
  const token = signToken(user._id)

  return {
    token,
    user: { id: user._id, name: user.name, email: user.email },
  }
}

async function login(email, password, localDate) {
  const user = await User.findOne({ email })

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    const err = new Error('Invalid email or password')
    err.code = 'INVALID_CREDENTIALS'
    err.status = 401
    throw err
  }

  user.loginCount += 1
  await user.save()

  await recordCheckIn(user._id, localDate)

  const token = signToken(user._id)
  const streak = await getStreak(user._id, localDate)

  return {
    token,
    user: { id: user._id, name: user.name, email: user.email, loginCount: user.loginCount, streak },
  }
}

async function recordCheckIn(userId, localDate) {
  const today = resolveDateOnly(localDate)

  await CheckIn.updateOne(
    { userId, date: today },
    { $setOnInsert: { userId, date: today } },
    { upsert: true }
  )
}

async function getStreak(userId, localDate) {
  const checkIns = await CheckIn.find({ userId }).sort({ date: -1 })
  if (checkIns.length === 0) return 0

  const today = resolveDateOnly(localDate)

  // Walk backwards from today; if user hasn't checked in today, start from yesterday
  let expected = new Date(today)
  const latest = new Date(checkIns[0].date)
  if (latest.getTime() < today.getTime()) {
    expected.setUTCDate(expected.getUTCDate() - 1)
  }

  let streak = 0
  for (const checkIn of checkIns) {
    const day = new Date(checkIn.date)
    if (day.getTime() === expected.getTime()) {
      streak++
      expected.setUTCDate(expected.getUTCDate() - 1)
    } else if (day.getTime() < expected.getTime()) {
      break
    }
  }

  return streak
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await User.findById(userId)
  if (!user) {
    const err = new Error('User not found')
    err.status = 404
    throw err
  }

  const match = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!match) {
    const err = new Error('Current password is incorrect')
    err.code = 'WRONG_PASSWORD'
    err.status = 400
    throw err
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10)
  await user.save()
}

module.exports = { signup, login, recordCheckIn, getStreak, changePassword }
