const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');

// GET all trips from MongoDB
router.get('/', async (req, res) => {
    try {
        const trips = await Trip.find().sort({ createdAt: -1 });
        res.json(trips);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Create new trip in MongoDB
router.post('/', async (req, res) => {
    try {
        const newTrip = new Trip(req.body);
        const saved = await newTrip.save();
        console.log('🍃 MongoDB Saved New Trip:', saved.title);
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST Add expense to trip in MongoDB
router.post('/:id/expenses', async (req, res) => {
    try {
        const trip = await Trip.findOne({ id: req.params.id });
        if (!trip) {
            // If trip not found by custom ID, search by _id or create
            const newTrip = new Trip({
                id: req.params.id,
                title: 'Active Trip',
                members: [],
                expenses: [req.body]
            });
            await newTrip.save();
            return res.status(201).json(newTrip);
        }

        trip.expenses.unshift(req.body);
        await trip.save();
        console.log('🍃 MongoDB Saved Expense to Trip:', req.body.title);
        res.json(trip);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
