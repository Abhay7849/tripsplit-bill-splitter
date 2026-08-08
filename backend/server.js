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

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tripsplit_db';

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('🍃 MongoDB Database Connected for TripSplit'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

const tripRoutes = require('./routes/tripRoutes');
app.use('/api/trips', tripRoutes);

app.get('/', (req, res) => {
    res.send({
        system: 'TripSplit Expense Equalizer API',
        status: 'Online',
        version: '1.0.0',
        timestamp: new Date()
    });
});

app.listen(PORT, () => {
    console.log(`🚀 TripSplit MERN Backend Running on http://localhost:${PORT}`);
});
