const mongoose = require('mongoose');

const savedRouteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  origin: {
    code: String,
    city: String,
    country: String
  },
  destination: {
    code: String,
    city: String,
    country: String
  },
  label: {
    type: String,
    default: ''
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'occasional'],
    default: 'occasional'
  },
  savedAt: {
    type: Date,
    default: Date.now
  },
  lastSearched: Date,
  notes: String
});

module.exports = mongoose.model('SavedRoute', savedRouteSchema);
