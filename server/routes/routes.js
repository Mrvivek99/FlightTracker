const express = require('express');
const SavedRoute = require('../models/SavedRoute');
const PriceAlert = require('../models/PriceAlert');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// Save a route
router.post('/save', authenticate, async (req, res) => {
  try {
    const { origin, destination, label, frequency, notes } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination are required' });
    }

    const savedRoute = new SavedRoute({
      userId: req.userId,
      origin,
      destination,
      label: label || `${origin.code} → ${destination.code}`,
      frequency: frequency || 'occasional',
      notes
    });

    await savedRoute.save();

    res.status(201).json({
      success: true,
      route: savedRoute
    });
  } catch (error) {
    console.error('Save route error:', error);
    res.status(500).json({ error: 'Failed to save route' });
  }
});

// Get user's saved routes
router.get('/saved', authenticate, async (req, res) => {
  try {
    const routes = await SavedRoute.find({ userId: req.userId }).sort({ savedAt: -1 });
    res.json({
      success: true,
      routes
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch saved routes' });
  }
});

// Delete saved route
router.delete('/saved/:id', authenticate, async (req, res) => {
  try {
    const route = await SavedRoute.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    res.json({ success: true, message: 'Route deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete route' });
  }
});

// Create price alert
router.post('/alert', authenticate, async (req, res) => {
  try {
    const { origin, destination, maxPrice, notifyVia } = req.body;

    if (!origin || !destination || !maxPrice) {
      return res.status(400).json({ error: 'Origin, destination, and maxPrice are required' });
    }

    const alert = new PriceAlert({
      userId: req.userId,
      origin,
      destination,
      maxPrice,
      notifyVia: notifyVia || ['email']
    });

    await alert.save();

    res.status(201).json({
      success: true,
      alert
    });
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({ error: 'Failed to create price alert' });
  }
});

// Get user's price alerts
router.get('/alerts', authenticate, async (req, res) => {
  try {
    const alerts = await PriceAlert.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({
      success: true,
      alerts
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch price alerts' });
  }
});

// Update price alert status
router.patch('/alert/:id', authenticate, async (req, res) => {
  try {
    const { status } = req.body;

    const alert = await PriceAlert.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { status },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({ success: true, alert });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

// Delete price alert
router.delete('/alert/:id', authenticate, async (req, res) => {
  try {
    const alert = await PriceAlert.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({ success: true, message: 'Alert deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});

module.exports = router;
