const request = require('supertest')
const app = require('../app')
const Habit = require('../models/Habit')
const HabitLog = require('../models/HabitLog')

async function createUser(email = 'user@test.com') {
  const res = await request(app).post('/api/auth/signup').send({
    name: 'Test User',
    email,
    password: 'password123',
  })
  return res.body.token
}

describe('Habits CRUD', () => {
  let token

  beforeEach(async () => {
    token = await createUser()
  })

  it('creates a habit', async () => {
    const res = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Read', targetFrequency: 5, description: 'Daily reading' })
    expect(res.status).toBe(201)
    expect(res.body.habit.name).toBe('Read')
    expect(res.body.habit.targetFrequency).toBe(5)
  })

  it('rejects a targetFrequency outside 1-7', async () => {
    const res = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Read', targetFrequency: 10 })
    expect(res.status).toBe(400)
  })

  it('updates a habit', async () => {
    const create = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Read', targetFrequency: 3 })

    const res = await request(app)
      .patch(`/api/habits/${create.body.habit._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ targetFrequency: 5 })
    expect(res.status).toBe(200)
    expect(res.body.habit.targetFrequency).toBe(5)
  })

  it('deletes a habit and cascades to its logs', async () => {
    const create = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Read', targetFrequency: 3 })
    const habitId = create.body.habit._id

    await request(app)
      .patch(`/api/habits/${habitId}/toggle`)
      .set('Authorization', `Bearer ${token}`)
      .send({ date: '2026-03-16T00:00:00.000Z' })

    const del = await request(app)
      .delete(`/api/habits/${habitId}`)
      .set('Authorization', `Bearer ${token}`)
    expect(del.status).toBe(200)

    // Re-creating a habit with the same toggle date should start fresh —
    // if the old log wasn't actually cascade-deleted, this would 500 on a
    // duplicate-key error from HabitLog's unique (habitId, userId, date) index.
    const recreate = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Read again', targetFrequency: 3 })
    const toggleAgain = await request(app)
      .patch(`/api/habits/${recreate.body.habit._id}/toggle`)
      .set('Authorization', `Bearer ${token}`)
      .send({ date: '2026-03-16T00:00:00.000Z' })
    expect(toggleAgain.status).toBe(200)
  })

  it('only returns habits for the authenticated user', async () => {
    const token2 = await createUser('other@test.com')
    await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${token2}`)
      .send({ name: 'Other user habit', targetFrequency: 3 })

    const res = await request(app)
      .get('/api/habits')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.habits).toHaveLength(0)
  })
})

describe('Habit day toggle + weekly grid', () => {
  let token, habitId

  beforeEach(async () => {
    token = await createUser()
    const create = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Read', targetFrequency: 5 })
    habitId = create.body.habit._id
  })

  it('builds the weekly grid Mon-Sun anchored on the client-supplied localDate, not the server clock', async () => {
    // 2026-03-18 is a Wednesday; its week runs Monday 2026-03-16 to Sunday 2026-03-22.
    const res = await request(app)
      .get('/api/habits?localDate=2026-03-18')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    const grid = res.body.habits[0].weekGrid
    expect(grid).toHaveLength(7)
    expect(grid[0].date).toBe('2026-03-16T00:00:00.000Z')
    expect(grid[6].date).toBe('2026-03-22T00:00:00.000Z')
    expect(grid.every((day) => day.done === false)).toBe(true)
  })

  it('flags days before the habit existed instead of showing them as missed', async () => {
    // Backdate createdAt directly via the raw collection — Mongoose's
    // `timestamps: true` silently ignores createdAt on findByIdAndUpdate/save,
    // and the API itself has no way to set it since it's server-controlled.
    const habitDoc = await Habit.findById(habitId)
    await Habit.collection.updateOne({ _id: habitDoc._id }, { $set: { createdAt: new Date('2026-03-18T00:00:00.000Z') } })

    const res = await request(app)
      .get('/api/habits?localDate=2026-03-18') // same Mon 03-16 - Sun 03-22 week
      .set('Authorization', `Bearer ${token}`)
    const grid = res.body.habits[0].weekGrid

    expect(grid[0].beforeCreation).toBe(true) // Monday 03-16
    expect(grid[1].beforeCreation).toBe(true) // Tuesday 03-17
    expect(grid[2].beforeCreation).toBe(false) // Wednesday 03-18 — creation day itself
    expect(grid[3].beforeCreation).toBe(false) // Thursday 03-19
  })

  it('toggling a day marks it done, and toggling again undoes it', async () => {
    const first = await request(app)
      .patch(`/api/habits/${habitId}/toggle`)
      .set('Authorization', `Bearer ${token}`)
      .send({ date: '2026-03-18T00:00:00.000Z' })
    expect(first.body).toEqual({ done: true })

    const habits = await request(app)
      .get('/api/habits?localDate=2026-03-18')
      .set('Authorization', `Bearer ${token}`)
    const wednesday = habits.body.habits[0].weekGrid[2] // Mon, Tue, Wed
    expect(wednesday.date).toBe('2026-03-18T00:00:00.000Z')
    expect(wednesday.done).toBe(true)

    const second = await request(app)
      .patch(`/api/habits/${habitId}/toggle`)
      .set('Authorization', `Bearer ${token}`)
      .send({ date: '2026-03-18T00:00:00.000Z' })
    expect(second.body).toEqual({ done: false })
  })

  it('returns 404 when toggling a habit that does not belong to the user', async () => {
    const token2 = await createUser('other@test.com')
    const res = await request(app)
      .patch(`/api/habits/${habitId}/toggle`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ date: '2026-03-18T00:00:00.000Z' })
    expect(res.status).toBe(404)
  })

  it('does not count weeks before the habit was created toward the streak', async () => {
    // Consecutive Mondays: 03-09, 03-16, 03-23. Habit "created" 03-16 — the
    // week of 03-09 predates it. "Now" is 03-25 (in the 03-23 week, which the
    // streak walk always skips), so the walk considers 03-16 (creation week,
    // legitimate) then would consider 03-09 next if not stopped.
    const habitDoc = await Habit.findById(habitId)
    await Habit.collection.updateOne({ _id: habitDoc._id }, { $set: { createdAt: new Date('2026-03-16T00:00:00.000Z') } })

    const targetFrequency = 3
    await Habit.findByIdAndUpdate(habitId, { targetFrequency })

    async function logDone(dateStr) {
      await HabitLog.create({ habitId, userId: (await Habit.findById(habitId)).userId, date: new Date(dateStr) })
    }

    // Legitimate: 3 done days in the creation week (03-16 to 03-22) — meets target.
    await logDone('2026-03-16T00:00:00.000Z')
    await logDone('2026-03-17T00:00:00.000Z')
    await logDone('2026-03-18T00:00:00.000Z')

    // Fabricated pre-creation data (shouldn't exist under normal use, but the
    // API doesn't currently reject it) — also meets target, for the week
    // before the habit existed (03-09 to 03-15).
    await logDone('2026-03-09T00:00:00.000Z')
    await logDone('2026-03-10T00:00:00.000Z')
    await logDone('2026-03-11T00:00:00.000Z')

    const res = await request(app)
      .get('/api/habits?localDate=2026-03-25')
      .set('Authorization', `Bearer ${token}`)

    // Streak should be 1 (only the creation week) — not 2, which is what
    // you'd get if the pre-creation week were incorrectly counted.
    expect(res.body.habits[0].streak).toBe(1)
  })
})
