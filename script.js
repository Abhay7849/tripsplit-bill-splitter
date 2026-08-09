/* ==========================================================================
   TripSplit - Strict User-Isolated MongoDB Data Engine
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
    const API_BASE = 'http://localhost:5000/api';

    // ----------------------------------------------------------------------
    // 1. Initial State & User Isolation Storage
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

    let userTrips = [];
    let currentTrip = null;
    let currentStep = 1;

    // Save Users to LocalStorage
    function saveUsers() {
        localStorage.setItem('tripsplit_registered_users', JSON.stringify(registeredUsers));
    }
    saveUsers();

    // Fetch ONLY the logged-in user's trips from MongoDB
    async function loadTripsForCurrentUser() {
        if (!currentUser) {
            userTrips = [];
            currentTrip = null;
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/trips?userEmail=${encodeURIComponent(currentUser.email)}`);
            if (res.ok) {
                userTrips = await res.json();
            }
        } catch (err) {
            console.log('MongoDB Local Sync');
        }

        if (!userTrips || userTrips.length === 0) {
            // Read from user-isolated local key
            const userKey = `tripsplit_trips_${currentUser.email.toLowerCase()}`;
            userTrips = JSON.parse(localStorage.getItem(userKey)) || [];
        }

        if (userTrips.length > 0) {
            currentTrip = userTrips[0];
        } else {
            currentTrip = null;
        }

        saveUserTripsState();
    }

    function saveUserTripsState() {
        if (!currentUser) return;
        const userKey = `tripsplit_trips_${currentUser.email.toLowerCase()}`;
        localStorage.setItem(userKey, JSON.stringify(userTrips));
        if (currentTrip) {
            localStorage.setItem(`tripsplit_current_trip_${currentUser.email.toLowerCase()}`, JSON.stringify(currentTrip));
        } else {
            localStorage.removeItem(`tripsplit_current_trip_${currentUser.email.toLowerCase()}`);
        }
    }

    if (currentUser) {
        await loadTripsForCurrentUser();
    }

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
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');

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

    if (backToCreateTripBtn) backToCreateTripBtn.addEventListener('click', () => navigateToStep(2));
    if (backToCreateTripFromStep4Btn) backToCreateTripFromStep4Btn.addEventListener('click', () => navigateToStep(2));
    if (backToExpensesBtn) backToExpensesBtn.addEventListener('click', () => navigateToStep(3));

    // PDF Report Generator Event Listener
    if (downloadPdfBtn) {
        downloadPdfBtn.addEventListener('click', () => {
            if (!currentTrip) return;

            const totalExpense = currentTrip.expenses.reduce((sum, e) => sum + e.amount, 0);
            const memberCount = currentTrip.members.length;
            const perHead = memberCount > 0 ? totalExpense / memberCount : 0;

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
                            creditorName: c.name,
                            creditorPhone: c.phone.replace(/^91/, ''),
                            amount: amt
                        });
                        amountOwed -= amt;
                        c.netBalance -= amt;
                    }
                });
            });

            // Create temporary styled HTML container for PDF
            const pdfContainer = document.createElement('div');
            pdfContainer.style.padding = '30px';
            pdfContainer.style.fontFamily = "'Plus Jakarta Sans', Arial, sans-serif";
            pdfContainer.style.color = '#0F172A';
            pdfContainer.style.backgroundColor = '#FFFFFF';

            pdfContainer.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #4F46E5; padding-bottom:15px; margin-bottom:20px;">
                    <div>
                        <h1 style="font-size:24px; color:#4F46E5; margin:0;">TripSplit Settlement Report</h1>
                        <p style="font-size:12px; color:#64748B; margin:4px 0 0 0;">Generated for <strong>${currentUser ? currentUser.name : 'User'}</strong> (${currentUser ? currentUser.email : ''}) on ${new Date().toLocaleDateString()}</p>
                    </div>
                    <div style="text-align:right;">
                        <span style="background:#EEF2FF; color:#4F46E5; padding:6px 12px; border-radius:20px; font-weight:700; font-size:12px;">OFFICIAL REPORT</span>
                    </div>
                </div>

                <div style="background:#F8FAFC; border:1px solid #E2E8F0; padding:15px; border-radius:10px; margin-bottom:20px; display:flex; justify-content:space-between;">
                    <div>
                        <span style="font-size:11px; color:#64748B; text-transform:uppercase;">Trip Name</span><br>
                        <strong style="font-size:18px; color:#0F172A;">${currentTrip.title}</strong>
                    </div>
                    <div>
                        <span style="font-size:11px; color:#64748B; text-transform:uppercase;">Total Expense</span><br>
                        <strong style="font-size:18px; color:#4F46E5;">₹${totalExpense}</strong>
                    </div>
                    <div>
                        <span style="font-size:11px; color:#64748B; text-transform:uppercase;">Members</span><br>
                        <strong style="font-size:18px; color:#0F172A;">${memberCount} Friends</strong>
                    </div>
                    <div>
                        <span style="font-size:11px; color:#64748B; text-transform:uppercase;">Equal Per-Head Share</span><br>
                        <strong style="font-size:18px; color:#10B981;">₹${Math.round(perHead)}</strong>
                    </div>
                </div>

                <h3 style="font-size:15px; color:#0F172A; margin-bottom:10px; border-left:4px solid #4F46E5; padding-left:8px;">1. Kharche Ka Breakdown (Itemized Expenses)</h3>
                <table style="width:100%; border-collapse:collapse; margin-bottom:25px; font-size:12px;">
                    <thead>
                        <tr style="background:#F1F5F9; text-align:left;">
                            <th style="padding:8px 12px; border:1px solid #CBD5E1;">Title</th>
                            <th style="padding:8px 12px; border:1px solid #CBD5E1;">Kisne Pese Diye (Payer)</th>
                            <th style="padding:8px 12px; border:1px solid #CBD5E1; text-align:right;">Amount (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${currentTrip.expenses.map(e => {
                            const payer = currentTrip.members.find(m => m.id === e.payerId) || { name: 'Unknown' };
                            return `
                                <tr>
                                    <td style="padding:8px 12px; border:1px solid #CBD5E1;"><strong>${e.title}</strong></td>
                                    <td style="padding:8px 12px; border:1px solid #CBD5E1;">${payer.name}</td>
                                    <td style="padding:8px 12px; border:1px solid #CBD5E1; text-align:right;"><strong>₹${e.amount}</strong></td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>

                <h3 style="font-size:15px; color:#0F172A; margin-bottom:10px; border-left:4px solid #10B981; padding-left:8px;">2. Final Settlement Matrix (Kon Kisko Kitna Pesa Dega)</h3>
                ${transfers.length === 0 ? '<p style="color:#10B981; font-weight:700;">All expenses are 100% equalized!</p>' : `
                    <table style="width:100%; border-collapse:collapse; margin-bottom:25px; font-size:12px;">
                        <thead>
                            <tr style="background:#F1F5F9; text-align:left;">
                                <th style="padding:8px 12px; border:1px solid #CBD5E1;">Debtor (Kisiko Pese Dene Hain)</th>
                                <th style="padding:8px 12px; border:1px solid #CBD5E1;">Creditor (Jisko Pese Milege)</th>
                                <th style="padding:8px 12px; border:1px solid #CBD5E1;">Creditor Phone (Pay to Number)</th>
                                <th style="padding:8px 12px; border:1px solid #CBD5E1; text-align:right;">Amount to Pay (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${transfers.map(tr => `
                                <tr>
                                    <td style="padding:8px 12px; border:1px solid #CBD5E1; color:#EF4444; font-weight:700;">${tr.debtorName}</td>
                                    <td style="padding:8px 12px; border:1px solid #CBD5E1; color:#10B981; font-weight:700;">${tr.creditorName}</td>
                                    <td style="padding:8px 12px; border:1px solid #CBD5E1;">${tr.creditorPhone}</td>
                                    <td style="padding:8px 12px; border:1px solid #CBD5E1; text-align:right; font-weight:800; font-size:13px; color:#4F46E5;">₹${tr.amount}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `}

                <div style="margin-top:30px; border-top:1px solid #E2E8F0; padding-top:10px; text-align:center; font-size:10px; color:#94A3B8;">
                    Verified & Generated by TripSplit Smart Engine • MongoDB Database Sync Active
                </div>
            `;

            const opt = {
                margin:       [10, 10, 10, 10],
                filename:     `${currentTrip.title.replace(/\s+/g, '_')}_Settlement_Report.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2 },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            html2pdf().set(opt).from(pdfContainer).save();
        });
    }

    function performLogout() {
        currentUser = null;
        currentTrip = null;
        userTrips = [];
        localStorage.removeItem('tripsplit_user');
        navigateToStep(1);
    }

    logoutBtn.addEventListener('click', performLogout);
    sidebarLogoutBtn.addEventListener('click', performLogout);
    sidebarNewTripBtn.addEventListener('click', () => navigateToStep(2));

    // ----------------------------------------------------------------------
    // 4. Render Left Sidebar Saved Past Trips (Isolated Per User)
    // ----------------------------------------------------------------------
    function renderPastTripsSidebar() {
        if (!userTrips || userTrips.length === 0) {
            pastTripsList.innerHTML = `<div style="font-size:0.78rem; color:var(--text-muted); padding:6px;">No saved trips for ${currentUser.email}. Click "+" to create one!</div>`;
            return;
        }

        pastTripsList.innerHTML = userTrips.map(t => {
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
        const found = userTrips.find(t => t.id === id);
        if (found) {
            currentTrip = found;
            saveUserTripsState();
            navigateToStep(3);
        }
    };

    // ----------------------------------------------------------------------
    // 5. STRICT USER-ISOLATED AUTHENTICATION
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

    // MONGODB SIGNUP HANDLER
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        signupInlineError.style.display = 'none';

        const name = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim().toLowerCase();
        let phone = document.getElementById('signupPhone').value.trim().replace(/\D/g, '');
        const password = document.getElementById('signupPassword').value;

        if (!phone.startsWith('91')) phone = '91' + phone;

        try {
            const res = await fetch(`${API_BASE}/users/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, phone, password })
            });

            const data = await res.json();
            if (!res.ok) {
                signupErrorText.textContent = data.error || 'Account creation error';
                signupInlineError.className = 'inline-error-box';
                signupInlineError.style.display = 'flex';
                return;
            }

            signupErrorText.textContent = `🍃 Account created in MongoDB! Switching to Login...`;
            signupInlineError.className = 'inline-error-box success';
            signupInlineError.style.display = 'flex';

            setTimeout(() => {
                signupForm.reset();
                tabLoginBtn.click();
                document.getElementById('loginEmail').value = email;
                document.getElementById('loginPassword').value = password;
            }, 1200);

        } catch (err) {
            signupErrorText.textContent = 'Backend Connection Error. Please check server.';
            signupInlineError.style.display = 'flex';
        }
    });

    // MONGODB LOGIN HANDLER WITH USER ISOLATION
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginInlineError.style.display = 'none';

        const email = document.getElementById('loginEmail').value.trim().toLowerCase();
        const password = document.getElementById('loginPassword').value;

        let userFound = null;

        try {
            const res = await fetch(`${API_BASE}/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (res.ok) {
                userFound = await res.json();
            }
        } catch (err) {
            console.log('Using Local Account');
        }

        if (!userFound) {
            userFound = registeredUsers.find(u => u.email.toLowerCase() === email && u.password === password);
        }

        if (!userFound) {
            loginErrorText.textContent = '❌ Invalid Email or Password. Please Signup first if you do not have an account.';
            loginInlineError.style.display = 'flex';
            return;
        }

        currentUser = {
            name: userFound.name,
            email: userFound.email,
            phone: userFound.phone
        };

        localStorage.setItem('tripsplit_user', JSON.stringify(currentUser));
        
        // Load trips ONLY belonging to this logged in user
        await loadTripsForCurrentUser();
        navigateToStep(currentTrip ? 3 : 2);
    });

    // ----------------------------------------------------------------------
    // 6. STEP 2: Create Trip & Add Friends (Isolated by User Email)
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

    loadSampleTripBtn.addEventListener('click', async () => {
        if (!currentUser) return;

        const demoTrip = {
            id: 'TRIP-DEMO-' + Date.now(),
            title: 'Manali Trip 2026',
            createdByEmail: currentUser.email.toLowerCase(),
            members: [
                { id: 'm1', name: currentUser.name, phone: currentUser.phone },
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

        try {
            await fetch(`${API_BASE}/trips`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(demoTrip)
            });
        } catch (e) {}

        userTrips.unshift(demoTrip);
        currentTrip = demoTrip;
        saveUserTripsState();
        navigateToStep(3);
    });

    createTripForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser) return;

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
            createdByEmail: currentUser.email.toLowerCase(),
            members: members,
            expenses: []
        };

        // Save Trip directly to MongoDB Database API
        try {
            await fetch(`${API_BASE}/trips`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentTrip)
            });
        } catch (err) {
            console.log('MongoDB API Syncing');
        }

        userTrips.unshift(currentTrip);
        saveUserTripsState();
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
        if (!currentTrip) return;

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

        try {
            await fetch(`${API_BASE}/trips/${currentTrip.id}/expenses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newExp)
            });
        } catch (err) {
            console.log('MongoDB Expense API Syncing');
        }

        const idx = userTrips.findIndex(t => t.id === currentTrip.id);
        if (idx >= 0) userTrips[idx] = currentTrip;

        saveUserTripsState();
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
