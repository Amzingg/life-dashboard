/********************************
 DATE HELPER (SAFE – ISO FORMAT)
*********************************/

function today() {
    return new Date().toISOString().split("T")[0];
}


/********************************
 PAGE NAVIGATION
*********************************/
function showPage(id) {
    document.querySelectorAll(".page").forEach(p =>
        p.classList.add("hidden")
    );

    document.getElementById(id).classList.remove("hidden");

    if (id === "expense") renderExpenses();
    if (id === "history") renderHistory();

    if (id === "home") {
        renderCalendar();

        // 🔥 FORCE CHARTS TO RE-DRAW
        renderMoodChart();
        renderHabitChart();
        renderStudyChart();
        renderExpenseChart();
    }
}


/********************************
 MOOD TRACKER
*********************************/
function saveMood() {
    const mood = document.getElementById("moodInput").value;
    if (!mood) return alert("Select a mood");

    localStorage.setItem("mood-" + today(), mood);

    document.getElementById("moodResult").innerText =
        `Your mood for today (${today()}) is: ${mood}`;

    updateSummary();
    renderMoodChart();
}

/********************************
 HABIT TRACKER
*********************************/
let habits = JSON.parse(localStorage.getItem("habits")) || {};
let habitDates = JSON.parse(localStorage.getItem("habitDates")) || [];

function addHabit() {
    const input = document.getElementById("habitInput");
    const habit = input.value.trim();
    if (!habit) return;

    if (!habits[today()]) habits[today()] = [];
    habits[today()].push(habit);

    localStorage.setItem("habits", JSON.stringify(habits));

    if (!habitDates.includes(today())) {
        habitDates.push(today());
        localStorage.setItem("habitDates", JSON.stringify(habitDates));
    }

    input.value = "";
    renderHabits();
    updateStreak();
    updateSummary();
    renderHabitChart();
}

function renderHabits() {
    const list = document.getElementById("habitList");
    list.innerHTML = "";

    (habits[today()] || []).forEach(h => {
        const li = document.createElement("li");
        li.textContent = h;
        list.appendChild(li);
    });
}

function updateStreak() {
    if (habitDates.length === 0) return;

    const dates = habitDates.map(d => new Date(d)).sort((a, b) => a - b);
    let current = 1, longest = 1;

    for (let i = 1; i < dates.length; i++) {
        const diff = (dates[i] - dates[i - 1]) / 86400000;
        if (diff === 1) {
            current++;
            longest = Math.max(longest, current);
        } else {
            current = 1;
        }
    }

    document.getElementById("habitStreak").innerText =
        `🔥 Streak: ${current} days`;
    document.getElementById("longestStreak").innerText =
        `🏆 Longest Streak: ${longest} days`;
}

/********************************
 STUDY TRACKER
*********************************/
let studyData = JSON.parse(localStorage.getItem("studyData")) || {};

function addStudy() {
    const subject = document.getElementById("subjectInput").value.trim();
    const hours = parseFloat(document.getElementById("timeInput").value);
    if (!subject || !hours) return;

    if (!studyData[today()]) studyData[today()] = [];
    studyData[today()].push({ subject, hours });

    localStorage.setItem("studyData", JSON.stringify(studyData));

    document.getElementById("subjectInput").value = "";
    document.getElementById("timeInput").value = "";

    renderStudies();
    updateSummary();
    renderStudyChart();
}

function renderStudies() {
    const list = document.getElementById("studyList");
    list.innerHTML = "";

    (studyData[today()] || []).forEach(s => {
        const li = document.createElement("li");
        li.textContent = `${s.subject} - ${s.hours} hrs`;
        list.appendChild(li);
    });
}

/********************************
 EXPENSE TRACKER
*********************************/
let expenses = JSON.parse(localStorage.getItem("expenses")) || {};
let monthlyLimit = parseFloat(localStorage.getItem("monthlyLimit")) || 0;

function setMonthlyLimit() {
    monthlyLimit = parseFloat(document.getElementById("monthlyLimit").value);
    localStorage.setItem("monthlyLimit", monthlyLimit);
    alert("Monthly limit saved ✅");
    renderExpenses();
}

function addExpense() {
    const amount = parseFloat(document.getElementById("expenseAmount").value);
    const category = document.getElementById("expenseCategory").value;
    const note = document.getElementById("expenseNote").value.trim();

    if (!amount || !category) return alert("Enter amount & category");

    if (!expenses[today()]) expenses[today()] = [];
    expenses[today()].push({ amount, category, note });

    localStorage.setItem("expenses", JSON.stringify(expenses));

    document.getElementById("expenseAmount").value = "";
    document.getElementById("expenseCategory").value = "";
    document.getElementById("expenseNote").value = "";

    renderExpenses();
    updateSummary();
    renderExpenseChart();
}

function deleteExpense(date, index) {
    expenses[date].splice(index, 1);
    if (expenses[date].length === 0) delete expenses[date];
    localStorage.setItem("expenses", JSON.stringify(expenses));
    renderExpenses();
    renderExpenseChart();
}

function renderExpenses() {
    const list = document.getElementById("expenseList");
    list.innerHTML = "";

    let todayTotal = 0;
    let monthTotal = 0;
    const now = new Date();

    Object.keys(expenses).forEach(date => {
        const d = new Date(date);
        expenses[date].forEach((e, i) => {
            if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
                monthTotal += e.amount;
            }
            if (date === today()) {
                todayTotal += e.amount;
                const li = document.createElement("li");
                li.innerHTML = `₹${e.amount} - ${e.category}
                <button onclick="deleteExpense('${date}',${i})">❌</button>`;
                list.appendChild(li);
            }
        });
    });

    document.getElementById("expenseTotalToday").innerText = `Today: ₹${todayTotal}`;
    document.getElementById("expenseMonthTotal").innerText = `This Month: ₹${monthTotal}`;

    if (monthlyLimit) {
        const percent = (monthTotal / monthlyLimit) * 100;
        const alertKey = "limit-alert-" + today();

        if (!localStorage.getItem(alertKey)) {
            if (percent >= 100) {
                alert("🚨 Monthly limit exceeded!");
                localStorage.setItem(alertKey, "true");
            } else if (percent >= 80) {
                alert("⚠️ 80% of monthly limit reached");
                localStorage.setItem(alertKey, "true");
            }
        }
    }
}

/********************************
 SUMMARY
*********************************/
function updateSummary() {
    document.getElementById("summaryMood").innerText =
        `Mood: ${localStorage.getItem("mood-" + today()) || "—"}`;

    document.getElementById("summaryHabits").innerText =
        `Habits: ${(habits[today()] || []).length}`;

    const studyHours = (studyData[today()] || [])
        .reduce((s, x) => s + x.hours, 0);

    document.getElementById("summaryStudy").innerText =
        `Study: ${studyHours} hrs`;

    const expenseTotal = (expenses[today()] || [])
        .reduce((s, e) => s + e.amount, 0);

    document.getElementById("summaryExpense").innerText =
        `Expense: ₹${expenseTotal}`;
}

/********************************
 ANALYTICS (SAFE CHARTS)
*********************************/
let moodChart, habitChart, studyChart, expenseChart;

function renderMoodChart() {
    if (moodChart) moodChart.destroy();

    const labels = [];
    const data = [];

    Object.keys(localStorage)
        .filter(k => k.startsWith("mood-"))
        .sort()
        .forEach(key => {
            labels.push(key.replace("mood-", ""));
            const mood = localStorage.getItem(key);
            data.push(mood === "Happy" ? 4 : mood === "Neutral" ? 3 : mood === "Sad" ? 2 : 1);
        });

    moodChart = new Chart(document.getElementById("moodChart"), {
        type: "line",
        data: { labels, datasets: [{ label: "Mood Trend", data }] }
    });
}

function renderHabitChart() {
    if (habitChart) habitChart.destroy();

    habitChart = new Chart(document.getElementById("habitChart"), {
        type: "bar",
        data: {
            labels: Object.keys(habits),
            datasets: [{ label: "Habits", data: Object.values(habits).map(h => h.length) }]
        }
    });
}

function renderStudyChart() {
    if (studyChart) studyChart.destroy();

    studyChart = new Chart(document.getElementById("studyChart"), {
        type: "bar",
        data: {
            labels: Object.keys(studyData),
            datasets: [{
                label: "Study Hours",
                data: Object.values(studyData).map(d =>
                    d.reduce((s, x) => s + x.hours, 0)
                )
            }]
        }
    });
}

function renderExpenseChart() {
    if (expenseChart) expenseChart.destroy();

    const totals = {};
    const now = new Date();

    Object.keys(expenses).forEach(date => {
        const d = new Date(date);
        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
            expenses[date].forEach(e => {
                totals[e.category] = (totals[e.category] || 0) + e.amount;
            });
        }
    });

    expenseChart = new Chart(document.getElementById("expenseChart"), {
        type: "doughnut",
        data: {
            labels: Object.keys(totals),
            datasets: [{ data: Object.values(totals) }]
        }
    });
}

/********************************
 DARK MODE
*********************************/
function toggleTheme() {
    document.body.classList.toggle("dark");
    localStorage.setItem("theme",
        document.body.classList.contains("dark") ? "dark" : "light");
}

if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
}

/********************************
 HISTORY
*********************************/
function renderHistory() {
    const list = document.getElementById("historyList");
    list.innerHTML = "";

    const dates = new Set([
        ...Object.keys(habits),
        ...Object.keys(studyData),
        ...Object.keys(expenses),
        ...Object.keys(localStorage)
            .filter(k => k.startsWith("mood-"))
            .map(k => k.replace("mood-", ""))
    ]);

    [...dates].sort().reverse().forEach(date => {

        // ✅ FILTER INVALID DATES (CRITICAL FIX)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;

        const mood = localStorage.getItem("mood-" + date) || "—";
        const habitCount = (habits[date] || []).length;
        const studyHours = (studyData[date] || []).reduce((s, x) => s + x.hours, 0);
        const expenseTotal = (expenses[date] || []).reduce((s, e) => s + e.amount, 0);

        // 🎯 DAY QUALITY (for visual emphasis)
        let qualityClass = "";
        if (studyHours >= 4 || habitCount >= 5) qualityClass = "great";
        if (expenseTotal >= 1000) qualityClass = "warning";

        const li = document.createElement("li");
        li.className = `history-card ${qualityClass}`;
        li.innerHTML = `
            <div class="history-date">${date}</div>

            <div class="history-chips">
                <span class="chip mood ${mood.toLowerCase()}">🙂 ${mood}</span>
                <span class="chip habit">🔥 ${habitCount}</span>
                <span class="chip study">📘 ${studyHours}h</span>
                <span class="chip expense">💰 ₹${expenseTotal}</span>
            </div>
        `;

        list.appendChild(li);
    });
}


/********************************
 CALENDAR GRID
*********************************/
function renderCalendar() {
    const calendar = document.getElementById("calendarGrid");
    if (!calendar) return;

    calendar.innerHTML = "";
    const now = new Date();
    const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    for (let day = 1; day <= days; day++) {
        const date = new Date(now.getFullYear(), now.getMonth(), day)
            .toISOString().split("T")[0];

        const cell = document.createElement("div");
        cell.className = "calendar-cell";
        cell.innerHTML = `
            <strong>${day}</strong>
            <small>💰 ₹${(expenses[date] || []).reduce((s,e)=>s+e.amount,0)}</small>
            <small>🙂 ${localStorage.getItem("mood-" + date) || ""}</small>
            <small>🔥 ${(habits[date] || []).length}</small>
            <small>📘 ${(studyData[date] || []).reduce((s,x)=>s+x.hours,0)}h</small>
        `;
        calendar.appendChild(cell);
    }
}
function toggleTheme() {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    document.getElementById("darkToggle").checked = isDark;
}

if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    document.getElementById("darkToggle").checked = true;
}

/********************************
 INITIAL LOAD
*********************************/
showPage("home");
renderHabits();
renderStudies();
renderExpenses();
updateStreak();
updateSummary();
renderMoodChart();
renderHabitChart();
renderStudyChart();
renderExpenseChart();
renderHistory();
renderCalendar();
