const Habit = require('../models/Habit')
const HabitLog = require('../models/HabitLog')

function normalizeDate(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function getMondayOf(date) {
  const d = normalizeDate(date)
  const day = d.getDay()
  const diff = day === 0 ? 6 : day - 1
  d.setDate(d.getDate() - diff)
  return d
}

function calculateStreak(logs, targetFrequency) {
  if (logs.length === 0) return 0

  // Group logs by the Monday of their week
  const weekMap = {}
  for (const log of logs) {
    const monday = getMondayOf(log.date).toISOString()
    weekMap[monday] = (weekMap[monday] || 0) + 1
  }

  // Walk backwards week by week starting from last week
  // Current week is skipped — user may not have had a chance to hit target yet
  let streak = 0
  const today = normalizeDate(new Date())
  const currentMonday = getMondayOf(today)

  let weekStart = new Date(currentMonday)
  weekStart.setDate(weekStart.getDate() - 7) // start from last week

  while (true) {
    const key = weekStart.toISOString()
    const count = weekMap[key] || 0

    if (count < targetFrequency) break

    streak++
    weekStart.setDate(weekStart.getDate() - 7) // go back one more week
  }

  return streak
}

async function getHabits(userId) {
  const habits = await Habit.find({ userId, status: 'active' }).sort({ createdAt: -1 })

  // Fetch all logs for this user in one query, then filter per habit in memory
  const allLogs = await HabitLog.find({ userId })

  // Get current week's Monday and Sunday for the weekly grid
  const today = normalizeDate(new Date())
  const weekMonday = getMondayOf(today)
  const weekSunday = new Date(weekMonday)
  weekSunday.setDate(weekMonday.getDate() + 6)

  return habits.map((habit) => {
    const habitLogs = allLogs.filter((l) => l.habitId.toString() === habit._id.toString())

    // This week's logs for the grid (Mon–Sun)
    const weekLogs = habitLogs.filter((l) => {
      const d = normalizeDate(l.date)
      return d >= weekMonday && d <= weekSunday
    })

    // Build a Set of ISO date strings for quick lookup: is day X done this week?
    const doneDates = new Set(weekLogs.map((l) => normalizeDate(l.date).toISOString()))

    // Build the 7-day grid — one entry per day Mon–Sun
    const weekGrid = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(weekMonday)
      day.setDate(weekMonday.getDate() + i)
      return {
        date: normalizeDate(day).toISOString(),
        done: doneDates.has(normalizeDate(day).toISOString()),
      }
    })

    const streak = calculateStreak(habitLogs, habit.targetFrequency)

    return { ...habit.toObject(), weekGrid, streak }
  })
}

async function createHabit(userId, { name, targetFrequency, description }) {
  return Habit.create({ userId, name, targetFrequency, description })
}

async function updateHabit(userId, habitId, updates) {
  const allowed = ['name', 'targetFrequency', 'description', 'status']
  const filtered = Object.fromEntries(
    Object.entries(updates).filter(([key]) => allowed.includes(key))
  )
  return Habit.findOneAndUpdate({ _id: habitId, userId }, filtered, { new: true })
}

async function deleteHabit(userId, habitId) {
  const habit = await Habit.findOneAndDelete({ _id: habitId, userId })
  if (habit) await HabitLog.deleteMany({ habitId })
  return habit
}

async function logHabit(userId, habitId, date) {
  const habit = await Habit.findOne({ _id: habitId, userId })
  if (!habit) return null

  const normalized = normalizeDate(date)

  // Toggle: if a log exists for this date, remove it. Otherwise create it.
  const existing = await HabitLog.findOne({ habitId, userId, date: normalized })
  if (existing) {
    await existing.deleteOne()
    return { done: false }
  }

  await HabitLog.create({ habitId, userId, date: normalized })
  return { done: true }
}

async function getConsistency(userId) {
  const habits = await Habit.find({ userId, status: 'active' }).sort({ createdAt: -1 })
  if (habits.length === 0) return []

  const today = normalizeDate(new Date())
  const thisMonday = getMondayOf(today)

  // Start of 5-week window (4 weeks back from this Monday)
  const startDate = new Date(thisMonday)
  startDate.setDate(startDate.getDate() - 28)

  const logs = await HabitLog.find({ userId, date: { $gte: startDate } })

  // Build week start dates oldest → newest
  const weeks = Array.from({ length: 5 }, (_, i) => {
    const monday = new Date(thisMonday)
    monday.setDate(monday.getDate() - (4 - i) * 7)
    return monday
  })

  return habits.map((habit) => {
    const habitLogs = logs.filter((l) => l.habitId.toString() === habit._id.toString())

    const weekData = weeks.map((weekStart, idx) => {
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 7)
      const count = habitLogs.filter((l) => {
        const d = normalizeDate(l.date)
        return d >= weekStart && d < weekEnd
      }).length
      return {
        label: idx === 4 ? 'Now' : `W${idx + 1}`,
        rate: Math.min(count / habit.targetFrequency, 1),
      }
    })

    return { habitId: habit._id, name: habit.name, weeks: weekData }
  })
}

module.exports = { getHabits, createHabit, updateHabit, deleteHabit, logHabit, getConsistency }
