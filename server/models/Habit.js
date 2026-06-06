const mongoose = require('mongoose');

// This schema defines the shape of a Habit document in MongoDB.
// Mongoose enforces this structure and adds helpful methods.
const habitSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Habit name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly'],
      default: 'daily',
    },
    // Tracks whether the habit was completed today
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  // timestamps: true automatically adds createdAt and updatedAt fields
  { timestamps: true }
);

// mongoose.model() compiles the schema into a Model.
// The first argument 'Habit' becomes the collection name 'habits' in MongoDB.
module.exports = mongoose.model('Habit', habitSchema);
