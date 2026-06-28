const express = require('express')
const authController = require('../controllers/auth.controller')
const protect = require('../middleware/auth')

const router = express.Router()

router.post('/signup', authController.signup)
router.post('/login', authController.login)
router.post('/logout', authController.logout)
router.get('/me', protect, authController.me)
router.patch('/password', protect, authController.changePassword)

module.exports = router
