const request = require('supertest')
const app = require('../app')

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
})
