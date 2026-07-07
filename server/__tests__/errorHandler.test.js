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

describe('Centralized error handling', () => {
  it('returns a clean 400 instead of a raw Mongoose CastError on a malformed id', async () => {
    const token = await createUser()
    const res = await request(app)
      .get('/api/reflections/not-an-id')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('INVALID_ID')
    expect(res.body.error.message).not.toMatch(/Cast to ObjectId/)
  })

  it('returns a JSON 404 for unknown /api routes', async () => {
    const res = await request(app).get('/api/does-not-exist')
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})
