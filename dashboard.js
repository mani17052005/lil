/* dashboard.js - charts, demo readings, profile, history, CSV, persistence */

const SESSION_KEY = 'ht_session';
const USER_DATA = 'ht_user_data';

const $ = id => document.getElementById(id);

function getSession(){ try { return JSON.parse(localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; } }
function clearSession(){ localStorage.removeItem(SESSION_KEY); sessionStorage.removeItem(SESSION_KEY); }
function loadBlob(){ try { return JSON.parse(localStorage.getItem(USER_DATA) || '{}'); } catch { return {}; } }
function saveBlob(b){ localStorage.setItem(USER_DATA, JSON.stringify(b)); }

const session = getSession();
if(!session?.email) { location.href = 'index.html'; }
const email = session.email;

const blob = loadBlob();
blob[email] = blob[email] || { profile:{}, readings:[], suggestions:[] };
let userData = blob[email];

/* Profile panel */
$('openProfile').onclick = () => { $('profilePanel').classList.add('open'); $('profilePanel').setAttribute('aria-hidden','false'); };
$('closeProfile').onclick = () => { $('profilePanel').classList.remove('open'); $('profilePanel').setAttribute('aria-hidden','true'); };

const pf = {
  name: $('pf_name'), age: $('pf_age'), gender: $('pf_gender'),
  height: $('pf_height'), weight: $('pf_weight'), activity: $('pf_activity'),
  goal: $('pf_goal'), notes: $('pf_notes')
};
function hydrateProfile(){
  const p = userData.profile || {};
  pf.name.value = p.name || '';
  pf.age.value = p.age || '';
  pf.gender.value = p.gender || '';
  pf.height.value = p.height || '';
  pf.weight.value = p.weight || '';
  pf.activity.value = p.activity || '';
  pf.goal.value = p.goal || '';
  pf.notes.value = p.notes || '';
}
function persistProfile(){
  userData.profile = {
    name: pf.name.value.trim(),
    age: +pf.age.value || '',
    gender: pf.gender.value,
    height: +pf.height.value || '',
    weight: +pf.weight.value || '',
    activity: pf.activity.value,
    goal: pf.goal.value.trim(),
    notes: pf.notes.value.trim()
  };
  blob[email] = userData;
  saveBlob(blob);
  showToast('Profile saved.');
}
$('saveProfile').onclick = persistProfile;
$('logoutBtn').onclick = () => { clearSession(); location.href = 'index.html'; };
hydrateProfile();

/* Charts */
const MAX_POINTS = 30;
let labels = [], series = { glucose: [], bpSys: [], bpDia: [], temp: [], heart: [] };

function baseOptions(){
  const textColor = getComputedStyle(document.body).getPropertyValue('--text') || '#fff';
  return {
    responsive:true, animation:false,
    plugins:{ legend:{ labels:{ color:textColor } } },
    scales:{ x:{ ticks:{ color:textColor } }, y:{ ticks:{ color:textColor } } }
  };
}

const charts = {};
charts.glucose = new Chart($('chart-glucose').getContext('2d'), {
  type:'line',
  data:{ labels, datasets:[{ label:'Glucose (mg/dL)', data:series.glucose, borderWidth:2, tension:.32, fill:false }] },
  options: baseOptions()
});
charts.bp = new Chart($('chart-bp').getContext('2d'), {
  type:'line',
  data:{ labels, datasets:[
    { label:'Systolic (mmHg)', data:series.bpSys, borderWidth:2, tension:.32, fill:false },
    { label:'Diastolic (mmHg)', data:series.bpDia, borderWidth:2, tension:.32, fill:false }
  ]}, options: baseOptions()
});
charts.temp = new Chart($('chart-temp').getContext('2d'), {
  type:'line',
  data:{ labels, datasets:[{ label:'Temperature (°C)', data:series.temp, borderWidth:2, tension:.32, fill:false }] },
  options: baseOptions()
});
charts.heart = new Chart($('chart-heart').getContext('2d'), {
  type:'line',
  data:{ labels, datasets:[{ label:'Heart Rate (BPM)', data:series.heart, borderWidth:2, tension:.32, fill:false }] },
  options: baseOptions()
});

/* Status helper */
function statusFor(metric, value){
  if(value === undefined || value === null || isNaN(value)) return {text:'--', cls:''};
  switch(metric){
    case 'glucose':
      if(value < 70) return {text:'Low', cls:'status-warn'};
      if(value > 140) return {text:'High', cls:'status-bad'};
      if(value >= 120) return {text:'Elevated', cls:'status-warn'};
      return {text:'Normal', cls:'status-ok'};
    case 'bpSys':
      if(value < 90) return {text:'Low', cls:'status-warn'};
      if(value > 140) return {text:'High', cls:'status-bad'};
      if(value >= 120) return {text:'Elevated', cls:'status-warn'};
      return {text:'Normal', cls:'status-ok'};
    case 'temp':
      if(value < 36) return {text:'Low', cls:'status-warn'};
      if(value > 38) return {text:'Fever', cls:'status-bad'};
      return {text:'Normal', cls:'status-ok'};
    case 'heart':
      if(value < 60) return {text:'Low', cls:'status-warn'};
      if(value > 100) return {text:'High', cls:'status-bad'};
      return {text:'Normal', cls:'status-ok'};
    default: return {text:'--', cls:''};
  }
}

/* Toasts & suggestions */
function showToast(message, type='normal'){
  const container = $('toastContainer');
  if(!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type==='urgent' ? 'toast-urgent':''}`;
  toast.textContent = message;
  container.appendChild(toast);
  if(type==='urgent'){ const s=$('alertSound'); if(s){ s.currentTime=0; s.play().catch(()=>{}); } }
  setTimeout(()=>{ toast.classList.add('fade-out'); setTimeout(()=>toast.remove(),500); }, 3500);
}
function updateSuggestionsPanel(messages){
  const ul = $('suggestionList'); if(!ul) return;
  ul.innerHTML = '';
  messages.slice(-5).forEach(msg=>{
    const li = document.createElement('li'); li.textContent = msg;
    if(msg.includes('🚨')) li.className = 'sugg-urgent';
    else if(msg.includes('⚠️')) li.className = 'sugg-warning';
    else if(msg.includes('✅')) li.className = 'sugg-good';
    ul.appendChild(li);
    if(msg.includes('🚨')||msg.includes('⚠️')) showToast(msg, 'urgent');
  });
}

/* Readings UI - only latest reading */
function pushReadingLists(){
  const fmt = t => new Date(t).toLocaleString();
  const g = $('readings-glucose'), b = $('readings-bp'), tp = $('readings-temp'), h = $('readings-heart');
  if(!g||!b||!tp||!h) return;

  const latest = userData.readings.at(-1);
  if(!latest){
    g.innerHTML = b.innerHTML = tp.innerHTML = h.innerHTML = '';
    return;
  }

  g.innerHTML = `<li>${fmt(latest.time)} — ${latest.glucose} mg/dL</li>`;
  b.innerHTML = `<li>${fmt(latest.time)} — ${latest.bpSys}/${latest.bpDia} mmHg</li>`;
  tp.innerHTML = `<li>${fmt(latest.time)} — ${latest.temp} °C</li>`;
  h.innerHTML = `<li>${fmt(latest.time)} — ${latest.heart} BPM</li>`;
}

/* Status pills */
function setStatusPills(){
  const g = series.glucose.at(-1), s = series.bpSys.at(-1), d = series.bpDia.at(-1), t = series.temp.at(-1), h = series.heart.at(-1);
  const stG = statusFor('glucose', g); $('status-glucose').textContent = stG.text; $('status-glucose').className = `pill ${stG.cls}`;
  const stB = statusFor('bpSys', s); $('status-bp').textContent = stB.text; $('status-bp').className = `pill ${stB.cls}`;
  const stT = statusFor('temp', t); $('status-temp').textContent = stT.text; $('status-temp').className = `pill ${stT.cls}`;
  const stH = statusFor('heart', h); $('status-heart').textContent = stH.text; $('status-heart').className = `pill ${stH.cls}`;
}

/* History */
function renderHistory(){
  const log = $('historyLog'); if(!log) return;
  log.innerHTML = '';
  if(!userData.readings.length){ log.innerHTML = '<p>No readings yet.</p>'; return; }
  userData.readings.slice().reverse().forEach(r=>{
    const div = document.createElement('div'); div.className = 'history-item';
    div.innerHTML = `<div class="history-time">📅 ${new Date(r.time).toLocaleString()}</div>
      <div class="history-data">Glucose: <strong>${r.glucose}</strong> mg/dL | BP: <strong>${r.bpSys}/${r.bpDia}</strong> mmHg | Temp: <strong>${r.temp}</strong> °C | Heart: <strong>${r.heart}</strong> BPM</div>`;
    log.appendChild(div);
  });
}

/* Alerts */
function checkAlerts(){
  const g = series.glucose.at(-1), s = series.bpSys.at(-1), d = series.bpDia.at(-1), t = series.temp.at(-1), h = series.heart.at(-1);
  if(g > 180) showToast(`Glucose very high (${g} mg/dL).`, 'urgent');
  if(s > 160 || d > 100) showToast(`BP very high (${s}/${d} mmHg).`, 'urgent');
  if(t >= 39) showToast(`High fever (${t} °C).`, 'urgent');
  if(h > 130) showToast(`Heart rate elevated (${h} BPM).`, 'urgent');
}

/* Suggestions logic */
function generateSuggestions(){
  const latest = { glucose: series.glucose.at(-1), bpSys: series.bpSys.at(-1), bpDia: series.bpDia.at(-1), temp: series.temp.at(-1), heart: series.heart.at(-1) };
  const messages = [];
  if(latest.glucose > 140){ messages.push("⚠️ High glucose: hydrate, light walk, review carbs."); if(series.glucose.slice(-3).every(v=>v>140)) messages.push("🚨 Several high glucose readings — consider contacting clinician."); }
  else if(latest.glucose < 70) messages.push("⚠️ Low glucose: take 15g fast-acting carbs and recheck in 15 min.");
  else messages.push("✅ Glucose within target range.");

  if(latest.bpSys > 140 || latest.bpDia > 90) messages.push("⚠️ High BP: relax, reduce salt, deep breathing."); else messages.push("✅ Blood pressure looks fine.");
  if(latest.temp > 38) messages.push("🤒 Fever: rest, hydrate, antipyretic as advised."); else messages.push("✅ Temperature is normal.");
  if(latest.heart > 100) messages.push("⚠️ Elevated heart rate: rest and avoid stimulants."); else messages.push("✅ Heart rate in range.");

  if(series.glucose.length > 1 && Math.abs(series.glucose.at(-1)-series.glucose.at(-2))>40) messages.push("⚠️ Rapid glucose swing detected — review recent meals/insulin/activity.");

  const allGood = latest.glucose>=90 && latest.glucose<=120 && latest.bpSys>=100 && latest.bpSys<=130 && latest.temp>=36 && latest.temp<=37.5 && latest.heart>=60 && latest.heart<=90;
  if(allGood) messages.push("✅ All readings stable — keep it up!");
  return messages;
}

/* Data feed */
function addPoint(label,g,s,d,t,h){
  labels.push(label); if(labels.length>MAX_POINTS) labels.shift();
  series.glucose.push(g); if(series.glucose.length>MAX_POINTS) series.glucose.shift();
  series.bpSys.push(s); if(series.bpSys.length>MAX_POINTS) series.bpSys.shift();
  series.bpDia.push(d); if(series.bpDia.length>MAX_POINTS) series.bpDia.shift();
  series.temp.push(t); if(series.temp.length>MAX_POINTS) series.temp.shift();
  series.heart.push(h); if(series.heart.length>MAX_POINTS) series.heart.shift();
}
function renderAll(){
  charts.glucose.update(); charts.bp.update(); charts.temp.update(); charts.heart.update();
  setStatusPills(); pushReadingLists(); renderHistory();
}

/* tick - simulated readings */
function tick(){
  const now = new Date();
  const label = now.toLocaleTimeString();
  const latest = {
    glucose: Math.floor(85 + Math.random()*80),
    bpSys: Math.floor(105 + Math.random()*40),
    bpDia: Math.floor(65 + Math.random()*25),
    temp: +(36 + Math.random()*2.8).toFixed(1),
    heart: Math.floor(55 + Math.random()*65)
  };

  addPoint(label, latest.glucose, latest.bpSys, latest.bpDia, latest.temp, latest.heart);

  userData.readings.push({ time: now.toISOString(), ...latest });
  if(userData.readings.length > 1000) userData.readings.shift();

  const sugg = generateSuggestions();
  userData.suggestions.push({ time: now.toISOString(), text: sugg });
  if(userData.suggestions.length > 400) userData.suggestions.shift();

  blob[email] = userData;
  saveBlob(blob);

  updateSuggestionsPanel(sugg);
  checkAlerts();
  renderAll();
}

/* Seed initial points */
(function seed(){
  for(let i=5;i>0;i--){
    const t = new Date(Date.now() - i*60000).toLocaleTimeString();
    addPoint(t, Math.floor(95+Math.random()*40), Math.floor(110+Math.random()*20), Math.floor(70+Math.random()*12), +(36+Math.random()*1.2).toFixed(1), Math.floor(60+Math.random()*30));
  }
  const initS = generateSuggestions();
  updateSuggestionsPanel(initS);
  renderAll();
})();
const intervalId = setInterval(tick, 5000);

/* CSV export & clear history */
$('downloadCsvBtn').onclick = () => {
  if(!userData.readings.length){ alert('No history to export.'); return; }
  const rows = [['Time','Glucose (mg/dL)','BP Systolic','BP Diastolic','Temperature (°C)','Heart Rate (BPM)']];
  userData.readings.forEach(r => rows.push([r.time, r.glucose, r.bpSys, r.bpDia, r.temp, r.heart]));
  const csv = rows.map(r => r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');
  const blobFile = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blobFile);
  const a = document.createElement('a'); a.href = url; a.download = `Health_History_${(userData.profile?.name||'user')}.csv`; a.click();
  URL.revokeObjectURL(url);
};

$('clearHistoryBtn').onclick = () => {
  if(!confirm('Clear all saved history? This cannot be undone.')) return;
  userData.readings = []; blob[email] = userData; saveBlob(blob);
  renderHistory(); pushReadingLists();
  showToast('History cleared.');
};

/* Theme toggle */
$('themeBtn').onclick = () => {
  document.body.classList.toggle('light');
  Object.values(charts).forEach(ch=>ch.update());
};
