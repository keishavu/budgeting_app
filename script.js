let entries = JSON.parse(localStorage.getItem('budgetEntries')) || [];

// Set today's date as default
const dateInput = document.getElementById('date');
if (dateInput) {
    dateInput.valueAsDate = new Date();
}
// Add new entry
function addEntry(ownerName) {
    // 1. Get values safely
    const descInput = document.getElementById('description');
    const amountInput = document.getElementById('amount');
    const typeInput = document.getElementById('type');
    const dateInput = document.getElementById('date');
    const catInput = document.getElementById('category'); 

    // 2. Check if the main inputs exist
    if (!descInput || !amountInput || !typeInput || !dateInput) {
        console.error("Error: Could not find one of the form inputs (description, amount, type, or date).");
        return;
    }

    const description = descInput.value;
    const amount = parseFloat(amountInput.value);
    const type = typeInput.value;
    const date = dateInput.value;
    const category = catInput ? catInput.value : 'General';

    if (!description || !amount || !date) {
        alert('Please fill in all fields');
        return;
    }

    // 4. Create Object
    const newEntry = {
        id: Date.now(),
        description,
        amount,
        type,
        date,
        owner: ownerName, 
        category: category
    };

    // 5. Add to list
    entries.unshift(newEntry);
    
    // 6. Clear form
    descInput.value = '';
    amountInput.value = '';
    typeInput.value = 'expense';
    dateInput.valueAsDate = new Date();
    
    // Reset categories if the function exists
    if (typeof updateCategories === 'function') {
        updateCategories();
    }

    // 7. Update Screen
    console.log("Entry added successfully:", newEntry); // Check your console for this!
    renderEntries();
    renderIncomeChart();
    renderExpenseChart(); 
    updateSummary();
}

// Delete entry
function deleteEntry(id) {
    entries = entries.filter(e => e.id !== id);
    localStorage.setItem('budgetEntries', JSON.stringify(entries));
    renderExpenseChart();
    renderIncomeChart();
    renderEntries();
    updateSummary();
}
// Helper: Get entries based on which page is open
function getCurrentPageEntries() {
    // Check the URL to see which page we are on
    if (window.location.href.includes('partner1.html')) {
        return entries.filter(e => e.owner === 'partner1');
    } 
    else if (window.location.href.includes('partner2.html')) {
        return entries.filter(e => e.owner === 'partner2');
    }
    // Default: If on index.html (combined), return everything
    return entries;
}

// Define your category lists
const categoryLists = {
    expense: ['Rent', 'Groceries', 'Dining Out', 'Gas', 'Utilities', 'Entertainment', 'Other'],
    income: ['Salary', 'Freelance', 'Investments', 'Gift', 'Other']
};

// Function to update dropdown options
function updateCategories() {
    const typeSelect = document.getElementById('type');
    const categorySelect = document.getElementById('category');
    
    // Safety check: ensure elements exist before running (prevents errors on pages without forms)
    if (!typeSelect || !categorySelect) return;

    const selectedType = typeSelect.value;
    
    // Clear current options
    categorySelect.innerHTML = '';
    
    // Populate new options
    categoryLists[selectedType].forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
    });
}

// Render income chart

function renderIncomeChart() {
    const chart = document.getElementById('incomeChart');
    if (!chart) return;

    const currentEntries = getCurrentPageEntries();
    const incomeEntries = currentEntries.filter(e => e.type === 'income');
    const dailyData = groupByDay(incomeEntries);
    renderDailyBars(chart, dailyData, 'income');
}

// Render expense chart (Updated to filter by Page)
function renderExpenseChart() {
    const chart = document.getElementById('expenseChart');
    if (!chart) return;
    const currentEntries = getCurrentPageEntries();
    const expenseEntries = currentEntries.filter(e => e.type === 'expense');
    
    // Group by day (Last 14 days)
    const dailyData = groupByDay(expenseEntries);
    renderDailyBars(chart, dailyData, 'expense');
}

// Get week number from date
function getWeekNumber(date) {
    const d = new Date(date);
    const onejan = new Date(d.getFullYear(), 0, 1);
    const millisecsInDay = 86400000;
    return Math.ceil((((d - onejan) / millisecsInDay) + onejan.getDay() + 1) / 7);
}

// Group entries by day (Last 14 Days Rolling Window)
function groupByDay(entries) {
    const grouped = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to midnight for accurate comparison

    // 1. Generate keys for the last 14 days (Chronological order)
    // We use a helper map to ensure we match the exact date (Year-Month-Day)
    const validDateMap = {}; 

    for (let i = 13; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        
        // The label shown on the chart (e.g., "1/25")
        const labelKey = `${d.getMonth() + 1}/${d.getDate()}`;
        
        // Initialize the data object
        grouped[labelKey] = { partner1: 0, partner2: 0 };
        
        // Create a precise lookup key (e.g., "2026-1-25") so we don't accidentally
        // add data from the same day last year
        const preciseKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        validDateMap[preciseKey] = labelKey;
    }

    // 2. Fill in actual data
    entries.forEach(entry => {
        // Parse the entry date safely
        const [y, m, d] = entry.date.split('-').map(Number);
        const entryPreciseKey = `${y}-${m}-${d}`;

        // Check if this entry belongs to one of the last 14 days
        if (validDateMap[entryPreciseKey]) {
            const labelKey = validDateMap[entryPreciseKey];
            
            // Add to the correct partner
            if (grouped[labelKey] && entry.owner) {
                grouped[labelKey][entry.owner] += entry.amount;
            }
        }
    });

    return grouped;
}

// Render bars for weekly data
function renderDailyBars(chartElement, dailyData, chartType) {
    chartElement.innerHTML = '';
    
    const days = Object.keys(dailyData);
    if (days.length === 0) return;

    // 1. Determine Page Type
    const isP1Page = window.location.href.includes('partner1.html');
    const isP2Page = window.location.href.includes('partner2.html');
    // If neither partner page is detected, we are on the Combined Page (index.html)
    const showBoth = !isP1Page && !isP2Page; 

    // 2. Calculate Max Amount (Prevent divide by zero)
    const allAmounts = [];
    days.forEach(day => {
        allAmounts.push(dailyData[day].partner1);
        allAmounts.push(dailyData[day].partner2);
    });
    let maxAmount = Math.max(...allAmounts);
    if (maxAmount < 5) maxAmount = 5; 

    // 3. Create Columns for each Day
    days.forEach(day => {
        // The vertical column for the day
        const dayGroup = document.createElement('div');
        dayGroup.style.display = 'flex';
        dayGroup.style.flexDirection = 'column';
        dayGroup.style.alignItems = 'center'; 
        dayGroup.style.justifyContent = 'flex-end';
        dayGroup.style.flex = '1'; 
        dayGroup.style.height = '100%'; 
        dayGroup.style.position = 'relative';

        // Container to hold the bars (side-by-side)
        const barsContainer = document.createElement('div');
        barsContainer.style.display = 'flex';
        barsContainer.style.alignItems = 'flex-end'; 
        barsContainer.style.justifyContent = 'center';
        barsContainer.style.gap = '2px';
        barsContainer.style.height = '100%'; 
        barsContainer.style.width = '100%';

        // --- PARTNER 1 BAR LOGIC ---
        // Render if we are on Combined Page OR Partner 1 Page
        if (showBoth || isP1Page) {
            const p1Wrapper = document.createElement('div');
            p1Wrapper.style.display = 'flex';
            p1Wrapper.style.flexDirection = 'column';
            p1Wrapper.style.alignItems = 'center';
            p1Wrapper.style.justifyContent = 'flex-end';
            // Combined: 40% width (share space). Separate: 80% width (fill space).
            p1Wrapper.style.width = isP1Page ? '80%' : '40%'; 
            p1Wrapper.style.height = '100%';

            const p1Amount = dailyData[day].partner1;
            const p1Height = (p1Amount / maxAmount) * 100;
            
            // Label (Only if > 0)
            if (p1Amount > 0) {
                const p1Label = document.createElement('div');
                p1Label.className = 'bar-top-label';
                p1Label.textContent = Math.round(p1Amount);
                p1Wrapper.appendChild(p1Label);
            }

            // Bar
            const p1Bar = document.createElement('div');
            p1Bar.className = 'chart-bar partner1-bar';
            // Safety check: force 0px if amount is 0
            if (p1Amount <= 0) {
                p1Bar.style.height = '0px'; 
                p1Bar.style.minHeight = '0px';
            } else {
                p1Bar.style.height = `${p1Height}%`;
            }
            p1Bar.style.width = '100%'; 
            
            p1Wrapper.appendChild(p1Bar);
            barsContainer.appendChild(p1Wrapper);
        }

        // --- PARTNER 2 BAR LOGIC ---
        // Render if we are on Combined Page OR Partner 2 Page
        if (showBoth || isP2Page) {
            const p2Wrapper = document.createElement('div');
            p2Wrapper.style.display = 'flex';
            p2Wrapper.style.flexDirection = 'column';
            p2Wrapper.style.alignItems = 'center';
            p2Wrapper.style.justifyContent = 'flex-end';
            // Combined: 40% width (share space). Separate: 80% width (fill space).
            p2Wrapper.style.width = isP2Page ? '80%' : '40%';
            p2Wrapper.style.height = '100%';

            const p2Amount = dailyData[day].partner2;
            const p2Height = (p2Amount / maxAmount) * 100;

            // Label (Only if > 0)
            if (p2Amount > 0) {
                const p2Label = document.createElement('div');
                p2Label.className = 'bar-top-label';
                p2Label.textContent = Math.round(p2Amount);
                p2Wrapper.appendChild(p2Label);
            }

            // Bar
            const p2Bar = document.createElement('div');
            p2Bar.className = 'chart-bar partner2-bar';
            // Safety check: force 0px if amount is 0
            if (p2Amount <= 0) {
                p2Bar.style.height = '0px';
                p2Bar.style.minHeight = '0px';
            } else {
                p2Bar.style.height = `${p2Height}%`;
            }
            p2Bar.style.width = '100%';
            p2Wrapper.appendChild(p2Bar);
            barsContainer.appendChild(p2Wrapper);
        }

        // --- Date Label ---
        const label = document.createElement('div');
        label.className = 'bar-label';
        label.textContent = day.split('/')[1]; 
        
        dayGroup.appendChild(barsContainer);
        dayGroup.appendChild(label);
        
        chartElement.appendChild(dayGroup);
    });
}

// Listen for changes on the Type dropdown
const typeDropdown = document.getElementById('type');
if (typeDropdown) {
    typeDropdown.addEventListener('change', updateCategories);
    // Run once on load to set initial state
    updateCategories(); 
}

// Render entries list
function renderEntries() {
    const list = document.getElementById('entriesList');
    // Get the filtered list (or all items if on index.html)
    const currentEntries = getCurrentPageEntries();
    
    // Check if we are on the combined page (neither partner 1 nor partner 2)
    const isCombinedPage = !window.location.href.includes('partner1.html') && !window.location.href.includes('partner2.html');

    if (currentEntries.length === 0) {
        list.innerHTML = '<div class="empty-state"><p>No entries yet. Add your first transaction.</p></div>';
        return;
    }

    list.innerHTML = currentEntries.map(entry => {
        // Fix date parsing
        const [year, month, day] = entry.date.split('-');
        const dateObj = new Date(year, month - 1, day);
        
        const formattedDate = dateObj.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });

        // Determine owner styles for the Combined Page
        let ownerIndicator = '';
        let entryStyle = '';
        
        if (isCombinedPage) {
            const isP1 = entry.owner === 'partner1';
            const color = isP1 ? '#ec4899' : '#3b82f6'; // Pink vs Blue
            const name = isP1 ? 'Partner 1' : 'Partner 2';
            const icon = isP1 ? '<i class="fa-solid fa-user-large"></i>' : '<i class="fa-solid fa-user"></i>'; // Optional icons

            // Add a colored left border to distinguish users
            entryStyle = `border-left: 5px solid ${color};`;
            
            // Add a small label
            ownerIndicator = `<div style="font-size: 0.7em; color: ${color}; font-weight: bold; margin-bottom: 2px;">${name}</div>`;
        }

        return `
        <div class="entry" style="${entryStyle}">
            <div class="entry-info">
                ${ownerIndicator} <p>${formattedDate}</p>
                <h3>${entry.description}</h3>
            </div>
            <div class="entry-amount">
                <div class="type">${entry.type}</div>
                <div class="amount ${entry.type}">
                    ${entry.type === 'income' ? '+' : '-'}$${entry.amount.toFixed(2)}
                </div>
            </div>
        </div>
    `}).join('');
}

// Update summary cards
function updateSummary() {
    // FIX: Use filtered entries so the math matches the specific page
    const currentEntries = getCurrentPageEntries();
    
    const totalIncome = currentEntries
        .filter(e => e.type === 'income')
        .reduce((sum, e) => sum + e.amount, 0);
    
    const totalExpenses = currentEntries
        .filter(e => e.type === 'expense')
        .reduce((sum, e) => sum + e.amount, 0);
    
    const netIncome = totalIncome - totalExpenses;

    // Safety checks in case these elements don't exist in HTML (only Net Income is in your HTML)
    if(document.getElementById('totalIncome')) {
        document.getElementById('totalIncome').textContent = `$${totalIncome.toFixed(2)}`;
    }
    if (document.getElementById('totalExpenses')) {
        document.getElementById('totalExpenses').textContent = `$${totalExpenses.toFixed(2)}`;
    }   
    
    const netIncomeEl = document.getElementById('netIncome');
    if(netIncomeEl) {
        // FIX: corrected typo 'netIncmeEl' to 'netIncomeEl'
        netIncomeEl.textContent = `$${netIncome.toFixed(2)}`;
        netIncomeEl.className = 'card-value ' + (netIncome >= 0 ? 'income' : 'expense');
    }
}

// Initialize on page load
renderEntries();
renderExpenseChart();
renderIncomeChart();
updateSummary();