const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');

// GET trips filtered by logged-in user email
router.get('/', async (req, res) => {
    try {
        const { userEmail } = req.query;
        let query = {};
        if (userEmail) {
            query.createdByEmail = userEmail.toLowerCase();
        }
        const trips = await Trip.find(query).sort({ createdAt: -1 });
        res.json(trips);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Create new trip with user isolation
router.post('/', async (req, res) => {
    try {
        const { id, title, createdByEmail, members, expenses } = req.body;
        const newTrip = new Trip({
            id,
            title,
            createdByEmail: createdByEmail ? createdByEmail.toLowerCase() : 'guest@gmail.com',
            members,
            expenses
        });
        const saved = await newTrip.save();
        console.log(`🍃 MongoDB Saved Trip "${saved.title}" for user: ${saved.createdByEmail}`);
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST Add expense to trip
router.post('/:id/expenses', async (req, res) => {
    try {
        const trip = await Trip.findOne({ id: req.params.id });
        if (!trip) {
            return res.status(404).json({ error: 'Trip not found' });
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
