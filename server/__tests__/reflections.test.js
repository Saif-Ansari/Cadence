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
})
