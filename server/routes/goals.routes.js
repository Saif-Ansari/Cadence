const express = require('express')
const goalsController = require('../controllers/goals.controller')
const protect = require('../middleware/auth')

const router = express.Router()

router.use(protect)

router.get('/', goalsController.getGoals)
router.post('/', goalsController.createGoal)
router.patch('/:id', goalsController.updateGoal)
router.delete('/:id', goalsController.deleteGoal)

module.exports = router
