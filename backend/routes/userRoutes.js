const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET all registered users in MongoDB
router.get('/', async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Signup User in MongoDB
router.post('/signup', async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(400).json({ error: 'Account with this email already exists!' });
        }

        const newUser = new User({
            name,
            email: email.toLowerCase(),
            phone: phone || '9811122334',
            password
        });
        const saved = await newUser.save();
        console.log('🍃 MongoDB Saved New User:', saved.email);
        res.status(201).json(saved);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Login User against MongoDB
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email.toLowerCase(), password });
        if (!user) {
            return res.status(401).json({ error: 'Invalid Email or Password' });
        }
        console.log('✅ MongoDB Verified Login User:', user.email);
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
