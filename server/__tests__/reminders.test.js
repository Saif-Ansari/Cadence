const User = require('../models/User')
const Habit = require('../models/Habit')
const HabitLog = require('../models/HabitLog')
const { normalizeDate } = require('../services/habits.service')
const remindersService = require('../services/reminders.service')

function createUser(email, emailReminders) {
  return User.create({
    name: 'Test User',
    email,
    passwordHash: 'irrelevant-for-these-tests',
    ...(emailReminders && { emailReminders }),
  })
}

describe('reminders.service getDueReminders', () => {
  it('returns only the undone habits for mode "all"', async () => {
    const user = await createUser('all-mode@test.com', { enabled: true, mode: 'all', habitIds: [] })
    const done = await Habit.create({ userId: user._id, name: 'Done habit', targetFrequency: 3 })
    const undone = await Habit.create({ userId: user._id, name: 'Undone habit', targetFrequency: 3 })
    await HabitLog.create({ userId: user._id, habitId: done._id, date: normalizeDate(new Date()) })

    const reminders = await remindersService.getDueReminders()

    expect(reminders).toHaveLength(1)
    expect(reminders[0].user._id.toString()).toBe(user._id.toString())
    expect(reminders[0].undoneHabitNames).toEqual(['Undone habit'])
  })

  it('mode "specific" only considers the chosen habits, even if others are undone', async () => {
    const user = await createUser('specific-mode@test.com')
    const chosen = await Habit.create({ userId: user._id, name: 'Chosen', targetFrequency: 3 })
    await Habit.create({ userId: user._id, name: 'Not chosen', targetFrequency: 3 })
    user.emailReminders = { enabled: true, mode: 'specific', habitIds: [chosen._id] }
    await user.save()

    const reminders = await remindersService.getDueReminders()

    expect(reminders).toHaveLength(1)
    expect(reminders[0].undoneHabitNames).toEqual(['Chosen'])
  })

  it('excludes a user once every in-scope habit is already logged today', async () => {
    const user = await createUser('all-done@test.com', { enabled: true, mode: 'all', habitIds: [] })
    const habit = await Habit.create({ userId: user._id, name: 'Habit', targetFrequency: 3 })
    await HabitLog.create({ userId: user._id, habitId: habit._id, date: normalizeDate(new Date()) })

    const reminders = await remindersService.getDueReminders()

    expect(reminders).toHaveLength(0)
  })

  it('excludes users who have reminders disabled', async () => {
    const user = await createUser('disabled@test.com') // enabled defaults to false
    await Habit.create({ userId: user._id, name: 'Habit', targetFrequency: 3 })

    const reminders = await remindersService.getDueReminders()

    expect(reminders).toHaveLength(0)
  })

  it('silently drops a chosen habit that has since been deleted, instead of erroring', async () => {
    const user = await createUser('deleted-habit@test.com')
    const kept = await Habit.create({ userId: user._id, name: 'Kept', targetFrequency: 3 })
    const deleted = await Habit.create({ userId: user._id, name: 'Deleted', targetFrequency: 3 })
    user.emailReminders = { enabled: true, mode: 'specific', habitIds: [kept._id, deleted._id] }
    await user.save()
    await deleted.deleteOne()

    const reminders = await remindersService.getDueReminders()

    expect(reminders).toHaveLength(1)
    expect(reminders[0].undoneHabitNames).toEqual(['Kept'])
  })
})
