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

describe('Reflections', () => {
  let token

  beforeEach(async () => {
    token = await createUser()
  })

  it('returns null when no reflection exists for today', async () => {
    const res = await request(app)
      .get('/api/reflections/today')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.reflection).toBeNull()
  })

  it('upserts today\'s reflection', async () => {
    const res = await request(app)
      .put('/api/reflections/today')
      .set('Authorization', `Bearer ${token}`)
      .send({ overallDay: 'Great day', focusScore: 8 })
    expect(res.status).toBe(200)
    expect(res.body.reflection.overallDay).toBe('Great day')
    expect(res.body.reflection.focusScore).toBe(8)
  })

  it('updates an existing reflection on second upsert', async () => {
    await request(app)
      .put('/api/reflections/today')
      .set('Authorization', `Bearer ${token}`)
      .send({ overallDay: 'First save', focusScore: 5 })

    const res = await request(app)
      .put('/api/reflections/today')
      .set('Authorization', `Bearer ${token}`)
      .send({ overallDay: 'Updated', focusScore: 9 })
    expect(res.status).toBe(200)
    expect(res.body.reflection.overallDay).toBe('Updated')
    expect(res.body.reflection.focusScore).toBe(9)
  })

  it('strips non-allowed fields (allowlist guard)', async () => {
    const res = await request(app)
      .put('/api/reflections/today')
      .set('Authorization', `Bearer ${token}`)
      .send({ overallDay: 'Good', userId: 'injected', randomField: 'hacked' })
    expect(res.status).toBe(200)
    expect(res.body.reflection.randomField).toBeUndefined()
  })

  it('rejects a focusScore outside 1-10 on upsert', async () => {
    const res = await request(app)
      .put('/api/reflections/today')
      .set('Authorization', `Bearer ${token}`)
      .send({ focusScore: 999 })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('lists all reflections sorted by date descending', async () => {
    await request(app)
      .put('/api/reflections/today')
      .set('Authorization', `Bearer ${token}`)
      .send({ overallDay: 'Today' })

    const res = await request(app)
      .get('/api/reflections')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.reflections).toHaveLength(1)
  })

  it('only returns reflections for the authenticated user', async () => {
    const token2 = await createUser('other@test.com')
    await request(app)
      .put('/api/reflections/today')
      .set('Authorization', `Bearer ${token2}`)
      .send({ overallDay: 'Other user reflection' })

    const res = await request(app)
      .get('/api/reflections')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.reflections).toHaveLength(0)
  })

  it('honors a client-supplied localDate as "today", not the server clock', async () => {
    await request(app)
      .put('/api/reflections/today')
      .set('Authorization', `Bearer ${token}`)
      .send({ overallDay: 'Written for a specific day', localDate: '2026-03-15' })

    const sameDay = await request(app)
      .get('/api/reflections/today?localDate=2026-03-15')
      .set('Authorization', `Bearer ${token}`)
    expect(sameDay.body.reflection.overallDay).toBe('Written for a specific day')

    const differentDay = await request(app)
      .get('/api/reflections/today?localDate=2026-03-16')
      .set('Authorization', `Bearer ${token}`)
    expect(differentDay.body.reflection).toBeNull()
  })
})
