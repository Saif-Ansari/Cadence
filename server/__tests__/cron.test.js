const request = require('supertest')
const app = require('../app')
const emailService = require('../services/email.service')

jest.mock('../services/email.service')

describe('POST /api/cron/habit-reminders', () => {
  const originalSecret = process.env.CRON_SECRET

  beforeAll(() => {
    process.env.CRON_SECRET = 'test-cron-secret'
  })

  afterAll(() => {
    process.env.CRON_SECRET = originalSecret
  })

  it('rejects requests with no secret header', async () => {
    const res = await request(app).post('/api/cron/habit-reminders')
    expect(res.status).toBe(401)
  })

  it('rejects requests with the wrong secret', async () => {
    const res = await request(app)
      .post('/api/cron/habit-reminders')
      .set('x-cron-secret', 'wrong-secret')
    expect(res.status).toBe(401)
  })

  it('accepts the correct secret and reports nothing sent when no one is due', async () => {
    const res = await request(app)
      .post('/api/cron/habit-reminders')
      .set('x-cron-secret', 'test-cron-secret')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ sent: 0, skipped: 0 })
    expect(emailService.sendHabitReminder).not.toHaveBeenCalled()
  })

  it('sends a reminder for a user with an undone habit', async () => {
    const signup = await request(app).post('/api/auth/signup').send({
      name: 'Cron User',
      email: 'cronuser@test.com',
      password: 'password123',
    })
    const token = signup.body.token

    await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Read', targetFrequency: 3 })

    await request(app)
      .patch('/api/auth/notifications')
      .set('Authorization', `Bearer ${token}`)
      .send({ enabled: true })

    const res = await request(app)
      .post('/api/cron/habit-reminders')
      .set('x-cron-secret', 'test-cron-secret')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ sent: 1, skipped: 0 })
    expect(emailService.sendHabitReminder).toHaveBeenCalledWith('cronuser@test.com', ['Read'])
  })
})
