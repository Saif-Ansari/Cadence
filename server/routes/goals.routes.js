const express = require('express')
const goalsController = require('../controllers/goals.controller')
const protect = require('../middleware/auth')

const router = express.Router()

// All goals routes require authentication
router.use(protect)

router.get('/', goalsController.getGoals)
router.post('/', goalsController.createGoal)
router.patch('/:id', goalsController.updateGoal)
router.delete('/:id', goalsController.deleteGoal)

router.post('/:id/milestones', goalsController.addMilestone)
router.patch('/:id/milestones/:mid', goalsController.toggleMilestone)
router.delete('/:id/milestones/:mid', goalsController.deleteMilestone)

module.exports = router
