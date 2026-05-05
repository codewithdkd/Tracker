// Configuration: REPLACE THIS URL WITH YOUR GOOGLE APPS SCRIPT WEB APP URL
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwcbSV0o3Jh8I1Sg8X2xejjGm1eyFTmO1flzKd07rShRJ2i-adOhb99cQmeE9mCJuP-DA/exec";

document.addEventListener('DOMContentLoaded', () => {
    const today = new Date();
    const localDateStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    document.getElementById('date').value = localDateStr;

    const currentMonthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    document.getElementById('current-month-display').innerText = currentMonthName;

    const inputs = document.querySelectorAll('#habit-form input:not([type="hidden"]), #habit-form select');
    inputs.forEach(input => {
        if (input.id !== 'user-weight') {
            input.addEventListener('change', calculateLivePoints);
            input.addEventListener('input', calculateLivePoints);
        }
    });

    // Setup Exercise Tracker
    document.getElementById('add-exercise-btn').addEventListener('click', addExerciseRow);
    document.getElementById('user-weight').addEventListener('input', debounce(calculateAllRowsCalories, 500));

    // Toggle Button Logic (Replacing Selects)
    document.querySelectorAll('.toggle-group').forEach(group => {
        const targetId = group.getAttribute('data-target');
        const hiddenInput = document.getElementById(targetId);

        group.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                group.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                hiddenInput.value = btn.dataset.value;
                calculateLivePoints();
            });
        });
    });

    if (WEB_APP_URL !== "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE") {
        fetchDashboardData();
    }
});

// View Navigation
function openInputForm(user) {
    document.getElementById('dashboard-view').style.display = 'none';
    document.getElementById('success-view').style.display = 'none';
    document.getElementById('deficit-view').style.display = 'none';
    document.getElementById('input-view').style.display = 'block';

    document.getElementById('welcome-message').innerText = `Welcome ${user}`;
    document.getElementById('user-name').value = user;

    if (window.userData && window.userData[user]) {
        document.getElementById('user-weight').value = window.userData[user].weight;
        document.getElementById('user-height').value = window.userData[user].height;
        document.getElementById('user-age').value = window.userData[user].age;
    }

    const submitBtn = document.getElementById('submit-btn');
    if (user === 'Deepak') {
        submitBtn.style.background = 'var(--deepak-color)';
        submitBtn.style.boxShadow = '0 4px 15px var(--deepak-glow)';
    } else {
        submitBtn.style.background = 'var(--shalini-color)';
        submitBtn.style.boxShadow = '0 4px 15px var(--shalini-glow)';
    }

    window.scrollTo(0, 0);
    calculateLivePoints();
}

function openDashboard() {
    document.getElementById('input-view').style.display = 'none';
    document.getElementById('success-view').style.display = 'none';
    document.getElementById('deficit-view').style.display = 'none';
    document.getElementById('dashboard-view').style.display = 'block';

    if (!window.userData) {
        fetchDashboardData();
    }
}

window.openDeficitView = function() {
    document.getElementById('dashboard-view').style.display = 'none';
    document.getElementById('deficit-view').style.display = 'block';
    if (window.userData) {
        renderDeficitDashboard('Deepak');
    }
}

window.renderDeficitDashboard = function (user) {
    const btnD = document.getElementById('btn-def-Deepak');
    const btnS = document.getElementById('btn-def-Shalini');
    if (btnD) btnD.style.background = user === 'Deepak' ? 'var(--deepak-color)' : 'rgba(255,255,255,0.05)';
    if (btnS) btnS.style.background = user === 'Shalini' ? 'var(--shalini-color)' : 'rgba(255,255,255,0.05)';

    const container = document.getElementById('deficit-container');
    if (!container) return;

    const uData = window.userData?.[user];

    if (!uData || !uData.logs || uData.logs.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: var(--text-muted);">No daily records found for this month.</p>`;
        return;
    }

    let html = `<div style="display: flex; flex-direction: column; gap: 0.5rem;">`;

    let bmr = 0;
    if (user === 'Deepak') {
        bmr = (10 * uData.weight) + (6.25 * uData.height) - (5 * uData.age) + 5;
    } else {
        bmr = (10 * uData.weight) + (6.25 * uData.height) - (5 * uData.age) - 161;
    }

    const maintenance = Math.round(bmr * 1.4);

    const sortedLogs = [...uData.logs].sort((a, b) => new Date(a.date) - new Date(b.date));

    sortedLogs.forEach(log => {
        const net = Math.round((maintenance + log.burnt) - log.consumed);
        const netStr = net >= 0 ? `+${net}` : `${net}`;
        const colorClass = net >= 0 ? 'val-green' : 'val-red';

        const d = new Date(log.date);
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        html += `
        <div class="deficit-row" style="display: grid; grid-template-columns: 2fr 1.5fr 1.5fr 1.2fr; gap: 0.5rem; align-items: center; text-align: center; padding: 0.75rem 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
            <div class="deficit-date" style="font-weight: 600; font-size: 0.9rem;">${dateStr}</div>
            <div style="font-size: 0.85rem; color: var(--text-muted);">${Math.round(log.consumed)}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted); display:flex; flex-direction:column;">
                <span>${Math.round(log.burnt)}</span>
                <span style="font-size: 0.6rem; opacity: 0.7;">+${maintenance} BMR</span>
            </div>
            <div class="deficit-val ${colorClass}" style="font-size: 1rem; font-weight: 800;">${netStr}</div>
        </div>
        `;
    });

    html += `</div>`;
    container.innerHTML = html;
}

// Time Utils
function getHoursDiff(start, end) {
    if (!start || !end) return 0;
    let startTime = new Date(`01/01/2000 ${start}`).getTime();
    let endTime = new Date(`01/01/2000 ${end}`).getTime();
    if (endTime < startTime) endTime = new Date(`01/02/2000 ${end}`).getTime();
    return (endTime - startTime) / (1000 * 60 * 60);
}

// Advanced Proportional Scoring Logic
function calculateLivePoints() {
    let points = 0;
    let breakdown = [];

    // --- 1. Sleep Tracking ---
    const sleepTime = document.getElementById('sleep-time').value;
    const wakeTime = document.getElementById('wake-time').value;
    const sleepHrs = getHoursDiff(sleepTime, wakeTime);

    document.getElementById('live-sleep-hours').innerText = `Total Slept Hours: ${sleepHrs.toFixed(1)} hrs`;

    // Logic: 7hr = max points (+3). 6 or 8 = decreased points (+2). <5 or >8.5 = penalty
    if (sleepHrs >= 6.5 && sleepHrs <= 7.5) { points += 3; breakdown.push("Optimal Sleep 7h (+3)"); }
    else if ((sleepHrs >= 5.5 && sleepHrs < 6.5) || (sleepHrs > 7.5 && sleepHrs <= 8.5)) { points += 2; breakdown.push(`Good Sleep ${sleepHrs.toFixed(1)}h (+2)`); }
    else if (sleepHrs >= 5 && sleepHrs < 5.5) { points += 1; breakdown.push("Sleep 5h (+1)"); }
    else if (sleepHrs > 8.5) { points -= 1; breakdown.push(`Oversleep ${sleepHrs.toFixed(1)}h (-1)`); }
    else if (sleepHrs > 0 && sleepHrs < 5) { points -= 1; breakdown.push("Poor Sleep <5h (-1)"); }

    // --- 2. Productivity / Study ---
    const studyHours = parseFloat(document.getElementById('study-hours').value) || 0;
    if (studyHours >= 4) { points += 5; breakdown.push("Study 4h+ (+5)"); }
    else if (studyHours >= 3) { points += 4; breakdown.push("Study 3h+ (+4)"); }
    else if (studyHours >= 2) { points += 2.5; breakdown.push("Study 2h+ (+2.5)"); }
    else if (studyHours > 0) { points += studyHours; breakdown.push(`Study (${studyHours.toFixed(1)})`); } // Linear scaling

    // --- 3. Health (Sunlight) & Exercise Tracker ---
    let exMins = 0;
    let totalCalories = 0;

    // Sum up durations and calories from dynamic rows
    document.querySelectorAll('#exercise-rows-container .exercise-row').forEach(row => {
        const duration = parseInt(row.querySelector('.ex-duration').value) || 0;
        const cals = parseInt(row.querySelector('.ex-calories').innerText) || 0;
        exMins += duration;
        totalCalories += cals;
    });

    // If duration was optional and missing, estimate from calories (approx 100 kcal = 10 mins)
    if (exMins === 0 && totalCalories > 0) {
        exMins = Math.round(totalCalories / 10);
    }

    if (exMins >= 45) { points += 3; breakdown.push("Exercise 45m+ (+3)"); }
    else if (exMins >= 30) { points += 2; breakdown.push("Exercise 30m+ (+2)"); }
    else if (exMins >= 20) { points += 1; breakdown.push("Exercise 20m+ (+1)"); }
    else if (exMins > 0) { points += 0.5; breakdown.push(`Exercise <20m (+0.5)`); }

    // Sunlight logic replaces old Outdoor Bonus
    const sunlight = parseInt(document.getElementById('sunlight').value) || 0;
    if (sunlight >= 15) { points += 0.5; breakdown.push("Sunlight (+0.5)"); }

    // --- 4. Nutrition ---
    const water = parseFloat(document.getElementById('water-intake').value) || 0;
    if (water >= 4) { points += 3; breakdown.push("Water 4L+ (+3)"); }
    else if (water >= 3) { points += 2; breakdown.push("Water 3L+ (+2)"); }
    else if (water >= 2) { points += 1; breakdown.push("Water 2L+ (+1)"); }
    else if (water >= 1) { points += 0.5; breakdown.push("Water 1L+ (+0.5)"); }

    const junk = document.getElementById('junk-food').value;
    if (junk === 'None') { points += 2; breakdown.push("No Fast Food (+2)"); }
    else if (junk === 'Low') { points += 1; breakdown.push("Low Junk (+1)"); }
    else if (junk === 'High') { points -= 1; breakdown.push("High Junk (-1)"); }

    const sugar = document.getElementById('sugar').value;
    if (sugar === 'None') { points += 2; breakdown.push("No Sugar (+2)"); }
    else if (sugar === 'Limited') { points += 1; breakdown.push("Limited Sugar (+1)"); }

    if (document.getElementById('fruits-juice').checked) { points += 1; breakdown.push("Fruits/Juice (+1)"); }

    // --- 5. Digital Discipline ---
    const phone = parseFloat(document.getElementById('phone-hours').value) || 0;
    if (phone >= 0 && phone <= 2) { points += 3; breakdown.push("Phone <=2h (+3)"); }
    else if (phone <= 4) { points += 1; breakdown.push("Phone 3-4h (+1)"); }
    else { points -= 2; breakdown.push("Phone >4h (-2)"); }

    // --- 6. Mental Discipline & Behavior ---
    const med = parseInt(document.getElementById('meditation').value) || 0;
    if (med >= 20) { points += 2; breakdown.push("Meditation 20m+ (+2)"); }
    else if (med >= 10) { points += 1; breakdown.push("Meditation 10m+ (+1)"); }
    else if (med >= 5) { points += 0.5; breakdown.push("Meditation 5m+ (+0.5)"); }

    const mood = parseInt(document.getElementById('mood').value) || 3;
    if (mood >= 4) { points += 1; breakdown.push("Good Mood (+1)"); }

    if (document.getElementById('anger').checked) { points -= 2; breakdown.push("Showed Anger (-2)"); }
    else { points += 2; breakdown.push("No Anger (+2)"); }

    document.getElementById('live-points').innerText = `Daily Score: ${points.toFixed(1)}`;
    document.getElementById('score-breakdown').innerText = breakdown.join(' | ');
    return points.toFixed(1);
}

// Form Submission
async function submitForm(event) {
    event.preventDefault();
    const statusMsg = document.getElementById('submit-status');
    const submitBtn = document.getElementById('submit-btn');

    if (WEB_APP_URL === "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE") {
        statusMsg.style.color = "#ef4444";
        statusMsg.innerText = "Error: Please set your Web App URL in app.js first!";
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerText = "Submitting...";
    statusMsg.innerText = "";

    const formData = new FormData(event.target);
    const aSleep = formData.get('sleep-time');
    const aWake = formData.get('wake-time');
    const sleepHoursCalculated = getHoursDiff(aSleep, aWake).toFixed(1);

    const data = {
        user: formData.get('user-name'),
        date: formData.get('date'),

        sleepTime: aSleep,
        wakeTime: aWake,
        sleepHours: sleepHoursCalculated,

        leftHome: formData.get('left-home'),
        returnedHome: formData.get('returned-home'),

        studyHours: formData.get('study-hours'),

        sunlight: formData.get('sunlight'),
        exerciseJSON: formData.get('exercise-json'),
        totalCalories: formData.get('total-calories'),

        foodJSON: formData.get('food-json'),
        totalFoodCalories: formData.get('total-food-calories'),
        weight: formData.get('user-weight'),
        height: formData.get('user-height'),
        age: formData.get('user-age'),

        water: formData.get('water-intake'),
        junkFood: formData.get('junk-food'),
        sugar: formData.get('sugar'),
        fruitsJuice: formData.get('fruits-juice') ? 'Yes' : 'No',

        phoneHours: formData.get('phone-hours'),
        noPhoneMorning: formData.get('no-phone-morning') ? 'Yes' : 'No',

        meditation: formData.get('meditation'),
        mood: formData.get('mood'),
        anger: formData.get('anger') ? 'Yes' : 'No',

        points: calculateLivePoints()
    };

    try {
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        // Show Success Page
        document.getElementById('input-view').style.display = 'none';
        document.getElementById('success-view').style.display = 'block';

        event.target.reset();
        document.getElementById('date').valueAsDate = new Date();
        calculateLivePoints();

        setTimeout(() => { openDashboard(); }, 2500);

    } catch (error) {
        statusMsg.style.color = "#ef4444";
        statusMsg.innerText = "Error saving data. Check console.";
        console.error(error);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = "Submit Record";
    }
}

// Fetch Dashboard Data
async function fetchDashboardData() {
    if (WEB_APP_URL === "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE") return;

    try {
        const response = await fetch(WEB_APP_URL + "?action=getStandings");
        const data = await response.json();

        const dPts = data.deepakTotal || 0;
        const sPts = data.shaliniTotal || 0;

        animateValue("deepak-points", parseFloat(document.getElementById('deepak-points').innerText) || 0, dPts, 1000);
        animateValue("shalini-points", parseFloat(document.getElementById('shalini-points').innerText) || 0, sPts, 1000);

        updateProgress(dPts, sPts);
        updateLeader(dPts, sPts);

        // Update Entry Counts
        document.getElementById('deepak-entries').innerText = data.deepakEntries || 0;
        document.getElementById('shalini-entries').innerText = data.shaliniEntries || 0;

        // Populate Past Records
        if (data.pastMonths) {
            populatePastRecords(data.pastMonths);
        }

        window.calorieDB = {
            food: data.foodDB || [],
            exercise: data.exerciseDB || {}
        };

        // Populate Past Foods Datalist
        const datalist = document.getElementById('past-foods-list');
        if (datalist) {
            datalist.innerHTML = '';
            let allFoods = new Set();
            if (data.pastFoods) data.pastFoods.forEach(f => allFoods.add(f));
            if (data.foodDB) data.foodDB.forEach(f => allFoods.add(f.name));

            allFoods.forEach(food => {
                const option = document.createElement('option');
                option.value = food;
                datalist.appendChild(option);
            });
        }

        // Populate Exercise Datalist
        const exDatalist = document.getElementById('db-exercises-list');
        if (exDatalist && data.exerciseDB) {
            exDatalist.innerHTML = '';
            Object.keys(data.exerciseDB).forEach(ex => {
                const option = document.createElement('option');
                option.value = ex.charAt(0).toUpperCase() + ex.slice(1);
                exDatalist.appendChild(option);
            });
        }

        window.userData = {
            Deepak: { weight: data.deepakWeight || 70, height: data.deepakHeight || 170, age: data.deepakAge || 25, logs: data.deepakLogs || [] },
            Shalini: { weight: data.shaliniWeight || 60, height: data.shaliniHeight || 160, age: data.shaliniAge || 25, logs: data.shaliniLogs || [] }
        };

        const user = document.getElementById('user').value;
        if (window.userData[user]) {
            document.getElementById('user-weight').value = window.userData[user].weight;
            document.getElementById('user-height').value = window.userData[user].height;
            document.getElementById('user-age').value = window.userData[user].age;
        }

        document.getElementById('loading-indicator').style.display = 'none';

        // Render Dashboard components
        renderDeficitDashboard('Deepak');

    } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
    }
}

function updateProgress(deepak, shalini) {
    const total = deepak + shalini;
    if (total === 0) return;

    const dPercent = Math.round((deepak / total) * 100);
    const sPercent = 100 - dPercent;

    document.getElementById('deepak-progress').style.width = `${dPercent}%`;
    document.getElementById('shalini-progress').style.width = `${sPercent}%`;
    document.getElementById('deepak-percent').innerText = `${dPercent}%`;
    document.getElementById('shalini-percent').innerText = `${sPercent}%`;
}

function updateLeader(deepak, shalini) {
    document.getElementById('deepak-crown').style.display = 'none';
    document.getElementById('shalini-crown').style.display = 'none';
    const banner = document.getElementById('difference-banner');
    const bannerText = document.getElementById('difference-text');

    if (deepak > shalini) {
        document.getElementById('deepak-crown').style.display = 'inline-block';
        banner.style.display = 'block';
        bannerText.innerHTML = `🔥 Deepak is leading by <span style="color: var(--deepak-color); font-weight:800;">${(deepak - shalini).toFixed(1)} pts</span>!`;
    } else if (shalini > deepak) {
        document.getElementById('shalini-crown').style.display = 'inline-block';
        banner.style.display = 'block';
        bannerText.innerHTML = `🔥 Shalini is leading by <span style="color: var(--shalini-color); font-weight:800;">${(shalini - deepak).toFixed(1)} pts</span>!`;
    } else {
        if (deepak > 0) {
            banner.style.display = 'block';
            bannerText.innerHTML = "🤝 It's a dead tie!";
        } else {
            banner.style.display = 'none';
        }
    }
}

function populatePastRecords(pastMonths) {
    const tbody = document.getElementById('past-records-body');
    tbody.innerHTML = ''; // clear existing

    if (pastMonths.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color: var(--text-muted);">No past records found.</td></tr>';
        return;
    }

    pastMonths.forEach(record => {
        const tr = document.createElement('tr');

        // Month Name
        const tdMonth = document.createElement('td');
        tdMonth.innerText = record.monthName;

        // Deepak Points
        const tdDeepak = document.createElement('td');
        tdDeepak.innerText = record.deepak.toFixed(1);

        // Shalini Points
        const tdShalini = document.createElement('td');
        tdShalini.innerText = record.shalini.toFixed(1);

        // Winner
        const tdWinner = document.createElement('td');
        if (record.deepak > record.shalini) {
            tdWinner.innerHTML = `<span class="winner-deepak">Deepak 👑</span>`;
        } else if (record.shalini > record.deepak) {
            tdWinner.innerHTML = `<span class="winner-shalini">Shalini 👑</span>`;
        } else {
            tdWinner.innerText = "Tie";
        }

        tr.appendChild(tdMonth);
        tr.appendChild(tdDeepak);
        tr.appendChild(tdShalini);
        tr.appendChild(tdWinner);

        tbody.appendChild(tr);
    });
}

function animateValue(id, start, end, duration) {
    if (start === end) return;
    let range = end - start;
    let current = start;
    let increment = end > start ? 1 : -1;
    let isFloat = !Number.isInteger(end);
    let stepTime = Math.abs(Math.floor(duration / 100));
    let obj = document.getElementById(id);
    let stepCount = 0;

    let timer = setInterval(function () {
        stepCount++;
        let progress = stepCount / 100;
        let currentVal = start + (range * progress);

        obj.innerHTML = isFloat ? currentVal.toFixed(1) : Math.round(currentVal);

        if (stepCount >= 100) {
            clearInterval(timer);
            obj.innerHTML = isFloat ? end.toFixed(1) : end;
        }
    }, stepTime);
}

// --- Dynamic Exercise Tracker Logic ---

let exerciseRowCount = 0;

function addExerciseRow() {
    exerciseRowCount++;
    const container = document.getElementById('exercise-rows-container');
    const rowId = `ex-row-${exerciseRowCount}`;

    const rowHTML = `
        <div class="exercise-row" id="${rowId}">
            <div class="exercise-row-header">
                <input type="text" class="ex-type" list="db-exercises-list" placeholder="Exercise Name (e.g. Walking)" style="flex: 1; margin-right: 0.5rem;" oninput="handleExerciseTypeChange('${rowId}')">
                <button type="button" class="delete-row-btn" onclick="removeExerciseRow('${rowId}')">✕</button>
            </div>
            
            <div class="form-group row" style="margin-bottom: 0;">
                <div>
                    <label class="ex-val-label">Steps / Dist (km)</label>
                    <input type="number" class="ex-val" min="0" value="0" oninput="debouncedFetchCalories('${rowId}')">
                </div>
                <div>
                    <label>Duration (min) <span style="font-size:0.7rem;color:#94a3b8;">Opt</span></label>
                    <input type="number" class="ex-duration" min="0" value="" oninput="debouncedFetchCalories('${rowId}')">
                </div>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; background: rgba(0,0,0,0.2); padding: 0.5rem; border-radius: 8px;">
                <span style="color: var(--text-muted); font-size: 0.9rem;">Calories Burned:</span>
                <div style="display: flex; align-items: center;">
                    <span class="ex-calories" style="color: #10b981; font-weight: bold;">0</span>
                    <span class="ex-loading spinner" style="display: none;"></span>
                </div>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', rowHTML);
    handleExerciseTypeChange(rowId); // Initialize labels
    updateExerciseJSON();
}

function removeExerciseRow(rowId) {
    document.getElementById(rowId).remove();
    updateExerciseJSON();
    calculateLivePoints();
    calculateTotalCalories();
}

window.handleExerciseTypeChange = function (rowId) {
    const row = document.getElementById(rowId);
    if (!row) return;
    const type = row.querySelector('.ex-type').value.toLowerCase();
    const label = row.querySelector('.ex-val-label');

    if (type.includes('walk')) label.innerText = 'Steps / Dist(km)';
    else if (type.includes('run') || type.includes('cycl') || type.includes('swim')) label.innerText = 'Distance(km)';
    else if (type.includes('push') || type.includes('pull')) label.innerText = 'Reps';
    else label.innerText = 'Value';

    debouncedFetchCalories(rowId);
};

// Debounce helper
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

const debouncedFetchCalories = debounce((rowId) => {
    fetchRowCalories(rowId);
}, 600);

function calculateAllRowsCalories() {
    document.querySelectorAll('#exercise-rows-container .exercise-row').forEach(row => {
        fetchRowCalories(row.id);
    });
}

async function fetchRowCalories(rowId) {
    const row = document.getElementById(rowId);
    if (!row) return;

    const type = row.querySelector('.ex-type').value;
    const value = parseFloat(row.querySelector('.ex-val').value) || 0;
    const duration = parseFloat(row.querySelector('.ex-duration').value) || 0;
    const weight = parseFloat(document.getElementById('user-weight').value) || 70;

    const caloriesEl = row.querySelector('.ex-calories');
    const loadingEl = row.querySelector('.ex-loading');

    if (value === 0 && duration === 0) {
        caloriesEl.innerText = '0';
        updateExerciseJSON();
        calculateTotalCalories();
        return;
    }

    caloriesEl.style.display = 'none';
    loadingEl.style.display = 'inline-block';

    setTimeout(() => {
        let cals = 0;
        const metValue = window.calorieDB?.exercise?.[type.toLowerCase()];

        if (metValue) {
            cals = metValue * weight * (duration / 60);
            if (duration === 0) {
                if (type === "Walking") {
                    const distKm = value > 100 ? value / 1250 : value;
                    cals = distKm * weight * 0.85;
                } else if (type === "Running") {
                    cals = value * weight * 1.036;
                } else if (type === "Push-ups" || type === "Pull-ups") {
                    cals = value * 0.4;
                }
            } else {
                if (type === "Walking") {
                    const distKm = value > 100 ? value / 1250 : value;
                    cals = Math.max(distKm * weight * 0.85, cals);
                } else if (type === "Running") {
                    cals = Math.max(value * weight * 1.036, cals);
                } else if (type === "Push-ups" || type === "Pull-ups") {
                    cals = (value * 0.4) + (cals * 0.2);
                }
            }
        } else {
            // Fallback if DB missing
            if (type === "Yoga" || type === "Pilates") cals = 3.0 * weight * (duration / 60);
            else if (type === "Walking" || type === "Stretching") cals = 2.5 * weight * (duration / 60);
            else if (type === "Push-ups" || type === "Pull-ups") cals = value * 0.5;
            else cals = value * 0.5;
        }

        caloriesEl.innerText = Math.round(cals);
        loadingEl.style.display = 'none';
        caloriesEl.style.display = 'inline-block';
        updateExerciseJSON();
        calculateTotalCalories();
        calculateLivePoints();
    }, 150);
}

function calculateTotalCalories() {
    let total = 0;
    document.querySelectorAll('.ex-calories').forEach(el => {
        const cal = parseInt(el.innerText);
        if (!isNaN(cal)) total += cal;
    });

    document.getElementById('total-calories-display').innerText = total;
    document.getElementById('total-calories').value = total;
}

function updateExerciseJSON() {
    const data = [];
    document.querySelectorAll('#exercise-rows-container .exercise-row').forEach(row => {
        data.push({
            type: row.querySelector('.ex-type').value,
            value: parseFloat(row.querySelector('.ex-val').value) || 0,
            duration: parseFloat(row.querySelector('.ex-duration').value) || 0,
            calories: parseInt(row.querySelector('.ex-calories').innerText) || 0
        });
    });
    document.getElementById('exercise-json').value = JSON.stringify(data);
}

// --- Dynamic Food Tracker Logic ---

let foodRowCount = 0;

function addFoodRow(mealType) {
    foodRowCount++;
    const container = document.getElementById(`${mealType}-rows-container`);
    if (!container) return;

    const rowId = `food-row-${foodRowCount}`;

    const rowHTML = `
        <div class="exercise-row" id="${rowId}" data-meal="${mealType}">
            <div class="exercise-row-header">
                <input type="text" class="food-name" list="past-foods-list" placeholder="Food Name (e.g. rice)" style="flex: 1; margin-right: 0.5rem;" oninput="debouncedFetchFoodCalories('${rowId}')">
                <button type="button" class="delete-row-btn" onclick="removeFoodRow('${rowId}')">✕</button>
            </div>
            
            <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                <input type="number" class="food-qty" placeholder="Qty" min="0" step="0.1" value="1" style="width: 80px;" oninput="debouncedFetchFoodCalories('${rowId}')">
                <div class="unit-toggle-group">
                    <button type="button" class="unit-btn active" data-unit="gram" onclick="selectFoodUnit('${rowId}', 'gram')">gram</button>
                    <button type="button" class="unit-btn" data-unit="ml" onclick="selectFoodUnit('${rowId}', 'ml')">ml</button>
                    <button type="button" class="unit-btn" data-unit="piece" onclick="selectFoodUnit('${rowId}', 'piece')">piece</button>
                </div>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; background: rgba(0,0,0,0.2); padding: 0.5rem; border-radius: 8px;">
                <span style="color: var(--text-muted); font-size: 0.9rem;">Estimated Calories:</span>
                <div style="display: flex; align-items: center;">
                    <span class="food-calories" style="color: #f59e0b; font-weight: bold;">0</span>
                    <span class="food-loading spinner" style="display: none; border-top-color: #f59e0b;"></span>
                </div>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', rowHTML);
    updateFoodJSON();
}

function removeFoodRow(rowId) {
    document.getElementById(rowId).remove();
    updateFoodJSON();
    calculateTotalFoodCalories();
}

window.selectFoodUnit = function (rowId, unit) {
    const row = document.getElementById(rowId);
    if (!row) return;
    row.querySelectorAll('.unit-btn').forEach(btn => btn.classList.remove('active'));
    row.querySelector(`.unit-btn[data-unit="${unit}"]`).classList.add('active');
    debouncedFetchFoodCalories(rowId);
};

const debouncedFetchFoodCalories = debounce((rowId) => {
    fetchRowFoodCalories(rowId);
}, 800);

async function fetchRowFoodCalories(rowId) {
    const row = document.getElementById(rowId);
    if (!row) return;

    const foodName = row.querySelector('.food-name').value.trim();
    const caloriesEl = row.querySelector('.food-calories');
    const loadingEl = row.querySelector('.food-loading');

    if (!foodName) {
        caloriesEl.innerText = '0';
        updateFoodJSON();
        calculateTotalFoodCalories();
        return;
    }

    caloriesEl.style.display = 'none';
    loadingEl.style.display = 'inline-block';

    setTimeout(() => {
        let cal = 0;
        const foodStr = foodName.toLowerCase();
        const userQty = parseFloat(row.querySelector('.food-qty').value) || 0;
        const userUnit = row.querySelector('.unit-btn.active').dataset.unit;

        const matchDB = window.calorieDB?.food?.find(item => foodStr.includes(item.name));

        if (matchDB) {
            let dbUnit = matchDB.unit;
            if (dbUnit === "g" || dbUnit === "grams") dbUnit = "gram";
            if (dbUnit === "pieces") dbUnit = "piece";

            if (userUnit === dbUnit || (userUnit === "piece" && dbUnit !== "piece")) {
                cal = matchDB.cals * (userQty / matchDB.qty);
            } else {
                cal = matchDB.cals * userQty;
            }
        } else {
            // Fallback if food not found in DB
            cal = 100 * userQty;
        }

        caloriesEl.innerText = Math.round(cal);
        loadingEl.style.display = 'none';
        caloriesEl.style.display = 'inline-block';
        updateFoodJSON();
        calculateTotalFoodCalories();
    }, 150);
}

function calculateTotalFoodCalories() {
    let total = 0;
    document.querySelectorAll('.food-calories').forEach(el => {
        const cal = parseInt(el.innerText);
        if (!isNaN(cal)) total += cal;
    });

    document.getElementById('total-food-calories-display').innerText = total;
    document.getElementById('total-food-calories').value = total;
}

function updateFoodJSON() {
    const data = [];
    document.querySelectorAll('.meal-rows .exercise-row').forEach(row => {
        data.push({
            meal: row.getAttribute('data-meal'),
            name: row.querySelector('.food-name').value,
            qty: parseFloat(row.querySelector('.food-qty').value) || 0,
            unit: row.querySelector('.unit-btn.active').dataset.unit,
            calories: parseInt(row.querySelector('.food-calories').innerText) || 0
        });
    });
    document.getElementById('food-json').value = JSON.stringify(data);
}
