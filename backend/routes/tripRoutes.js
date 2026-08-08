const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');

// GET all trips
router.get('/', async (req, res) => {
    try {
        const trips = await Trip.find().sort({ createdAt: -1 });
        res.json(trips);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create new trip
router.post('/', async (req, res) => {
    try {
        const newTrip = new Trip(req.body);
        const saved = await newTrip.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST add expense to trip
router.post('/:id/expenses', async (req, res) => {
    try {
        const trip = await Trip.findOne({ id: req.params.id });
        if (!trip) return res.status(404).json({ error: 'Trip not found' });

        trip.expenses.unshift(req.body);
        await trip.save();
        res.json(trip);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
