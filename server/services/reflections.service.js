const Reflection = require('../models/Reflection')
const { resolveDateOnly } = require('../utils/dateOnly')

async function getToday(userId, localDate) {
  const today = resolveDateOnly(localDate)
  return Reflection.findOne({ userId, date: today })
}

async function upsertToday(userId, fields, localDate) {
  const today = resolveDateOnly(localDate)
  const allowed = ['overallDay', 'accomplished', 'win', 'wastedTime', 'improvement', 'focusScore']
  const data = Object.fromEntries(Object.entries(fields).filter(([k]) => allowed.includes(k)))

  return Reflection.findOneAndUpdate(
    { userId, date: today },
    { $set: data },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  )
}

async function getAll(userId) {
  return Reflection.find({ userId }).sort({ date: -1 })
}

async function getById(userId, id) {
  const reflection = await Reflection.findOne({ _id: id, userId })
  if (!reflection) {
    const err = new Error('Reflection not found')
    err.status = 404
    throw err
  }
  return reflection
}

module.exports = { getToday, upsertToday, getAll, getById }
