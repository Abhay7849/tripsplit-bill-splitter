# 🏖️ TripSplit - Group Trip Expense Equalizer & WhatsApp Settlement Engine

![TripSplit Banner](https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&auto=format&fit=crop&q=80)

**TripSplit** is a production-grade, human-crafted **Group Trip Expense Equalizer & 1-Click WhatsApp Settlement Platform**. It automates trip finances, calculates per-head shares, computes minimal payment transfers, and sends pre-filled itemized WhatsApp messages with direct UPI payment links (`upi://pay?pa=...&am=...`).

## 🌐 Live Demo & Deployment
👉 **Live Website**: [https://abhay7849.github.io/tripsplit-bill-splitter/](https://abhay7849.github.io/tripsplit-bill-splitter/)

---

## 💡 Real-World Problem Solved
On group trips, members spend money randomly (*Rahul pays for Hotel, Amit pays for Fuel, Priya pays for Dinner*). After the trip, manually calculating who owes whom is messy and asking friends for money is awkward.

TripSplit automatically computes minimal transfers (e.g. *Vikram owes ₹600 to Rahul and ₹400 to Priya*) and provides a 1-Click button that opens WhatsApp directly to that friend's phone number with full breakdown & UPI links!

---

## ✨ Key Features & Capabilities

1. **🏖️ Multi-Trip & Member Roster Management**:
   - Create trips (*Manali Trip 2026, Goa Beach Vacation*) & add friends with phone numbers and UPI IDs.

2. **💸 Real-Time Expense Entry**:
   - Log expenses (*Hotel ₹2,000, Fuel ₹800, Dinner ₹1,200*), select who paid, and split equally or custom.

3. **⚖️ Smart Equalizer & Minimal Transfer Algorithm**:
   - Computes total expense, per-head share, net balances (overpaid vs underpaid), and minimum settlement transactions.

4. **📲 1-Click Direct WhatsApp Settlement Launcher**:
   - Launches WhatsApp directly to the debtor friend's phone number with pre-filled itemized breakdown & UPI link (`upi://pay?pa=...&am=...`).

5. **🗄️ Full MERN Stack Backend (`/backend`)**:
   - Node.js + Express.js + Mongoose MongoDB schemas in `/backend` for Trips, Expenses, Members, and Settlements.

---

## 🛠️ Tech Stack
- **Frontend**: HTML5, CSS3 (Asymmetric Sidebar, Glassmorphism), Modern JavaScript (ES6+ Equalizer Engine).
- **Backend**: Node.js, Express.js, MongoDB Mongoose Models (`/backend`).
- **Deployment**: GitHub Pages & Vercel.

---

## 📜 License
&copy; 2026 **TripSplit Systems**. All Rights Reserved.
