const express = require('express');
const router = express.Router();
const Habit = require('../models/Habit');

// GET /api/habits — fetch all habits, newest first
router.get('/', async (req, res) => {
  try {
    const habits = await Habit.find().sort({ createdAt: -1 });
    res.json(habits);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/habits — create a new habit
router.post('/', async (req, res) => {
  const { name, description, frequency } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Habit name is required' });
  }

  const habit = new Habit({ name, description, frequency });

  try {
    const saved = await habit.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH /api/habits/:id/toggle — flip the isCompleted flag
router.patch('/:id/toggle', async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);
    if (!habit) return res.status(404).json({ message: 'Habit not found' });

    habit.isCompleted = !habit.isCompleted;
    const updated = await habit.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/habits/:id — remove a habit
router.delete('/:id', async (req, res) => {
  try {
    const habit = await Habit.findByIdAndDelete(req.params.id);
    if (!habit) return res.status(404).json({ message: 'Habit not found' });

    res.json({ message: 'Habit deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
