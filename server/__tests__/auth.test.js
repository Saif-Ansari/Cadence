const request = require('supertest')
const app = require('../app')

describe('POST /api/auth/signup', () => {
  it('creates a user and returns a token', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      name: 'Alice',
      email: 'alice@test.com',
      password: 'password123',
    })
    expect(res.status).toBe(201)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.email).toBe('alice@test.com')
    expect(res.body.user.passwordHash).toBeUndefined()
  })

  it('rejects duplicate emails with 409', async () => {
    const payload = { name: 'Bob', email: 'bob@test.com', password: 'password123' }
    await request(app).post('/api/auth/signup').send(payload)
    const res = await request(app).post('/api/auth/signup').send(payload)
    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe('EMAIL_TAKEN')
  })

  it('rejects missing fields with 400', async () => {
    const res = await request(app).post('/api/auth/signup').send({ email: 'x@x.com' })
    expect(res.status).toBe(400)
  })
})

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/signup').send({
      name: 'Charlie',
      email: 'charlie@test.com',
      password: 'secret123',
    })
  })

  it('returns token and user on valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'charlie@test.com',
      password: 'secret123',
    })
    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.name).toBe('Charlie')
  })

  it('rejects wrong password with 401', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'charlie@test.com',
      password: 'wrong',
    })
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS')
  })

  it('rejects unknown email with 401', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@test.com',
      password: 'whatever',
    })
    expect(res.status).toBe(401)
  })
})

describe('PATCH /api/auth/password', () => {
  let token

  beforeEach(async () => {
    const res = await request(app).post('/api/auth/signup').send({
      name: 'Dave',
      email: 'dave@test.com',
      password: 'oldpassword',
    })
    token = res.body.token
  })

  it('changes password when current password is correct', async () => {
    const res = await request(app)
      .patch('/api/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'oldpassword', newPassword: 'newpassword123' })
    expect(res.status).toBe(200)

    // Verify new password works
    const login = await request(app).post('/api/auth/login').send({
      email: 'dave@test.com',
      password: 'newpassword123',
    })
    expect(login.status).toBe(200)
  })

  it('rejects wrong current password with 400', async () => {
    const res = await request(app)
      .patch('/api/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'wrongpassword', newPassword: 'newpassword123' })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('WRONG_PASSWORD')
  })

  it('requires authentication', async () => {
    const res = await request(app)
      .patch('/api/auth/password')
      .send({ currentPassword: 'oldpass', newPassword: 'new123' })
    expect(res.status).toBe(401)
  })
})
