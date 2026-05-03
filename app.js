// Configuration: REPLACE THIS URL WITH YOUR GOOGLE APPS SCRIPT WEB APP URL
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzbA6eGnm96-MXDTjTC5CHQm46STh2i7SvyNrM7ZlKTEuSHyq4Zcfj0xsfL8RxJe76xkQ/exec";

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('date').valueAsDate = new Date();

    const currentMonthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    document.getElementById('current-month-display').innerText = currentMonthName;

    const inputs = document.querySelectorAll('#habit-form input, #habit-form select');
    inputs.forEach(input => {
        input.addEventListener('change', calculateLivePoints);
        input.addEventListener('input', calculateLivePoints);
    });

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
    document.getElementById('input-view').style.display = 'block';

    document.getElementById('welcome-message').innerText = `Welcome ${user}`;
    document.getElementById('user-name').value = user;

    const submitBtn = document.getElementById('submit-btn');
    if (user === 'Deepak') {
        submitBtn.style.background = 'var(--deepak-color)';
        submitBtn.style.boxShadow = '0 4px 15px var(--deepak-glow)';
    } else {
        submitBtn.style.background = 'var(--shalini-color)';
        submitBtn.style.boxShadow = '0 4px 15px var(--shalini-glow)';
    }

    // Auto-scroll to top for mobile
    window.scrollTo(0, 0);
    calculateLivePoints();
}

function openDashboard() {
    document.getElementById('input-view').style.display = 'none';
    document.getElementById('success-view').style.display = 'none';
    document.getElementById('dashboard-view').style.display = 'block';
    document.getElementById('submit-status').innerText = "";
    window.scrollTo(0, 0);
    if (WEB_APP_URL !== "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE") {
        fetchDashboardData();
    }
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

    // Logic: 7hr = max points (+3). 6 or 8 = decreased points (+2). <5 or >9 = (-1)
    if (sleepHrs >= 6.5 && sleepHrs <= 7.5) { points += 3; breakdown.push("Optimal Sleep 7h (+3)"); }
    else if ((sleepHrs >= 5.5 && sleepHrs < 6.5) || (sleepHrs > 7.5 && sleepHrs <= 8.5)) { points += 2; breakdown.push(`Good Sleep ${sleepHrs.toFixed(1)}h (+2)`); }
    else if (sleepHrs >= 5 && sleepHrs < 5.5) { points += 1; breakdown.push("Sleep 5h (+1)"); }
    else if (sleepHrs > 0 && sleepHrs < 5) { points -= 1; breakdown.push("Poor Sleep <5h (-1)"); }

    // --- 2. Productivity / Study ---
    const studyHours = parseFloat(document.getElementById('study-hours').value) || 0;
    if (studyHours >= 3) { points += 4; breakdown.push("Study 3h+ (+4)"); }
    else if (studyHours >= 2) { points += 2.5; breakdown.push("Study 2h+ (+2.5)"); }
    else if (studyHours > 0) { points += studyHours; breakdown.push(`Study (${studyHours.toFixed(1)})`); } // Linear scaling

    // --- 3. Health & Fitness ---
    const exMins = parseInt(document.getElementById('exercise-minutes').value) || 0;
    const exType = document.getElementById('exercise-type').value;

    if (exMins >= 45) { points += 3; breakdown.push("Exercise 45m+ (+3)"); }
    else if (exMins >= 30) { points += 2; breakdown.push("Exercise 30m+ (+2)"); }
    else if (exMins >= 20) { points += 1; breakdown.push("Exercise 20m+ (+1)"); }
    else if (exMins >= 10) { points += 0.5; breakdown.push("Exercise 10m+ (+0.5)"); }

    if (exType === 'Outdoor' && exMins > 0) { points += 0.5; breakdown.push("Outdoor Bonus (+0.5)"); }

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
    if (phone > 0 && phone <= 2) { points += 3; breakdown.push("Phone <=2h (+3)"); }
    else if (phone > 2 && phone <= 4) { points += 1; breakdown.push("Phone 3-4h (+1)"); }
    else if (phone >= 5) { points -= 2; breakdown.push("Phone 5h+ (-2)"); }

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

        exerciseType: formData.get('exercise-type'),
        exerciseMins: formData.get('exercise-minutes'),
        steps: formData.get('steps'),
        calories: formData.get('calories'),
        stretching: formData.get('stretching'),
        sunlight: formData.get('sunlight'),

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
