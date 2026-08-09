/* ==========================================================================
   TripSplit - Inline Errors & Seamless Navigation Engine
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = 'http://localhost:5000/api';

    // ----------------------------------------------------------------------
    // 1. Initial State & Registered Accounts Storage
    // ----------------------------------------------------------------------
    let currentUser = JSON.parse(localStorage.getItem('tripsplit_user')) || null;
    let registeredUsers = JSON.parse(localStorage.getItem('tripsplit_registered_users')) || [
        {
            name: 'Rahul Sharma',
            email: 'rahul@gmail.com',
            phone: '9811122334',
            password: '123'
        }
    ];

    let trips = JSON.parse(localStorage.getItem('tripsplit_all_trips')) || [];
    let currentTrip = JSON.parse(localStorage.getItem('tripsplit_current_trip')) || null;
    let currentStep = 1;

    // Seed Initial Demo Trip if empty
    if (trips.length === 0) {
        const demoTrip = {
            id: 'TRIP-DEMO-1',
            title: 'Manali Trip 2026',
            date: '2026-08-08',
            members: [
                { id: 'm1', name: 'Rahul Sharma', phone: '919811122334' },
                { id: 'm2', name: 'Amit Patel', phone: '919822233445' },
                { id: 'm3', name: 'Priya Singh', phone: '919833344556' },
                { id: 'm4', name: 'Vikram Kumar', phone: '919844455667' }
            ],
            expenses: [
                { id: 'e1', title: 'Hotel Stay (Resort)', amount: 2000, payerId: 'm1' },
                { id: 'e2', title: 'Petrol & Toll Taxes', amount: 800, payerId: 'm2' },
                { id: 'e3', title: 'Dinner at Mall Road', amount: 1200, payerId: 'm3' }
            ]
        };
        trips.push(demoTrip);
        if (!currentTrip) currentTrip = demoTrip;
        localStorage.setItem('tripsplit_all_trips', JSON.stringify(trips));
        localStorage.setItem('tripsplit_current_trip', JSON.stringify(currentTrip));
    }

    function saveUsers() {
        localStorage.setItem('tripsplit_registered_users', JSON.stringify(registeredUsers));
    }
    saveUsers();

    // ----------------------------------------------------------------------
    // 2. DOM Elements
    // ----------------------------------------------------------------------
    const userSidebar = document.getElementById('userSidebar');
    const userAvatar = document.getElementById('userAvatar');
    const sidebarUserName = document.getElementById('sidebarUserName');
    const sidebarUserEmail = document.getElementById('sidebarUserEmail');
    const pastTripsList = document.getElementById('pastTripsList');
    const sidebarNewTripBtn = document.getElementById('sidebarNewTripBtn');
    const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');

    // Navigation & Indicators
    const stepIndicators = [
        document.getElementById('stepIndicator1'),
        document.getElementById('stepIndicator2'),
        document.getElementById('stepIndicator3'),
        document.getElementById('stepIndicator4')
    ];

    const pages = [
        document.getElementById('pageStep1'),
        document.getElementById('pageStep2'),
        document.getElementById('pageStep3'),
        document.getElementById('pageStep4')
    ];

    const userWidget = document.getElementById('userWidget');
    const navUserName = document.getElementById('navUserName');
    const logoutBtn = document.getElementById('logoutBtn');
    const navLogoBtn = document.getElementById('navLogoBtn');

    // Step 1: Auth Tabs & Inline Errors
    const tabLoginBtn = document.getElementById('tabLoginBtn');
    const tabSignupBtn = document.getElementById('tabSignupBtn');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    const loginInlineError = document.getElementById('loginInlineError');
    const loginErrorText = document.getElementById('loginErrorText');
    const signupInlineError = document.getElementById('signupInlineError');
    const signupErrorText = document.getElementById('signupErrorText');

    // Step 2: Create Trip
    const createTripForm = document.getElementById('createTripForm');
    const tripTitleInput = document.getElementById('tripTitle');
    const membersListContainer = document.getElementById('membersListContainer');
    const addFriendRowBtn = document.getElementById('addFriendRowBtn');
    const loadSampleTripBtn = document.getElementById('loadSampleTripBtn');

    // Step 3: Expenses
    const activeTripTitleDisplay = document.getElementById('activeTripTitleDisplay');
    const expensesTableWrapper = document.getElementById('expensesTableWrapper');
    const openAddExpenseModalBtn = document.getElementById('openAddExpenseModalBtn');
    const gotoCalculateBtn = document.getElementById('gotoCalculateBtn');
    const backToCreateTripBtn = document.getElementById('backToCreateTripBtn');

    // Step 4: Calculate & Settlement
    const calcTotalExpense = document.getElementById('calcTotalExpense');
    const calcTotalFriends = document.getElementById('calcTotalFriends');
    const calcPerHeadShare = document.getElementById('calcPerHeadShare');
    const spentBreakdownGrid = document.getElementById('spentBreakdownGrid');
    const transfersListGrid = document.getElementById('transfersListGrid');
    const backToExpensesBtn = document.getElementById('backToExpensesBtn');
    const backToCreateTripFromStep4Btn = document.getElementById('backToCreateTripFromStep4Btn');

    // Modal: Add Expense
    const expenseModal = document.getElementById('expenseModal');
    const closeExpenseModal = document.getElementById('closeExpenseModal');
    const cancelExpenseModal = document.getElementById('cancelExpenseModal');
    const expenseForm = document.getElementById('expenseForm');
    const expPayer = document.getElementById('expPayer');

    // ----------------------------------------------------------------------
    // 3. Navigation & Stepper Controller
    // ----------------------------------------------------------------------
    function navigateToStep(stepNum) {
        currentStep = stepNum;

        // Hide inline errors on navigation
        if (loginInlineError) loginInlineError.style.display = 'none';
        if (signupInlineError) signupInlineError.style.display = 'none';

        pages.forEach((p, idx) => {
            if (idx + 1 === stepNum) p.classList.add('active');
            else p.classList.remove('active');
        });

        stepIndicators.forEach((ind, idx) => {
            if (idx + 1 === stepNum) ind.classList.add('active');
            else ind.classList.remove('active');
        });

        if (currentUser) {
            userSidebar.style.display = 'flex';
            userWidget.style.display = 'flex';
            navUserName.textContent = currentUser.name.split(' ')[0];
            sidebarUserName.textContent = currentUser.name;
            sidebarUserEmail.textContent = currentUser.email || currentUser.phone;
            userAvatar.textContent = currentUser.name.charAt(0).toUpperCase();

            renderPastTripsSidebar();
        } else {
            userSidebar.style.display = 'none';
            userWidget.style.display = 'none';
        }

        if (stepNum === 2) renderStep2();
        if (stepNum === 3) renderStep3();
        if (stepNum === 4) renderStep4();
    }

    navLogoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentUser) navigateToStep(currentTrip ? 3 : 2);
        else navigateToStep(1);
    });

    // BACK NAVIGATION EVENT LISTENERS
    if (backToCreateTripBtn) {
        backToCreateTripBtn.addEventListener('click', () => navigateToStep(2));
    }
    if (backToCreateTripFromStep4Btn) {
        backToCreateTripFromStep4Btn.addEventListener('click', () => navigateToStep(2));
    }
    if (backToExpensesBtn) {
        backToExpensesBtn.addEventListener('click', () => navigateToStep(3));
    }

    function performLogout() {
        currentUser = null;
        currentTrip = null;
        localStorage.removeItem('tripsplit_user');
        localStorage.removeItem('tripsplit_current_trip');
        navigateToStep(1);
    }

    logoutBtn.addEventListener('click', performLogout);
    sidebarLogoutBtn.addEventListener('click', performLogout);
    sidebarNewTripBtn.addEventListener('click', () => navigateToStep(2));

    // ----------------------------------------------------------------------
    // 4. Render Left Sidebar Saved Past Trips
    // ----------------------------------------------------------------------
    function renderPastTripsSidebar() {
        if (trips.length === 0) {
            pastTripsList.innerHTML = `<div style="font-size:0.78rem; color:var(--text-muted); padding:6px;">No saved trips yet.</div>`;
            return;
        }

        pastTripsList.innerHTML = trips.map(t => {
            const isActive = currentTrip && currentTrip.id === t.id;
            const totalExp = t.expenses.reduce((sum, e) => sum + e.amount, 0);

            return `
                <div class="past-trip-card ${isActive ? 'active' : ''}" onclick="selectPastTrip('${t.id}')">
                    <div>${t.title}</div>
                    <div class="past-trip-sub">
                        <span>${t.members.length} Members</span>
                        <span>₹${totalExp}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    window.selectPastTrip = function(id) {
        const found = trips.find(t => t.id === id);
        if (found) {
            currentTrip = found;
            localStorage.setItem('tripsplit_current_trip', JSON.stringify(currentTrip));
            navigateToStep(3);
        }
    };

    // ----------------------------------------------------------------------
    // 5. INLINE PROFESSIONAL AUTHENTICATION (NO POPUP ALERTS)
    // ----------------------------------------------------------------------
    tabLoginBtn.addEventListener('click', () => {
        tabLoginBtn.classList.add('active');
        tabSignupBtn.classList.remove('active');
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
        loginInlineError.style.display = 'none';
    });

    tabSignupBtn.addEventListener('click', () => {
        tabSignupBtn.classList.add('active');
        tabLoginBtn.classList.remove('active');
        signupForm.style.display = 'block';
        loginForm.style.display = 'none';
        signupInlineError.style.display = 'none';
    });

    // INLINE SIGNUP HANDLER
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        signupInlineError.style.display = 'none';

        const name = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim().toLowerCase();
        let phone = document.getElementById('signupPhone').value.trim().replace(/\D/g, '');
        const password = document.getElementById('signupPassword').value;

        if (!phone.startsWith('91')) phone = '91' + phone;

        // Check if email already registered
        const existing = registeredUsers.find(u => u.email.toLowerCase() === email);
        if (existing) {
            signupErrorText.textContent = 'Account with this email already exists! Please click Login.';
            signupInlineError.className = 'inline-error-box';
            signupInlineError.style.display = 'flex';
            return;
        }

        const newUser = { name, email, phone, password };
        registeredUsers.push(newUser);
        saveUsers();

        // Show Inline Success Box
        signupErrorText.textContent = `Account created successfully! Switching to Login tab...`;
        signupInlineError.className = 'inline-error-box success';
        signupInlineError.style.display = 'flex';

        setTimeout(() => {
            signupForm.reset();
            tabLoginBtn.click();
            document.getElementById('loginEmail').value = email;
            document.getElementById('loginPassword').value = password;
        }, 1200);
    });

    // INLINE LOGIN HANDLER (NO POPUP ALERTS)
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginInlineError.style.display = 'none';

        const email = document.getElementById('loginEmail').value.trim().toLowerCase();
        const password = document.getElementById('loginPassword').value;

        let userFound = registeredUsers.find(u => u.email.toLowerCase() === email && u.password === password);

        if (!userFound) {
            loginErrorText.textContent = 'Invalid Email or Password. Please check your credentials or Signup first.';
            loginInlineError.style.display = 'flex';
            return;
        }

        currentUser = {
            name: userFound.name,
            email: userFound.email,
            phone: userFound.phone
        };

        localStorage.setItem('tripsplit_user', JSON.stringify(currentUser));
        navigateToStep(currentTrip ? 3 : 2);
    });

    // ----------------------------------------------------------------------
    // 6. STEP 2: Create Trip & Add Friends Handler
    // ----------------------------------------------------------------------
    function renderStep2() {
        if (!membersListContainer.children.length) {
            membersListContainer.innerHTML = `
                <div class="member-input-row">
                    <input type="text" class="m-name" placeholder="Friend Name (e.g. Rahul)" required value="${currentUser ? currentUser.name : ''}">
                    <input type="tel" class="m-phone" placeholder="Mobile Number (e.g. 9811122334)" required value="${currentUser ? currentUser.phone : ''}">
                    <span></span>
                </div>
                <div class="member-input-row">
                    <input type="text" class="m-name" placeholder="Friend Name (e.g. Amit)" required value="Amit Patel">
                    <input type="tel" class="m-phone" placeholder="Mobile Number" required value="9822233445">
                    <span></span>
                </div>
            `;
        }
    }

    addFriendRowBtn.addEventListener('click', () => {
        const row = document.createElement('div');
        row.className = 'member-input-row';
        row.innerHTML = `
            <input type="text" class="m-name" placeholder="Friend Name" required>
            <input type="tel" class="m-phone" placeholder="Mobile Number" required>
            <button type="button" class="btn-remove-row" onclick="this.parentElement.remove()">×</button>
        `;
        membersListContainer.appendChild(row);
    });

    loadSampleTripBtn.addEventListener('click', () => {
        const demoTrip = {
            id: 'TRIP-DEMO-1',
            title: 'Manali Trip 2026',
            members: [
                { id: 'm1', name: 'Rahul Sharma', phone: '919811122334' },
                { id: 'm2', name: 'Amit Patel', phone: '919822233445' },
                { id: 'm3', name: 'Priya Singh', phone: '919833344556' },
                { id: 'm4', name: 'Vikram Kumar', phone: '919844455667' }
            ],
            expenses: [
                { id: 'e1', title: 'Hotel Stay (Resort)', amount: 2000, payerId: 'm1' },
                { id: 'e2', title: 'Petrol & Toll Taxes', amount: 800, payerId: 'm2' },
                { id: 'e3', title: 'Dinner at Mall Road', amount: 1200, payerId: 'm3' }
            ]
        };

        const existingIdx = trips.findIndex(t => t.id === demoTrip.id);
        if (existingIdx >= 0) trips[existingIdx] = demoTrip;
        else trips.unshift(demoTrip);

        currentTrip = demoTrip;
        localStorage.setItem('tripsplit_all_trips', JSON.stringify(trips));
        localStorage.setItem('tripsplit_current_trip', JSON.stringify(currentTrip));
        navigateToStep(3);
    });

    createTripForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = tripTitleInput.value.trim();
        const rows = membersListContainer.querySelectorAll('.member-input-row');

        let members = [];
        rows.forEach((r, idx) => {
            const mName = r.querySelector('.m-name').value.trim();
            let mPhone = r.querySelector('.m-phone').value.trim().replace(/\D/g, '');
            if (!mPhone.startsWith('91')) mPhone = '91' + mPhone;

            if (mName) {
                members.push({
                    id: 'm-' + (idx + 1),
                    name: mName,
                    phone: mPhone
                });
            }
        });

        currentTrip = {
            id: 'TRIP-' + Date.now(),
            title: title,
            members: members,
            expenses: []
        };

        trips.unshift(currentTrip);
        localStorage.setItem('tripsplit_all_trips', JSON.stringify(trips));
        localStorage.setItem('tripsplit_current_trip', JSON.stringify(currentTrip));
        navigateToStep(3);
    });

    // ----------------------------------------------------------------------
    // 7. STEP 3: Live Expenses Logger Handler
    // ----------------------------------------------------------------------
    function renderStep3() {
        if (!currentTrip) return;

        activeTripTitleDisplay.textContent = currentTrip.title;

        if (currentTrip.expenses.length === 0) {
            expensesTableWrapper.innerHTML = `
                <div style="text-align:center; padding:50px 20px; color:var(--text-muted);">
                    <i class="fa-solid fa-receipt" style="font-size:3rem; color:var(--gray-300); margin-bottom:12px;"></i>
                    <h4>Abhi koi kharcha add nahi hua hai.</h4>
                    <p style="font-size:0.88rem; margin-top:4px;">Raste me jab koi kharcha kare, "+ Add Expense" click karke entry karein.</p>
                </div>
            `;
            return;
        }

        expensesTableWrapper.innerHTML = `
            <table class="custom-table">
                <thead>
                    <tr>
                        <th>Kharcha (Expense Title)</th>
                        <th>Kisne Pese Diye (Payer)</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${currentTrip.expenses.map(e => {
                        const payer = currentTrip.members.find(m => m.id === e.payerId) || { name: 'Unknown' };
                        return `
                            <tr>
                                <td><strong>${e.title}</strong></td>
                                <td><i class="fa-solid fa-user" style="color:var(--primary);"></i> ${payer.name}</td>
                                <td><strong style="color:var(--primary);">₹${e.amount}</strong></td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    }

    openAddExpenseModalBtn.addEventListener('click', () => {
        if (!currentTrip) return;
        expPayer.innerHTML = currentTrip.members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
        expenseModal.classList.add('active');
    });

    closeExpenseModal.addEventListener('click', () => expenseModal.classList.remove('active'));
    cancelExpenseModal.addEventListener('click', () => expenseModal.classList.remove('active'));

    expenseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('expTitle').value.trim();
        const amount = parseFloat(document.getElementById('expAmount').value);
        const payerId = expPayer.value;

        const newExp = {
            id: 'e-' + Date.now(),
            title: title,
            amount: amount,
            payerId: payerId
        };

        currentTrip.expenses.unshift(newExp);

        const idx = trips.findIndex(t => t.id === currentTrip.id);
        if (idx >= 0) trips[idx] = currentTrip;

        localStorage.setItem('tripsplit_all_trips', JSON.stringify(trips));
        localStorage.setItem('tripsplit_current_trip', JSON.stringify(currentTrip));
        expenseModal.classList.remove('active');
        expenseForm.reset();
        renderStep3();
    });

    gotoCalculateBtn.addEventListener('click', () => {
        navigateToStep(4);
    });

    // ----------------------------------------------------------------------
    // 8. STEP 4: Calculate & Final Settlement Algorithm
    // ----------------------------------------------------------------------
    function renderStep4() {
        if (!currentTrip) return;

        const totalExpense = currentTrip.expenses.reduce((sum, e) => sum + e.amount, 0);
        const memberCount = currentTrip.members.length;
        const perHead = memberCount > 0 ? totalExpense / memberCount : 0;

        calcTotalExpense.textContent = `₹${totalExpense}`;
        calcTotalFriends.textContent = `${memberCount} Members`;
        calcPerHeadShare.textContent = `₹${Math.round(perHead)} / person`;

        const memberStats = currentTrip.members.map(m => {
            const spent = currentTrip.expenses
                .filter(e => e.payerId === m.id)
                .reduce((sum, e) => sum + e.amount, 0);
            return {
                ...m,
                spent: spent,
                netBalance: spent - perHead
            };
        });

        spentBreakdownGrid.innerHTML = memberStats.map(m => `
            <div class="spent-card">
                <div class="spent-name">${m.name}</div>
                <div class="spent-amount">₹${m.spent}</div>
                <div style="font-size:0.78rem; color:var(--text-muted); margin-top:4px;">
                    ${m.netBalance > 0.01 ? `<span style="color:var(--success); font-weight:700;">Gets back: +₹${Math.round(m.netBalance)}</span>` :
                      m.netBalance < -0.01 ? `<span style="color:var(--danger); font-weight:700;">Owes: -₹${Math.round(Math.abs(m.netBalance))}</span>` :
                      'Settled (₹0)'}
                </div>
            </div>
        `).join('');

        let creditors = memberStats.filter(m => m.netBalance > 0.01).map(m => ({ ...m }));
        let debtors = memberStats.filter(m => m.netBalance < -0.01).map(m => ({ ...m, owes: Math.abs(m.netBalance) }));

        let transfers = [];

        debtors.forEach(d => {
            let amountOwed = d.owes;
            creditors.forEach(c => {
                if (amountOwed <= 0 || c.netBalance <= 0) return;
                let amt = Math.min(amountOwed, c.netBalance);
                amt = Math.round(amt);

                if (amt > 0) {
                    transfers.push({
                        debtorName: d.name,
                        debtorPhone: d.phone,
                        creditorName: c.name,
                        creditorPhone: c.phone,
                        amount: amt
                    });
                    amountOwed -= amt;
                    c.netBalance -= amt;
                }
            });
        });

        if (transfers.length === 0) {
            transfersListGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; background: #F0FDF4; border-radius: var(--radius-lg); border: 1px solid rgba(37,211,102,0.3);">
                    <i class="fa-solid fa-circle-check" style="font-size: 3rem; color: var(--whatsapp-green); margin-bottom: 12px;"></i>
                    <h3>All Trip Expenses are 100% Equalized & Settled!</h3>
                </div>
            `;
            return;
        }

        transfersListGrid.innerHTML = transfers.map(tr => `
            <div class="transfer-direct-card">
                <div class="transfer-info-text">
                    <span class="text-debtor">${tr.debtorName}</span> ko <span class="text-creditor">${tr.creditorName}</span> ko paise dene hain.
                </div>

                <div class="transfer-amount-tag">
                    ₹${tr.amount}
                </div>

                <button class="btn btn-wa btn-block" onclick="sendDirectWaMessage('${tr.debtorPhone}', '${tr.debtorName}', '${tr.creditorName}', '${tr.creditorPhone}', ${tr.amount})">
                    <i class="fa-brands fa-whatsapp"></i> Direct WhatsApp Message Bhejo
                </button>
            </div>
        `).join('');
    }

    // ----------------------------------------------------------------------
    // 9. DIRECT WHATSAPP MESSAGE FORMAT
    // ----------------------------------------------------------------------
    window.sendDirectWaMessage = function(debtorPhone, debtorName, creditorName, creditorPhone, amount) {
        let displayPhone = creditorPhone.replace(/^91/, '');

        const messageText = `Tujhe ${creditorName} ko ₹${amount} dene hain, uska phone number ye hai: ${displayPhone}. Is number par GPay/PhonePe/Paytm se paise daal de.`;

        let cleanPhone = debtorPhone.replace(/\D/g, '');
        if (!cleanPhone.startsWith('91')) cleanPhone = '91' + cleanPhone;

        const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(messageText)}`;
        window.open(waUrl, '_blank');
    };

    // Auto-initialize
    if (currentUser) {
        navigateToStep(currentTrip ? 3 : 2);
    } else {
        navigateToStep(1);
    }
});
