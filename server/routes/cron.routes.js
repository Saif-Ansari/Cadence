const express = require('express')
const cronController = require('../controllers/cron.controller')
const cronAuth = require('../middleware/cronAuth')

const router = express.Router()

router.post('/habit-reminders', cronAuth, cronController.runHabitReminders)

module.exports = router
