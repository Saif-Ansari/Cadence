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

  it('rejects a MongoDB query operator in place of a string field (NoSQL injection guard)', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      name: 'Eve',
      email: { $gt: '' },
      password: 'password123',
    })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('MISSING_FIELDS')
  })

  it('rejects new signups once MAX_USERS is reached', async () => {
    const originalMax = process.env.MAX_USERS
    process.env.MAX_USERS = '1'
    try {
      const first = await request(app).post('/api/auth/signup').send({
        name: 'First',
        email: 'first@test.com',
        password: 'password123',
      })
      expect(first.status).toBe(201)

      const second = await request(app).post('/api/auth/signup').send({
        name: 'Second',
        email: 'second@test.com',
        password: 'password123',
      })
      expect(second.status).toBe(403)
      expect(second.body.error.code).toBe('SIGNUPS_CLOSED')
    } finally {
      // process.env.MAX_USERS = undefined would coerce to the string
      // "undefined" rather than actually unsetting it — delete instead.
      if (originalMax === undefined) {
        delete process.env.MAX_USERS
      } else {
        process.env.MAX_USERS = originalMax
      }
    }
  })

  it('does not enforce a cap when MAX_USERS is unset', async () => {
    // Sanity check that the normal (unset) test/dev behavior is unaffected —
    // this is what every other test in this file already relies on.
    expect(process.env.MAX_USERS).toBeUndefined()
    const res = await request(app).post('/api/auth/signup').send({
      name: 'Uncapped',
      email: 'uncapped@test.com',
      password: 'password123',
    })
    expect(res.status).toBe(201)
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

  it('rejects a MongoDB query operator in place of a string field (NoSQL injection guard)', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: { $gt: '' },
      password: 'whatever',
    })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('MISSING_FIELDS')
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
