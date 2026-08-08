/* ==========================================================================
   TripSplit - Group Trip Expense Equalizer & WhatsApp Settlement Engine
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------------------------
    // 1. Initial Sample Trip Data
    // ----------------------------------------------------------------------
    const defaultTrip = {
        id: 'TRIP-9081',
        title: 'Manali Trip 2026',
        createdAt: '2026-08-08',
        members: [
            { id: 'm1', name: 'Rahul Sharma', phone: '919811122334', upiId: 'rahul@upi' },
            { id: 'm2', name: 'Amit Patel', phone: '919822233445', upiId: '9822233445@upi' },
            { id: 'm3', name: 'Priya Singh', phone: '919833344556', upiId: 'priya@upi' },
            { id: 'm4', name: 'Vikram Kumar', phone: '919844455667', upiId: 'vikram@upi' }
        ],
        expenses: [
            {
                id: 'exp-1',
                title: 'Hotel Stay (3 Nights Resort)',
                amount: 2000,
                payerId: 'm1', // Rahul
                splitAmong: ['m1', 'm2', 'm3', 'm4'],
                date: '2026-08-08'
            },
            {
                id: 'exp-2',
                title: 'Highway Fuel & Toll Taxes',
                amount: 800,
                payerId: 'm2', // Amit
                splitAmong: ['m1', 'm2', 'm3', 'm4'],
                date: '2026-08-08'
            },
            {
                id: 'exp-3',
                title: 'Dinner at Mall Road Restaurant',
                amount: 1200,
                payerId: 'm3', // Priya
                splitAmong: ['m1', 'm2', 'm3', 'm4'],
                date: '2026-08-08'
            }
        ]
    };

    // ----------------------------------------------------------------------
    // 2. Application State & Local Storage Persistence
    // ----------------------------------------------------------------------
    let trips = JSON.parse(localStorage.getItem('tripsplit_trips')) || [defaultTrip];
    let activeTripId = localStorage.getItem('tripsplit_active_id') || defaultTrip.id;
    let currentUser = JSON.parse(localStorage.getItem('tripsplit_user')) || { name: 'Rahul Sharma', phone: '9811122334' };

    function saveState() {
        localStorage.setItem('tripsplit_trips', JSON.stringify(trips));
        localStorage.setItem('tripsplit_active_id', activeTripId);
        localStorage.setItem('tripsplit_user', JSON.stringify(currentUser));
        renderApp();
    }

    function getActiveTrip() {
        return trips.find(t => t.id === activeTripId) || trips[0];
    }

    // ----------------------------------------------------------------------
    // 3. DOM Elements
    // ----------------------------------------------------------------------
    const tripsNavList = document.getElementById('tripsNavList');
    const headerTripName = document.getElementById('headerTripName');
    const statTotalExpense = document.getElementById('statTotalExpense');
    const statPerHead = document.getElementById('statPerHead');
    const statMemberCount = document.getElementById('statMemberCount');
    const statOwedTransfers = document.getElementById('statOwedTransfers');
    const countExpenses = document.getElementById('countExpenses');

    const membersGrid = document.getElementById('membersGrid');
    const settlementGrid = document.getElementById('settlementGrid');
    const expensesList = document.getElementById('expensesList');

    const userNameDisplay = document.getElementById('userNameDisplay');
    const userPhoneDisplay = document.getElementById('userPhoneDisplay');

    // Modals
    const createTripModal = document.getElementById('createTripModal');
    const openCreateTripBtn = document.getElementById('openCreateTripBtn');
    const closeCreateTripModal = document.getElementById('closeCreateTripModal');
    const cancelCreateTripModal = document.getElementById('cancelCreateTripModal');
    const createTripForm = document.getElementById('createTripForm');
    const memberInputsContainer = document.getElementById('memberInputsContainer');
    const addMemberRowBtn = document.getElementById('addMemberRowBtn');

    const addExpenseModal = document.getElementById('addExpenseModal');
    const openAddExpenseBtn = document.getElementById('openAddExpenseBtn');
    const closeAddExpenseModal = document.getElementById('closeAddExpenseModal');
    const cancelAddExpenseModal = document.getElementById('cancelAddExpenseModal');
    const addExpenseForm = document.getElementById('addExpenseForm');
    const expensePayer = document.getElementById('expensePayer');
    const splitCheckboxContainer = document.getElementById('splitCheckboxContainer');

    const authModal = document.getElementById('authModal');
    const openAuthModalBtn = document.getElementById('openAuthModalBtn');
    const closeAuthModal = document.getElementById('closeAuthModal');
    const cancelAuthModal = document.getElementById('cancelAuthModal');
    const authForm = document.getElementById('authForm');
    const openTripReportWaBtn = document.getElementById('openTripReportWaBtn');

    // ----------------------------------------------------------------------
    // 4. Equalizer Math Engine (Calculates Minimal Settlement Transfers)
    // ----------------------------------------------------------------------
    function calculateEqualizer(trip) {
        const totalExpense = trip.expenses.reduce((sum, e) => sum + e.amount, 0);
        const memberCount = trip.members.length;
        const perHeadTarget = memberCount > 0 ? totalExpense / memberCount : 0;

        // Calculate Total Spent per member
        const memberStats = trip.members.map(m => {
            const totalSpent = trip.expenses
                .filter(e => e.payerId === m.id)
                .reduce((sum, e) => sum + e.amount, 0);
            
            const netBalance = totalSpent - perHeadTarget; // Positive = Overpaid, Negative = Owes

            return {
                id: m.id,
                name: m.name,
                phone: m.phone,
                upiId: m.upiId,
                totalSpent: totalSpent,
                netBalance: netBalance
            };
        });

        // Generate Minimal Settlement Transfers (Debtors -> Creditors)
        let creditors = memberStats.filter(m => m.netBalance > 0.01).map(m => ({ ...m }));
        let debtors = memberStats.filter(m => m.netBalance < -0.01).map(m => ({ ...m, owes: Math.abs(m.netBalance) }));

        let transfers = [];

        debtors.forEach(debtor => {
            let amountOwed = debtor.owes;

            creditors.forEach(creditor => {
                if (amountOwed <= 0 || creditor.netBalance <= 0) return;

                let transferAmount = Math.min(amountOwed, creditor.netBalance);
                transferAmount = Math.round(transferAmount);

                if (transferAmount > 0) {
                    transfers.push({
                        debtorId: debtor.id,
                        debtorName: debtor.name,
                        debtorPhone: debtor.phone,
                        creditorId: creditor.id,
                        creditorName: creditor.name,
                        creditorUpi: creditor.upiId,
                        amount: transferAmount
                    });

                    amountOwed -= transferAmount;
                    creditor.netBalance -= transferAmount;
                }
            });
        });

        return {
            totalExpense,
            perHeadTarget,
            memberStats,
            transfers
        };
    }

    // ----------------------------------------------------------------------
    // 5. Render Application Dashboard
    // ----------------------------------------------------------------------
    function renderApp() {
        const trip = getActiveTrip();
        if (!trip) return;

        // User Display
        userNameDisplay.textContent = currentUser.name;
        userPhoneDisplay.textContent = '+91 ' + currentUser.phone;

        // Render Nav Trips List
        tripsNavList.innerHTML = trips.map(t => `
            <a href="#" class="sidebar-nav-item ${t.id === activeTripId ? 'active' : ''}" onclick="switchTrip('${t.id}')">
                <span><i class="fa-solid fa-plane"></i> ${t.title}</span>
                <small style="font-size:0.75rem;">₹${t.expenses.reduce((s,e)=>s+e.amount,0)}</small>
            </a>
        `).join('');

        headerTripName.textContent = trip.title;

        // Run Equalizer Algorithm
        const eq = calculateEqualizer(trip);

        statTotalExpense.textContent = `₹${eq.totalExpense}`;
        statPerHead.textContent = `₹${Math.round(eq.perHeadTarget)}`;
        statMemberCount.textContent = trip.members.length;
        statOwedTransfers.textContent = `${eq.transfers.length} Transfers`;
        countExpenses.textContent = trip.expenses.length;

        // Render Member Balances Cards
        membersGrid.innerHTML = eq.memberStats.map(m => {
            let balanceBadge = '';
            if (m.netBalance > 0.01) {
                balanceBadge = `<div class="balance-pill balance-overpaid"><span>Overpaid (Gets back):</span> <strong>+₹${Math.round(m.netBalance)}</strong></div>`;
            } else if (m.netBalance < -0.01) {
                balanceBadge = `<div class="balance-pill balance-owes"><span>Underpaid (Owes):</span> <strong>-₹${Math.round(Math.abs(m.netBalance))}</strong></div>`;
            } else {
                balanceBadge = `<div class="balance-pill balance-settled"><span>Balance:</span> <strong>Fully Settled (₹0)</strong></div>`;
            }

            return `
                <div class="member-card">
                    <div class="member-card-header">
                        <span class="member-name">${m.name}</span>
                        <span class="member-phone">+${m.phone}</span>
                    </div>
                    <div style="font-size:0.85rem; color:var(--dark-muted);">Total Spent: <strong>₹${m.totalSpent}</strong></div>
                    ${balanceBadge}
                </div>
            `;
        }).join('');

        // Render Minimal Settlement Transfers Cards
        if (eq.transfers.length === 0) {
            settlementGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px 20px; background: rgba(15,23,42,0.8); border-radius: var(--radius-lg); border: 1px solid rgba(255,255,255,0.1);">
                    <i class="fa-solid fa-circle-check" style="font-size: 3rem; color: var(--neon-green); margin-bottom: 12px;"></i>
                    <h3>All Trip Expenses are 100% Settled & Equalized!</h3>
                </div>
            `;
        } else {
            settlementGrid.innerHTML = eq.transfers.map(tr => `
                <div class="transfer-card">
                    <div class="transfer-flow">
                        <span class="flow-debtor">${tr.debtorName}</span>
                        <i class="fa-solid fa-arrow-right-long flow-arrow"></i>
                        <span class="flow-creditor">${tr.creditorName}</span>
                    </div>

                    <div class="transfer-amount-badge">
                        ₹${tr.amount}
                    </div>

                    <button class="btn-send-wa" onclick="sendWaSettlement('${tr.debtorPhone}', '${tr.debtorName}', '${tr.creditorName}', '${tr.creditorUpi}', ${tr.amount})">
                        <i class="fa-brands fa-whatsapp"></i> Send WA Settlement Link
                    </button>
                </div>
            `).join('');
        }

        // Render Logged Expenses List
        if (trip.expenses.length === 0) {
            expensesList.innerHTML = `<div style="text-align:center; padding:30px; color:var(--dark-muted);">No expenses logged yet. Click "+ Log Expense" at top.</div>`;
        } else {
            expensesList.innerHTML = trip.expenses.map(exp => {
                const payer = trip.members.find(m => m.id === exp.payerId) || { name: 'Unknown' };
                return `
                    <div class="expense-row-card">
                        <div>
                            <div class="exp-title">${exp.title}</div>
                            <div class="exp-payer">Paid by <strong>${payer.name}</strong> on ${exp.date}</div>
                        </div>
                        <div class="exp-amount">₹${exp.amount}</div>
                    </div>
                `;
            }).join('');
        }
    }

    window.switchTrip = function(id) {
        activeTripId = id;
        saveState();
    };

    // ----------------------------------------------------------------------
    // 6. Direct WhatsApp Settlement Launcher
    // ----------------------------------------------------------------------
    window.sendWaSettlement = function(phone, debtorName, creditorName, creditorUpi, amount) {
        const trip = getActiveTrip();
        const eq = calculateEqualizer(trip);

        const msgText = 
            `Hey ${debtorName}! 👋 Here is our *${trip.title}* Expense Settlement Breakdown:\n\n` +
            `📊 *Total Trip Expense*: ₹${eq.totalExpense}\n` +
            `🎯 *Per-Head Equal Share*: ₹${Math.round(eq.perHeadTarget)}\n\n` +
            `💳 *Your Settlement Amount*: You need to pay *₹${amount}* to *${creditorName}*.\n\n` +
            `📱 *Pay via UPI to ${creditorName}*:\n` +
            `UPI ID: *${creditorUpi}*\n` +
            `Instant Link: upi://pay?pa=${encodeURIComponent(creditorUpi)}&am=${amount}&pn=${encodeURIComponent(creditorName)}&cu=INR\n\n` +
            `Please clear this balance when possible! Thanks 🙏`;

        let cleanPhone = phone.replace(/\D/g, '');
        if (!cleanPhone.startsWith('91')) cleanPhone = '91' + cleanPhone;

        const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msgText)}`;
        window.open(waUrl, '_blank');
    };

    openTripReportWaBtn.addEventListener('click', () => {
        const trip = getActiveTrip();
        const eq = calculateEqualizer(trip);

        let reportMsg = `🏖️ *TRIP SUMMARY REPORT: ${trip.title}*\n\n` +
            `📊 Total Expense: ₹${eq.totalExpense}\n` +
            `🎯 Per-Head Target: ₹${Math.round(eq.perHeadTarget)}\n\n` +
            `👥 *Member Balances*:\n`;

        eq.memberStats.forEach(m => {
            const bal = Math.round(m.netBalance);
            if (bal > 0) reportMsg += `• ${m.name}: Gets back +₹${bal}\n`;
            else if (bal < 0) reportMsg += `• ${m.name}: Owes -₹${Math.abs(bal)}\n`;
            else reportMsg += `• ${m.name}: Fully Settled (₹0)\n`;
        });

        reportMsg += `\n📌 *Pending Settlement Transfers*:\n`;
        eq.transfers.forEach(t => {
            reportMsg += `• ${t.debtorName} pays ₹${t.amount} to ${t.creditorName} (UPI: ${t.creditorUpi})\n`;
        });

        reportMsg += `\nGenerated via TripSplit Engine 🚀`;

        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(reportMsg)}`, '_blank');
    });

    // ----------------------------------------------------------------------
    // 7. Modals & Form Handlers
    // ----------------------------------------------------------------------
    // Create Trip Modal
    openCreateTripBtn.addEventListener('click', () => {
        renderMemberInputs();
        createTripModal.classList.add('active');
    });
    closeCreateTripModal.addEventListener('click', () => createTripModal.classList.remove('active'));
    cancelCreateTripModal.addEventListener('click', () => createTripModal.classList.remove('active'));

    function renderMemberInputs() {
        memberInputsContainer.innerHTML = `
            <div class="member-input-row">
                <input type="text" class="m-name" placeholder="Name (e.g. Rahul)" required value="Rahul Sharma">
                <input type="tel" class="m-phone" placeholder="Phone (10 digits)" required value="9811122334">
                <input type="text" class="m-upi" placeholder="UPI ID" required value="rahul@upi">
                <span></span>
            </div>
            <div class="member-input-row">
                <input type="text" class="m-name" placeholder="Name" required value="Amit Patel">
                <input type="tel" class="m-phone" placeholder="Phone" required value="9822233445">
                <input type="text" class="m-upi" placeholder="UPI ID" required value="9822233445@upi">
                <span></span>
            </div>
        `;
    }

    addMemberRowBtn.addEventListener('click', () => {
        const row = document.createElement('div');
        row.className = 'member-input-row';
        row.innerHTML = `
            <input type="text" class="m-name" placeholder="Name" required>
            <input type="tel" class="m-phone" placeholder="Phone" required>
            <input type="text" class="m-upi" placeholder="UPI ID" required>
            <button type="button" class="btn-remove-row" onclick="this.parentElement.remove()">×</button>
        `;
        memberInputsContainer.appendChild(row);
    });

    createTripForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('newTripName').value.trim();
        const rows = memberInputsContainer.querySelectorAll('.member-input-row');

        let members = [];
        rows.forEach((r, idx) => {
            const mName = r.querySelector('.m-name').value.trim();
            const mPhone = r.querySelector('.m-phone').value.trim().replace(/\D/g, '');
            const mUpi = r.querySelector('.m-upi').value.trim();
            if (mName) {
                members.push({
                    id: 'm-' + (idx + 1) + '-' + Date.now(),
                    name: mName,
                    phone: mPhone.startsWith('91') ? mPhone : '91' + mPhone,
                    upiId: mUpi || (mPhone + '@upi')
                });
            }
        });

        const newTrip = {
            id: 'TRIP-' + Math.floor(1000 + Math.random() * 9000),
            title: name,
            createdAt: new Date().toISOString().split('T')[0],
            members: members,
            expenses: []
        };

        trips.unshift(newTrip);
        activeTripId = newTrip.id;
        saveState();
        createTripModal.classList.remove('active');
        createTripForm.reset();
        alert(`🏖️ Trip "${name}" Created Successfully! Add expenses to calculate settlement.`);
    });

    // Add Expense Modal
    openAddExpenseBtn.addEventListener('click', () => {
        const trip = getActiveTrip();
        if (!trip) return;

        expensePayer.innerHTML = trip.members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');

        splitCheckboxContainer.innerHTML = trip.members.map(m => `
            <label><input type="checkbox" name="splitMember" value="${m.id}" checked> ${m.name}</label>
        `).join('');

        addExpenseModal.classList.add('active');
    });

    closeAddExpenseModal.addEventListener('click', () => addExpenseModal.classList.remove('active'));
    cancelAddExpenseModal.addEventListener('click', () => addExpenseModal.classList.remove('active'));

    addExpenseForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const trip = getActiveTrip();
        if (!trip) return;

        const title = document.getElementById('expenseTitle').value.trim();
        const amount = parseFloat(document.getElementById('expenseAmount').value);
        const payerId = expensePayer.value;

        const selectedChecks = splitCheckboxContainer.querySelectorAll('input[type="checkbox"]:checked');
        let splitAmong = Array.from(selectedChecks).map(c => c.value);

        if (splitAmong.length === 0) {
            splitAmong = trip.members.map(m => m.id);
        }

        const newExp = {
            id: 'exp-' + Date.now(),
            title: title,
            amount: amount,
            payerId: payerId,
            splitAmong: splitAmong,
            date: new Date().toISOString().split('T')[0]
        };

        trip.expenses.unshift(newExp);
        saveState();
        addExpenseModal.classList.remove('active');
        addExpenseForm.reset();
    });

    // Auth Modal
    openAuthModalBtn.addEventListener('click', () => authModal.classList.add('active'));
    closeAuthModal.addEventListener('click', () => authModal.classList.remove('active'));
    cancelAuthModal.addEventListener('click', () => authModal.classList.remove('active'));

    authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        currentUser = {
            name: document.getElementById('authName').value.trim(),
            phone: document.getElementById('authPhone').value.trim()
        };
        saveState();
        authModal.classList.remove('active');
        alert(`Profile updated as ${currentUser.name}!`);
    });

    // Initial Render
    renderApp();
});
