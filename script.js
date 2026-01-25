let entries = JSON.parse(localStorage.getItem('budgetEntries')) || [
    { id: 1, description: 'Salary', amount: 3000, type: 'income', date: '2026-01-01', owner: 'partner2'},
    { id: 2, description: 'Groceries', amount: 150, type: 'expense', date: '2026-01-02', owner: 'partner2'},
    { id: 3, description: 'Gas', amount: 45, type: 'expense', date: '2026-01-03', owner: 'partner1' }
];

// Set today's date as default
document.getElementById('date').valueAsDate = new Date();

// Add new entry
function addEntry() {
    const description = document.getElementById('description').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const type = document.getElementById('type').value;
    const date = document.getElementById('date').value;

    if (!description || !amount || !date) {
        alert('Please fill in all fields');
        return;
    }

    const newEntry = {
        id: Date.now(),
        description,
        amount,
        type,
        date,
        owner
    };

    entries.unshift(newEntry);
    localStorage.setItem('budgetEntries', JSON.stringify(entries));
    // Clear form
    document.getElementById('description').value = '';
    document.getElementById('amount').value = '';
    document.getElementById('type').value = 'expense';
    document.getElementById('date').valueAsDate = new Date();
    document.getElementById('owner').value = 'partner1';

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

// Render entries list
function renderEntries() {
    const list = document.getElementById('entriesList');
    
    if (entries.length === 0) {
        list.innerHTML = '<div class="empty-state"><p>No entries yet. Add your first transaction above!</p></div>';
        return;
    }

    list.innerHTML = entries.map(entry => {
        const dateObj = new Date(entry.date + 'T00:00');
        const formattedDate = dateObj.toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
        });
        return `
        <div class="entry">
            <div class="entry-info">
                <p>${formattedDate}</p>
                <h3>${entry.description}</h3>
            </div>
            <div class="entry-amount">
                <div class="type">${entry.type}</div>
                <div class="amount ${entry.type}">
                    ${entry.type === 'income' ? '+' : '-'}$${entry.amount.toFixed(2)}
                </div>
            </div>
            <!-- <button class="delete-btn" onclick="deleteEntry(${entry.id})">Delete</button> -->
        </div>
    `}).join('');
}

// Render income chart
function renderIncomeChart() {
    const chart = document.getElementById('incomeChart');
    chart.innerHTML = '';
    
    const incomeEntries = entries.filter(e => e.type === 'income');
    
    // Group by day (shows full month)
    const dailyData = groupByDay(incomeEntries);
    
    renderDailyBars(chart, dailyData, 'income');
}
//render expense chart 
function renderExpenseChart() {
    const chart = document.getElementById('expenseChart');
    chart.innerHTML = '';
    
    const expenseEntries = entries.filter(e => e.type === 'expense');
    
    // Group by day (shows full month)
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

// Group entries by day for the current month
function groupByDay(entries) {
    const grouped = {};
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Get number of days in current month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Initialize all days with zero amounts
    for (let day = 1; day <= daysInMonth; day++) {
        const key = `${currentMonth + 1}/${day}`;
        grouped[key] = { partner1: 0, partner2: 0 };
    }
    
    // Fill in actual data
    entries.forEach(entry => {
        const entryDate = new Date(entry.date);
        if (entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear) {
            const day = entryDate.getDate();
            const key = `${currentMonth + 1}/${day}`;
            
            if (grouped[key]) {
                grouped[key][entry.owner] += entry.amount;
            }
        }
    });
    
    return grouped;
}

// Render bars for weekly data
function renderDailyBars(chartElement, dailyDataData, chartType) {
    chartElement.innerHTML = '';
    
    const weeks = Object.keys(dailyData);
    
    if (daysInMonth.length === 0) return;
    
    // Find max for scaling
    const allAmounts = [];
    weeks.forEach(week => {
        allAmounts.push(dailyData[day].partner1);
        allAmounts.push(dailyData[day].partner2);
    });
    const maxAmount = Math.max(...allAmounts);
    
    // Create Y-axis
    const yAxis = document.createElement('div');
    yAxis.className = 'y-axis';
    
    // Create 5 tick marks
    for (let i = 4; i >= 0; i--) {
        const tickValue = (maxAmount / 4) * i;
        const tick = document.createElement('div');
        tick.className = 'y-axis-label';
        tick.textContent = '$' + Math.round(tickValue);
        yAxis.appendChild(tick);
    }
    
    chartElement.appendChild(yAxis);
    
    // Create bars
    days.forEach((day,index) => {
        const dayGroup = document.createElement('div');
        dayGroup.style.display = 'flex';
        dayGroup.style.flexDirection = 'column';
        dayGroup.style.alignItems = 'center';
        dayGroup.style.flex = '1';
        dayGroup.style.gap = '5px';
        dayGroup.style.position = 'relative';
        dayGroup.style.minWidth = '8px';
        
        // Partner 1 bar 
        const p1Amount = dailyData[day].partner1;
        const p1Height = maxAmount > 0 ? (p1Amount / maxAmount) * 100 : 0;
        const p1Bar = document.createElement('div');
        p1Bar.className = 'chart-bar partner1-bar';
        p1Bar.style.height = p1Height + '%';
        p1Bar.style.minHeight = p1Amount > 0 ? '5px' : '0';
        p1Bar.title = `Partner 1: $${p1Amount.toFixed(2)}`;
        
        // Partner 2 bar
        const p2Amount = dailyData[day].partner2;
        const p2Height = maxAmount > 0 ? (p2Amount / maxAmount) * 100 : 0;
        const p2Bar = document.createElement('div');
        p2Bar.className = 'chart-bar partner2-bar';
        p2Bar.style.height = p2Height + '%';
        p2Bar.style.minHeight = p2Amount > 0 ? '5px' : '0';
        p2Bar.title = `Partner 2: $${p2Amount.toFixed(2)}`;
        
        // Bars container
        const barsContainer = document.createElement('div');
        barsContainer.style.display = 'flex';
        barsContainer.style.gap = '3px';
        barsContainer.style.height = '135px'; /* Changed: matches chart height minus padding */
        barsContainer.style.alignItems = 'flex-end';
        barsContainer.appendChild(p1Bar);
        barsContainer.appendChild(p2Bar);
        
        // Week label
        const label = document.createElement('div');
        label.className = 'bar-label';
        label.textContent = week;
        
        weekGroup.appendChild(barsContainer);
        weekGroup.appendChild(label);
        
        chartElement.appendChild(weekGroup);
    });
}
// Update summary cards
function updateSummary() {
    const totalIncome = entries
        .filter(e => e.type === 'income')
        .reduce((sum, e) => sum + e.amount, 0);
    
    const totalExpenses = entries
        .filter(e => e.type === 'expense')
        .reduce((sum, e) => sum + e.amount, 0);
    
    const netIncome = totalIncome - totalExpenses;

    document.getElementById('totalIncome').textContent = `$${totalIncome.toFixed(2)}`;
    document.getElementById('totalExpenses').textContent = `$${totalExpenses.toFixed(2)}`;
    document.getElementById('netIncome').textContent = `$${netIncome.toFixed(2)}`;
    
    // Change balance color based on positive/negative
    const netIncomeEl = document.getElementById('netIncome');
    netIncomeEl.className = 'card-value ' + (netIncome >= 0 ? 'income' : 'expense');
}

// Initialize on page load
renderEntries();
renderExpenseChart();
renderIncomeChart();
updateSummary();