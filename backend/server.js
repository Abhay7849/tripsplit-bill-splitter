/* ==========================================================================
   TripSplit - Node.js + Express.js + MongoDB API Server
   ========================================================================== */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB Connection URL (Local MongoDB or Atlas Cloud)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tripsplit_db';

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('🍃 MongoDB Database Successfully Connected for TripSplit Engine'))
.catch(err => console.log('⚠️ MongoDB Connection Note (Running Local Mode + LocalStorage Sync):', err.message));

const tripRoutes = require('./routes/tripRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/trips', tripRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
    res.send({
        system: 'TripSplit MERN MongoDB Engine',
        status: 'Online',
        version: '2.0.0',
        timestamp: new Date()
    });
});

app.listen(PORT, () => {
    console.log(`🚀 TripSplit MongoDB Backend API Running on http://localhost:${PORT}`);
});
