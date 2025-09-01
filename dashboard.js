/***** ===========================
 *  Health Tracker — dashboard.js
 *  =========================== */

/* ---------- Keys ---------- */
const SESSION_KEY     = 'ht_session';
const USERS_DATA_KEY  = 'ht_user_data';
const PROFILE_KEY     = 'ht_user_profiles';

/* ---------- Session / Auth ---------- */
const getSession = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY)||'null'); } catch { return null; } };
const logout = () => { localStorage.removeItem(SESSION_KEY); location.href='index.html'; };

const session = getSession();
if(!session || !session.email){ location.href = 'index.html'; }

/* ---------- DOM helpers ---------- */
const $ = (id) => document.getElementById(id);

/* ---------- UI Wiring ---------- */
$('welcome').textContent = `Your Health Dashboard — ${session.email}`;
$('logoutBtn').onclick = logout;
$('modeBtn').onclick = () => {
  document.body.classList.toggle('light');
  if (window.metricChart) window.metricChart.update();
};

/* ---------- Profiles ---------- */
function loadProfiles(){ try{ return JSON.parse(localStorage.getItem(PROFILE_KEY)||'{}'); }catch{ return {}; } }
function saveProfiles(blob){ localStorage.setItem(PROFILE_KEY, JSON.stringify(blob)); }
function getProfile(email){
  const all = loadProfiles();
  if(!all[email]){
    // safety default
    all[email] = { email, name: email.split('@')[0], avatar:'😀', units:'mgdl', theme:'dark', goals:{dailyReadings:10} };
    saveProfiles(all);
  }
  return all[email];
}
function putProfile(email, prof){
  const all = loadProfiles();
  all[email] = { ...all[email], ...prof, updatedAt: new Date().toISOString() };
  saveProfiles(all);
}
let profile = getProfile(session.email);

// apply theme from profile
if (profile.theme === 'light') document.body.classList.add('light');

// top-left chip
$('profileAvatar').textContent = profile.avatar || '😀';
$('profileName').textContent   = profile.name || session.email.split('@')[0];

// drawer bindings
const drawer = $('profileDrawer');
$('profileBtn').onclick    = () => drawer.classList.add('open');
$('closeProfile').onclick  = () => drawer.classList.remove('open');

// populate profile form
$('p_name').value  = profile.name || '';
$('p_avatar').value= profile.avatar || '😀';
$('p_units').value = profile.units || 'mgdl';
$('p_theme').value = profile.theme || 'dark';
$('p_goal_daily_readings').value = (profile.goals?.dailyReadings ?? 10);

// save profile
$('saveProfile').onclick = ()=>{
  const updated = {
    name: $('p_name').value.trim() || session.email.split('@')[0],
    avatar: $('p_avatar').value.trim() || '😀',
    units: $('p_units').value,
    theme: $('p_theme').value,
    goals: { dailyReadings: Math.max(1, +$('p_goal_daily_readings').value || 10) }
  };
  putProfile(session.email, updated);
  profile = getProfile(session.email);
  $('profileAvatar').textContent = profile.avatar;
  $('profileName').textContent   = profile.name;
  if(profile.theme === 'light') document.body.classList.add('light'); else document.body.classList.remove('light');
  alert('Profile saved.');
};

// reset goals
$('resetGoals').onclick = ()=>{
  putProfile(session.email, { goals:{ dailyReadings: 10 } });
  profile = getProfile(session.email);
  $('p_goal_daily_readings').value = profile.goals.dailyReadings;
};

// FAQ accordion
document.querySelectorAll('.faq-q').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    btn.classList.toggle('open');
    const ans = btn.nextElementSibling;
    ans.style.maxHeight = ans.style.maxHeight ? null : ans.scrollHeight + "px";
  });
});

/* ---------- Per-user Data ---------- */
function loadUserBlob(){ try { return JSON.parse(localStorage.getItem(USERS_DATA_KEY) || '{}'); } catch { return {}; } }
function saveUserBlob(blob){ localStorage.setItem(USERS_DATA_KEY, JSON.stringify(blob)); }
function loadUserData(email){
  const blob = loadUserBlob();
  return blob[email] || { readings: [] };
}
function saveUserData(email, data){
  const blob = loadUserBlob();
  blob[email] = data;
  saveUserBlob(blob);
}
let userData = loadUserData(session.email);

/* ---------- Streaks & Achievements ---------- */
function computeStreakDays(readings){
  if (!readings.length) return 0;
  // build a Set of yyyy-mm-dd that have at least one reading
  const days = new Set(readings.map(r => new Date(r.time).toISOString().slice(0,10)));
  let d = new Date(); d.setHours(0,0,0,0);
  let streak = 0;
  while(true){
    const key = new Date(d.getTime() - streak*86400000).toISOString().slice(0,10);
    if (days.has(key)) streak++;
    else break;
  }
  return streak;
}
function calcAchievements(readings, streak){
  const list = [];
  if (streak >= 3) list.push('🔥 3-day streak');
  if (streak >= 7) list.push('🏆 7-day streak');
  if (readings.length >= 100) list.push('📈 100+ total readings');
  // Stable glucose last 10 points (within 20 mg/dL)
  if (readings.length >= 10){
    const last10 = readings.slice(-10).map(r=>r.glucose);
    const spread = Math.max(...last10) - Math.min(...last10);
    if (spread <= 20) list.push('🛡️ Stable glucose (last 10)');
  }
  return list;
}
function refreshProfileStats(){
  const total = userData.readings.length;
  const streak = computeStreakDays(userData.readings);
  $('streakDays').textContent = `${streak} day${streak===1?'':'s'}`;
  $('totalReadings').textContent = total;
  const ach = calcAchievements(userData.readings, streak);
  const ul = $('achList');
  ul.innerHTML = ach.length ? ach.map(a=>`<li>${a}</li>`).join('') : '<li>—</li>';
}
refreshProfileStats();

/* ---------- Live Series & Labels ---------- */
let labels = []; // time labels like "10:42:01 AM"
const MAX_POINTS = 30; // chart window

let series = { glucose: [], bpSys: [], bpDia: [], temp: [], heart: [] };
let activeTab = 'glucose';

/* ---------- Chart ---------- */
const ctx = $('metricChart').getContext('2d');
const chartOptions = () => ({
  responsive: true,
  animation: false,
  plugins:{ legend:{ labels:{ color: getComputedStyle(document.body).getPropertyValue('--text') || '#fff' } } },
  scales:{
    x:{ ticks:{ color: getComputedStyle(document.body).getPropertyValue('--text') || '#fff' } },
    y:{ ticks:{ color: getComputedStyle(document.body).getPropertyValue('--text') || '#fff' } }
  }
});

let metricChart = new Chart(ctx, {
  type: 'line',
  data: { labels, datasets: [] },
  options: chartOptions()
});
window.metricChart = metricChart;

/* ---------- Status Helper ---------- */
function statusFor(metric, value){
  switch(metric){
    case 'glucose':
      if(value < 70)  return {text:'Low', cls:'status-bad'};
      if(value > 140) return {text:'High', cls:'status-bad'};
      if(value >= 120) return {text:'Elevated', cls:'status-warn'};
      return {text:'Normal', cls:'status-ok'};
    case 'bpSys':
      if(value < 90)   return {text:'Low', cls:'status-warn'};
      if(value > 140)  return {text:'High', cls:'status-bad'};
      if(value >= 120) return {text:'Elevated', cls:'status-warn'};
      return {text:'Normal', cls:'status-ok'};
    case 'temp':
      if(value < 36)   return {text:'Low', cls:'status-warn'};
      if(value > 38)   return {text:'Fever', cls:'status-bad'};
      return {text:'Normal', cls:'status-ok'};
    case 'heart':
      if(value < 60)   return {text:'Low', cls:'status-warn'};
      if(value > 100)  return {text:'High', cls:'status-bad'};
      return {text:'Normal', cls:'status-ok'};
  }
}

/* ---------- Tabs ---------- */
function setActiveTab(tab){
  activeTab = tab;
  document.querySelectorAll('.tab').forEach(btn => btn.classList.toggle('active', btn.dataset.tab===tab));

  const history = $('historySection');
  if (history) history.style.display = (tab === 'history') ? 'block' : 'none';

  if (tab === 'history') renderHistory();
  else render();
}
window.setActiveTab = setActiveTab;

/* ---------- Toasts ---------- */
function showToast(message, type="normal") {
  const container = $('toastContainer'); if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  if(type === "urgent"){
    const sound = $('alertSound'); if (sound) { sound.currentTime = 0; sound.play().catch(()=>{}); }
  }
  setTimeout(() => {
    toast.classList.add("fade-out");
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}

/* ---------- Render (cards + chart) ---------- */
function render(){
  const title = $('metricTitle');
  const valueEl = $('metricValue');
  const statusEl = $('metricStatus');
  const chartTitle = $('chartTitle');

  // convert glucose if needed for display
  const convG = (v) => profile.units === 'mmol' ? (v/18).toFixed(1) : v;
  const gLabel = profile.units === 'mmol' ? 'mmol/L' : 'mg/dL';

  if(activeTab==='glucose'){
    const v = series.glucose.at(-1) ?? 0;
    title.textContent = 'Glucose';
    valueEl.textContent = `${convG(v)} ${gLabel}`;
    const s = statusFor('glucose', v);
    statusEl.textContent = s.text; statusEl.className = `metric-status ${s.cls}`;
    chartTitle.textContent = 'Glucose Trend';
    metricChart.data.labels = labels;
    metricChart.data.datasets = [
      { label:`Glucose (${gLabel})`, data: series.glucose.map(x => profile.units==='mmol' ? (x/18).toFixed(1) : x), borderColor:'#ffffff', borderWidth:2, tension:.32, fill:false }
    ];
  }
  if(activeTab==='bp'){
    const sVal = series.bpSys.at(-1) ?? 0, dVal = series.bpDia.at(-1) ?? 0;
    title.textContent = 'Blood Pressure';
    valueEl.textContent = `${sVal}/${dVal} mmHg`;
    const st = statusFor('bpSys', sVal);
    statusEl.textContent = st.text; statusEl.className = `metric-status ${st.cls}`;
    chartTitle.textContent = 'Blood Pressure Trend';
    metricChart.data.labels = labels;
    metricChart.data.datasets = [
      { label:'Systolic',  data:series.bpSys, borderColor:'#ff4b5c', borderWidth:2, tension:.32, fill:false },
      { label:'Diastolic', data:series.bpDia, borderColor:'#65d2ff', borderWidth:2, tension:.32, fill:false }
    ];
  }
  if(activeTab==='temp'){
    const t = series.temp.at(-1) ?? 0;
    title.textContent = 'Body Temperature';
    valueEl.textContent = `${t?.toFixed ? t.toFixed(1) : t} °C`;
    const st = statusFor('temp', t);
    statusEl.textContent = st.text; statusEl.className = `metric-status ${st.cls}`;
    chartTitle.textContent = 'Temperature Trend';
    metricChart.data.labels = labels;
    metricChart.data.datasets = [
      { label:'Temperature (°C)', data:series.temp, borderColor:'#ffd166', borderWidth:2, tension:.32, fill:false }
    ];
  }
  if(activeTab==='heart'){
    const h = series.heart.at(-1) ?? 0;
    title.textContent = 'Heart Rate';
    valueEl.textContent = `${h} BPM`;
    const st = statusFor('heart', h);
    statusEl.textContent = st.text; statusEl.className = `metric-status ${st.cls}`;
    chartTitle.textContent = 'Heart Rate Trend';
    metricChart.data.labels = labels;
    metricChart.data.datasets = [
      { label:'Heart Rate (BPM)', data:series.heart, borderColor:'#00ffb3', borderWidth:2, tension:.32, fill:false }
    ];
  }

  // mini-cards
  const gLast = series.glucose.at(-1), sLast = series.bpSys.at(-1), dLast = series.bpDia.at(-1),
        tLast = series.temp.at(-1),     hLast = series.heart.at(-1);
  $('mini-glucose').textContent = gLast != null ? `${convG(gLast)} ${gLabel}` : '--';
  $('mini-bp').textContent      = (sLast != null && dLast != null) ? `${sLast}/${dLast}` : '--/--';
  $('mini-temp').textContent    = tLast != null ? `${(+tLast).toFixed(1)} °C` : '--';
  $('mini-heart').textContent   = hLast != null ? `${hLast} BPM` : '--';

  metricChart.options = chartOptions(); // refresh label colors for light/dark
  metricChart.update();
}

/* ---------- History (no AI suggestions) ---------- */
// small helper to compute trend text for a tiny window (last 3 deltas)
function trendOf(arr){
  if (arr.length < 3) return '—';
  const last3 = arr.slice(-3);
  const d1 = last3[1] - last3[0];
  const d2 = last3[2] - last3[1];
  const slope = (d1 + d2)/2;
  if (slope > 1.5) return 'up';
  if (slope < -1.5) return 'down';
  return 'flat';
}
function addHistItem(ul, time, value, unit, trend){
  const li = document.createElement('li');
  const badge =
    trend === 'up' ? '<span class="trend up">↑</span>' :
    trend === 'down' ? '<span class="trend down">↓</span>' :
    '<span class="trend flat">→</span>';
  li.innerHTML = `<span class="time">${new Date(time).toLocaleString()}</span>
                  <span class="val">${value} ${unit}</span> ${badge}`;
  ul.appendChild(li);
}
function renderHistory(){
  const hG = $('hist-glucose'), hB = $('hist-bp'), hT = $('hist-temp'), hH = $('hist-heart');
  hG.innerHTML = ''; hB.innerHTML = ''; hT.innerHTML = ''; hH.innerHTML = '';

  const gUnit = profile.units === 'mmol' ? 'mmol/L' : 'mg/dL';

  const recent = userData.readings.slice(-150); // cap to keep DOM light
  recent.forEach((r, idx) => {
    // compute rolling trend using the same in-memory series (when on page) OR rebuild quickly
    const upTo = userData.readings.slice(0, userData.readings.indexOf(r)+1);
    const gArr = upTo.map(x=>x.glucose);
    const sArr = upTo.map(x=>x.bpSys);
    const dArr = upTo.map(x=>x.bpDia);
    const tArr = upTo.map(x=>x.temp);
    const hArr = upTo.map(x=>x.heart);

    const gVal = profile.units==='mmol' ? (r.glucose/18).toFixed(1) : r.glucose;
    addHistItem(hG, r.time, gVal, gUnit, trendOf(gArr));
    addHistItem(hB, r.time, `${r.bpSys}/${r.bpDia}`, 'mmHg', trendOf(sArr.map((v,i)=>v + (dArr[i]||0)/3))); // simple combined slope
    addHistItem(hT, r.time, (+r.temp).toFixed(1), '°C', trendOf(tArr));
    addHistItem(hH, r.time, r.heart, 'BPM', trendOf(hArr));
  });
}

/* CSV Export (History only, no AI suggestions) */
function downloadCSV(){
  if (!userData.readings.length) { alert("No history to export."); return; }
  const rows = [
    ["Time","Glucose (mg/dL)","BP Systolic","BP Diastolic","Temperature (°C)","Heart Rate (BPM)"]
  ];
  userData.readings.forEach(r=>{
    rows.push([
      new Date(r.time).toLocaleString(),
      r.glucose, r.bpSys, r.bpDia, r.temp, r.heart
    ]);
  });
  const csv = rows.map(row => row.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `Health_History_${session.email}.csv`; a.click();
  URL.revokeObjectURL(url);
}
$('downloadCsvBtn').onclick = downloadCSV;

/* ---------- Live Data Generator ---------- */
function addPoint(label, g,s,d,t,h){
  labels.push(label); if(labels.length > MAX_POINTS) labels.shift();

  series.glucose.push(g); if(series.glucose.length > MAX_POINTS) series.glucose.shift();
  series.bpSys.push(s);   if(series.bpSys.length > MAX_POINTS)   series.bpSys.shift();
  series.bpDia.push(d);   if(series.bpDia.length > MAX_POINTS)   series.bpDia.shift();
  series.temp.push(t);    if(series.temp.length > MAX_POINTS)    series.temp.shift();
  series.heart.push(h);   if(series.heart.length > MAX_POINTS)   series.heart.shift();
}

function tick(){
  const now = new Date();
  const timeLabel = now.toLocaleTimeString();

  const latest = {
    glucose: Math.floor(85 + Math.random()*80),     // 85–165
    bpSys:   Math.floor(105 + Math.random()*40),    // 105–145
    bpDia:   Math.floor(65 + Math.random()*25),     // 65–90
    temp:    +(36 + Math.random()*2.8).toFixed(1),  // 36.0–38.8
    heart:   Math.floor(55 + Math.random()*65)      // 55–120
  };

  addPoint(timeLabel, latest.glucose, latest.bpSys, latest.bpDia, latest.temp, latest.heart);

  // Persist (no suggestions written to history)
  userData.readings.push({ time: now.toISOString(), ...latest });
  if(userData.readings.length > 1000) userData.readings.shift();
  saveUserData(session.email, userData);

  // update profile stats (streaks/achievements)
  refreshProfileStats();

  render();
}

/* ---------- Bootstrap ---------- */
setActiveTab('glucose');   // default tab
// seed starting points
(function seed(){
  for(let i=5;i>0;i--){
    const t = new Date(Date.now() - i*60000);
    const timeLabel = t.toLocaleTimeString();
    addPoint(
      timeLabel,
      Math.floor(95 + Math.random()*40),
      Math.floor(110 + Math.random()*20),
      Math.floor(70 + Math.random()*12),
      +(36 + Math.random()*1.2).toFixed(1),
      Math.floor(60 + Math.random()*30)
    );
    // persist seed too for history/streaks
    userData.readings.push({ time: new Date(t).toISOString(),
      glucose: series.glucose.at(-1),
      bpSys: series.bpSys.at(-1),
      bpDia: series.bpDia.at(-1),
      temp: series.temp.at(-1),
      heart: series.heart.at(-1)
    });
  }
  saveUserData(session.email, userData);
  render();
})();
setInterval(tick, 1000); // update every second
