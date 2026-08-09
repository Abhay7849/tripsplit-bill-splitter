const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST Signup User
router.post('/signup', async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;
        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const newUser = new User({
            name,
            email: email.toLowerCase(),
            phone,
            password
        });
        const saved = await newUser.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Login User
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email.toLowerCase(), password });
        if (!user) {
            return res.status(401).json({ error: 'Invalid Email or Password' });
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
