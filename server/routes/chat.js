const express = require('express');
const { callGemini, extractIntent } = require('../services/geminiService');
const Flight = require('../models/Flight');
const ChatLog = require('../models/ChatLog');
const crypto = require('crypto');
const uuidv4 = () => crypto.randomUUID();

const router = express.Router();

// Optional auth middleware — attaches userId if token present, but doesn't block guests
const optionalAuth = (req, res, next) => {
  try {
    const jwt = require('jsonwebtoken');
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.userId;
    }
  } catch (_) {
    // Guest user — no token or invalid token, that's fine
    req.userId = null;
  }
  next();
};

/**
 * Fetch relevant flight data as context for the AI.
 * Uses detected intent (from/to/date) or falls back to a general search.
 */
const getFlightContext = async (intent, message) => {
  try {
    const messageUpper = message.toUpperCase();
    const isFlightQuery = messageUpper.includes('FLIGHT') ||
      messageUpper.includes('FROM') ||
      messageUpper.includes('TICKET') ||
      messageUpper.includes('BOOK') ||
      messageUpper.includes('FLY') ||
      messageUpper.includes('PRICE') ||
      messageUpper.includes('CHEAP') ||
      intent.from || intent.to;

    if (!isFlightQuery) return '';

    const query = { available: true };
    if (intent.from) query['from.code'] = intent.from.toUpperCase();
    if (intent.to) query['to.code'] = intent.to.toUpperCase();

    // If we have both codes, search specifically
    let flights = [];
    if (intent.from && intent.to) {
      flights = await Flight.find(query).sort({ price: 1 }).limit(8).lean();
    } else {
      // Generic: just get the cheapest available flights
      flights = await Flight.find({ available: true }).sort({ price: 1 }).limit(6).lean();
    }

    if (flights.length === 0) return '';

    return flights.map(f =>
      `${f.airline} (${f.flightNumber}): ${f.from.city} (${f.from.code}) → ${f.to.city} (${f.to.code}) | ` +
      `Departs: ${new Date(f.departureTime).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })} | ` +
      `Arrives: ${new Date(f.arrivalTime).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' })} | ` +
      `Price: $${f.price} ${f.currency} | Duration: ${f.duration} | ` +
      `Stops: ${f.stops === 0 ? 'Direct' : `${f.stops} stop(s) via ${f.stopCities?.join(', ')}`} | ` +
      `Seats Left: ${f.seatsAvailable} | Class: ${f.class}`
    ).join('\n');
  } catch (error) {
    console.error('Error fetching flight context:', error);
    return '';
  }
};

// POST /api/chat — Main chat endpoint (works for guests AND logged-in users)
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { message, history = [], sessionId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Resolve or create session ID
    const currentSessionId = sessionId || uuidv4();

    // Extract flight intent from message
    const intent = extractIntent(message);

    // Fetch relevant flight data as context
    const flightContext = await getFlightContext(intent, message);

    // Call Gemini with history for multi-turn conversation
    const aiResponse = await callGemini(message, flightContext, history);

    // Persist chat log to MongoDB (async, don't block response)
    persistChatLog(currentSessionId, req.userId, history, message, aiResponse, flightContext, intent).catch(err =>
      console.error('Failed to persist chat log:', err)
    );

    res.json({
      success: true,
      message: aiResponse,
      sessionId: currentSessionId,
      detectedIntent: intent.from || intent.to ? intent : null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get AI response',
      message: "I'm having trouble connecting right now. Please try again in a moment! ✈️"
    });
  }
});

// Async helper to persist the chat turn
async function persistChatLog(sessionId, userId, history, userMessage, aiResponse, flightContext, intent) {
  try {
    let chatLog = await ChatLog.findOne({ sessionId });

    if (!chatLog) {
      chatLog = new ChatLog({
        sessionId,
        userId: userId || null,
        messages: [],
        detectedIntent: intent
      });
    }

    // Append new user message
    chatLog.messages.push({ role: 'user', content: userMessage, flightContext });
    // Append AI response
    chatLog.messages.push({ role: 'model', content: aiResponse, flightContext: '' });

    // Update intent if we detected one
    if (intent.from) chatLog.detectedIntent.from = intent.from;
    if (intent.to) chatLog.detectedIntent.to = intent.to;
    if (intent.date) chatLog.detectedIntent.date = intent.date;

    // If user got authenticated after starting as guest, link the session
    if (userId && !chatLog.userId) {
      chatLog.userId = userId;
    }

    await chatLog.save();
  } catch (error) {
    console.error('Chat persistence error:', error);
  }
}

// GET /api/chat/history — Get chat sessions for logged in user
router.get('/history', async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const sessions = await ChatLog.find({ userId: decoded.userId })
      .sort({ updatedAt: -1 })
      .limit(10)
      .select('sessionId messages detectedIntent createdAt updatedAt')
      .lean();

    res.json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// DELETE /api/chat/history/:sessionId — Delete a specific session
router.delete('/history/:sessionId', async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await ChatLog.findOneAndDelete({
      sessionId: req.params.sessionId,
      userId: decoded.userId
    });

    res.json({ success: true, message: 'Session deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

module.exports = router;
