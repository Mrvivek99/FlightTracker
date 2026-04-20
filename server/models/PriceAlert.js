const mongoose = require('mongoose');

const priceAlertSchema = new mongoose.Schema({
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
  maxPrice: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'triggered'],
    default: 'active'
  },
  notifyVia: {
    type: [String],
    enum: ['email', 'push'],
    default: ['email']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  triggeredAt: Date,
  triggeredPrice: Number
});

module.exports = mongoose.model('PriceAlert', priceAlertSchema);
