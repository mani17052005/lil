// ==========================
// Dashboard Logic
// ==========================
const SESSION_KEY = 'ht_session';
const USER_DATA   = 'ht_user_data';

const $ = id => document.getElementById(id);

function getSession() {
  return JSON.parse(localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY) || 'null');
}
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

// --------------------------
// Auth Check
// --------------------------
const session = getSession();
if (!session?.email) {
  location.href = 'index.html';
}
const email = session.email;

// --------------------------
// Load/Save User Data
// --------------------------
function loadUserData() {
  const blob = JSON.parse(localStorage.getItem(USER_DATA) || '{}');
  return blob[email] || { profile: {}, readings: [], suggestions: [] };
}
function saveUserData(data) {
  const blob = JSON.parse(localStorage.getItem(USER_DATA) || '{}');
  blob[email] = data;
  localStorage.setItem(USER_DATA, JSON.stringify(blob));
}

let userData = loadUserData();

// --------------------------
// Profile Panel
// --------------------------
$('profileEmail').textContent = email;
$('profileName').value = userData.profile.name || '';
$('profileAge').value = userData.profile.age || '';
$('profileCondition').value = userData.profile.condition || '';

$('saveProfile').onclick = () => {
  userData.profile = {
    name: $('profileName').value,
    age: $('profileAge').value,
    condition: $('profileCondition').value
  };
  saveUserData(userData);
  alert('✅ Profile saved!');
};

$('logoutBtn').onclick = () => {
  clearSession();
  location.href = 'index.html';
};

$('menuBtn').onclick = () => {
  $('profilePanel').classList.toggle('open');
};

$('themeToggle').onclick = () => {
  document.body.classList.toggle('dark');
};

// --------------------------
// Charts
// --------------------------
const charts = {
  glucose: new Chart($('glucoseChart'), { type: 'line', data: { labels: [], datasets: [{ label:'Glucose (mg/dL)', data: [] }] } }),
  temp:    new Chart($('tempChart'),    { type: 'line', data: { labels: [], datasets: [{ label:'Temp (°C)', data: [] }] } }),
  heart:   new Chart($('heartChart'),   { type: 'line', data: { labels: [], datasets: [{ label:'Heart Rate', data: [] }] } }),
  spo2:    new Chart($('spo2Chart'),    { type: 'line', data: { labels: [], datasets: [{ label:'SpO₂ (%)', data: [] }] } })
};

function addReading() {
  const now = new Date();
  const reading = {
    time: now.toISOString(),
    glucose: Math.floor(80 + Math.random() * 60),
    temp: (36 + Math.random() * 2).toFixed(1),
    heart: Math.floor(60 + Math.random() * 40),
    spo2: Math.floor(95 + Math.random() * 5)
  };

  userData.readings.push(reading);
  if (userData.readings.length > 1000) userData.readings.shift();
  saveUserData(userData);

  updateCharts(reading, now);
  updateHistory();
  updateSuggestions(reading);
}

function updateCharts(r, now) {
  const t = now.toLocaleTimeString();

  function push(chart, val) {
    chart.data.labels.push(t);
    chart.data.datasets[0].data.push(val);
    if (chart.data.labels.length > 30) {
      chart.data.labels.shift();
      chart.data.datasets[0].data.shift();
    }
    chart.update();
  }

  push(charts.glucose, r.glucose);
  push(charts.temp, r.temp);
  push(charts.heart, r.heart);
  push(charts.spo2, r.spo2);
}

function updateHistory() {
  function addItems(id, arr, fn) {
    const el = $(id);
    el.innerHTML = '';
    arr.slice(-6).forEach(r => {
      const li = document.createElement('li');
      li.textContent = fn(r);
      el.appendChild(li);
    });
  }

  addItems('readings-glucose', userData.readings, r => `${new Date(r.time).toLocaleTimeString()} — ${r.glucose} mg/dL`);
  addItems('readings-temp',    userData.readings, r => `${new Date(r.time).toLocaleTimeString()} — ${r.temp} °C`);
  addItems('readings-heart',   userData.readings, r => `${new Date(r.time).toLocaleTimeString()} — ${r.heart} bpm`);
  addItems('readings-spo2',    userData.readings, r => `${new Date(r.time).toLocaleTimeString()} — ${r.spo2} %`);
}

function updateSuggestions(r) {
  const suggestions = [];
  if (r.glucose > 140) suggestions.push('🍵 Drink green tea to lower glucose.');
  if (r.glucose < 90)  suggestions.push('🍚 Eat complex carbs to stabilize glucose.');
  if (r.temp > 37.5)   suggestions.push('💧 Stay hydrated, body temperature high.');
  if (r.heart > 100)   suggestions.push('🧘 Relaxation recommended, heart rate high.');
  if (r.spo2 < 95)     suggestions.push('🌬️ Practice breathing exercises.');

  userData.suggestions = suggestions;
  saveUserData(userData);

  const el = $('suggestions');
  el.innerHTML = '';
  suggestions.forEach(s => {
    const li = document.createElement('li');
    li.textContent = s;
    el.appendChild(li);
  });
}

// --------------------------
// Start Simulation
// --------------------------
setInterval(addReading, 5000);
addReading();
