const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
    id: String,
    name: String,
    phone: String,
    upiId: String
});

const expenseSchema = new mongoose.Schema({
    id: String,
    title: String,
    amount: Number,
    payerId: String,
    splitAmong: [String],
    date: String
});

const tripSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    createdByEmail: { type: String, required: true, index: true },
    members: [memberSchema],
    expenses: [expenseSchema]
}, { timestamps: true });

module.exports = mongoose.model('Trip', tripSchema);
