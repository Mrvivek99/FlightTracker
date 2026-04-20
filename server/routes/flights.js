const express = require('express');
const Flight = require('../models/Flight');
const mockFlights = require('../data/mockFlights');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// Ensure compound index exists for fast route searches
Flight.collection.createIndex({ 'from.code': 1, 'to.code': 1, departureTime: 1 })
  .catch(() => {}); // Silently ignore if already exists

// Initialize mock flights in database if empty
const initializeMockFlights = async () => {
  try {
    const count = await Flight.countDocuments();
    if (count === 0) {
      await Flight.insertMany(mockFlights);
      console.log('✅ Mock flights initialized');
    }
  } catch (error) {
    console.error('Error initializing mock flights:', error);
  }
};

// Initialize on first request
let initialized = false;
router.use(async (req, res, next) => {
  if (!initialized) {
    await initializeMockFlights();
    initialized = true;
  }
  next();
});

// Search flights
router.get('/search', async (req, res) => {
  try {
    const { from, to, departDate, returnDate, passengers } = req.query;

    if (!from || !to) {
      return res.status(400).json({ error: 'from and to are required' });
    }

    // Build query
    let query = {
      'from.code': from.toUpperCase(),
      'to.code': to.toUpperCase(),
      available: true
    };

    // Filter by date if provided
    if (departDate) {
      const startDate = new Date(departDate);
      const endDate = new Date(departDate);
      endDate.setDate(endDate.getDate() + 1);
      query.departureTime = { $gte: startDate, $lt: endDate };
    }

    // Execute query
    let flights = await Flight.find(query).sort({ price: 1 }).limit(50);

    // If no flights found, return mock flights filtered by route
    if (flights.length === 0) {
      flights = mockFlights.filter(f =>
        f.from.code === from.toUpperCase() &&
        f.to.code === to.toUpperCase()
      ).sort((a, b) => a.price - b.price);
    }

    res.json({
      success: true,
      count: flights.length,
      flights: flights.map(f => ({
        _id: f._id,
        airline: f.airline,
        airlineCode: f.airlineCode,
        flightNumber: f.flightNumber,
        from: f.from,
        to: f.to,
        departureTime: f.departureTime,
        arrivalTime: f.arrivalTime,
        price: f.price,
        currency: f.currency,
        duration: f.duration,
        stops: f.stops,
        stopCities: f.stopCities,
        seatsAvailable: f.seatsAvailable,
        class: f.class
      }))
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Flight search failed' });
  }
});

// POST /search — Same as GET /search but for chatbot / POST bodies
router.post('/search', async (req, res) => {
  // Normalize: merge body into query-like object then delegate
  req.query = { ...req.query, ...req.body };
  // Re-use the same handler by redirecting internally via next — simplest: just duplicate logic
  try {
    const { from, to, departDate } = req.body;

    if (!from || !to) {
      return res.status(400).json({ error: 'from and to are required' });
    }

    const query = {
      'from.code': from.toUpperCase(),
      'to.code': to.toUpperCase(),
      available: true
    };

    if (departDate) {
      const startDate = new Date(departDate);
      const endDate = new Date(departDate);
      endDate.setDate(endDate.getDate() + 1);
      query.departureTime = { $gte: startDate, $lt: endDate };
    }

    let flights = await Flight.find(query).sort({ price: 1 }).limit(50);

    if (flights.length === 0) {
      flights = mockFlights.filter(f =>
        f.from.code === from.toUpperCase() &&
        f.to.code === to.toUpperCase()
      ).sort((a, b) => a.price - b.price);
    }

    res.json({
      success: true,
      count: flights.length,
      flights: flights.map(f => ({
        _id: f._id,
        airline: f.airline,
        airlineCode: f.airlineCode,
        flightNumber: f.flightNumber,
        from: f.from,
        to: f.to,
        departureTime: f.departureTime,
        arrivalTime: f.arrivalTime,
        price: f.price,
        currency: f.currency,
        duration: f.duration,
        stops: f.stops,
        stopCities: f.stopCities,
        seatsAvailable: f.seatsAvailable,
        class: f.class
      }))
    });
  } catch (error) {
    console.error('POST search error:', error);
    res.status(500).json({ error: 'Flight search failed' });
  }
});

// Get popular routes
router.get('/popular', async (req, res) => {
  try {
    const popularRoutes = [
      { from: 'JFK', to: 'LHR', city_from: 'New York', city_to: 'London' },
      { from: 'DEL', to: 'DXB', city_from: 'Delhi', city_to: 'Dubai' },
      { from: 'DEL', to: 'BLR', city_from: 'Delhi', city_to: 'Bangalore' },
      { from: 'SIN', to: 'HKG', city_from: 'Singapore', city_to: 'Hong Kong' },
      { from: 'LAX', to: 'NRT', city_from: 'Los Angeles', city_to: 'Tokyo' }
    ];

    const routesWithPrices = await Promise.all(
      popularRoutes.map(async (route) => {
        const flight = await Flight.findOne({
          'from.code': route.from,
          'to.code': route.to
        }).sort({ price: 1 });

        return {
          from: route.from,
          to: route.to,
          fromCity: route.city_from,
          toCity: route.city_to,
          cheapestPrice: flight?.price || 'N/A',
          currency: flight?.currency || 'USD'
        };
      })
    );

    res.json({
      success: true,
      routes: routesWithPrices
    });
  } catch (error) {
    console.error('Popular routes error:', error);
    res.status(500).json({ error: 'Failed to fetch popular routes' });
  }
});

// Get flight by ID
router.get('/:id', async (req, res) => {
  try {
    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      return res.status(404).json({ error: 'Flight not found' });
    }
    res.json({ success: true, flight });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch flight' });
  }
});

module.exports = router;
