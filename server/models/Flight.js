const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema({
  airline: {
    type: String,
    required: true
  },
  airlineCode: {
    type: String,
    required: true
  },
  flightNumber: {
    type: String,
    required: true
  },
  from: {
    code: String,
    city: String,
    country: String
  },
  to: {
    code: String,
    city: String,
    country: String
  },
  departureTime: {
    type: Date,
    required: true
  },
  arrivalTime: {
    type: Date,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  duration: {
    type: String, // e.g., "2h 30m"
    required: true
  },
  stops: {
    type: Number,
    default: 0
  },
  stopCities: [String],
  available: {
    type: Boolean,
    default: true
  },
  capacity: {
    type: Number,
    default: 180
  },
  seatsAvailable: {
    type: Number,
    default: 180
  },
  class: {
    type: String,
    enum: ['economy', 'business', 'first'],
    default: 'economy'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Flight', flightSchema);
