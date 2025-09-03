/***** ===========================
 *  Health Tracker — dashboard.js
 *  =========================== */

/* ---------- Session / Auth ---------- */
const SESSION_KEY = 'ht_session';
const getSession = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY)||'null'); } catch { return null; } };
const session = getSession();
if(!session || !session.email){ location.href = 'index.html'; }

/* ---------- Quick DOM ---------- */
const $ = (id) => document.getElementById(id);

/* ---------- Theme ---------- */
const themeBtn = $('themeBtn');
themeBtn.onclick = () => {
  document.body.classList.toggle('light');
  // update chart fonts if any
  Object.values(charts).forEach(ch => ch.update());
};

/* ---------- Profile Panel ---------- */
const openProfile = $('openProfile');
const closeProfile = $('closeProfile');
const profilePanel = $('profilePanel');

openProfile.onclick = () => profilePanel.classList.add('open');
closeProfile.onclick = () => profilePanel.classList.remove('open');

const USERS_DATA_KEY = 'ht_user_data';
function loadBlob(){ try { return JSON.parse(localStorage.getItem(USERS_DATA_KEY) || '{}'); } catch { return {}; } }
function saveBlob(b){ localStorage.setItem(USERS_DATA_KEY, JSON.stringify(b)); }
function loadUserData(email){
  const blob = loadBlob();
  return blob[email] || { profile:{}, readings:[], suggestions:[] };
}
function saveUserData(email, data){
  const blob = loadBlob();
  blob[email] = data;
  saveBlob(blob);
}
let userData = loadUserData(session.email);

// Profile fields
const pf = {
  name: $('pf_name'),
  age: $('pf_age'),
  gender: $('pf_gender'),
  height: $('pf_height'),
  weight: $('pf_weight'),
  activity: $('pf_activity'),
  goal: $('pf_goal'),
  notes: $('pf_notes')
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
  saveUserData(session.email, userData);
  showToast('Profile saved.');
}
$('saveProfile').onclick = persistProfile;
$('logoutBtn').onclick = () => { localStorage.removeItem(SESSION_KEY); location.href='index.html'; };
hydrateProfile();

/* ---------- Live Series & Labels ---------- */
const MAX_POINTS = 30;
let labels = [];
let series = {
  glucose: [],
  bpSys:   [],
  bpDia:   [],
  temp:    [],
  heart:   []
};

/* ---------- Charts (separate per metric) ---------- */
const charts = {};
function baseOptions() {
  const textColor = getComputedStyle(document.body).getPropertyValue('--text') || '#fff';
  return {
    responsive: true,
    animation: false,
    plugins:{ legend:{ labels:{ color: textColor } } },
    scales:{
      x:{ ticks:{ color: textColor } },
      y:{ ticks:{ color: textColor } }
    }
  };
}
charts.glucose = new Chart($('chart-glucose').getContext('2d'), {
  type: 'line',
  data: { labels, datasets: [{ label:'Glucose (mg/dL)', data:series.glucose, borderWidth:2, tension:.32, fill:false, borderColor:'#7c5cff' }] },
  options: baseOptions()
});
charts.bp = new Chart($('chart-bp').getContext('2d'), {
  type: 'line',
  data: { labels, datasets: [
    { label:'Systolic (mmHg)',  data:series.bpSys, borderWidth:2, tension:.32, fill:false, borderColor:'#ff5467' },
    { label:'Diastolic (mmHg)', data:series.bpDia, borderWidth:2, tension:.32, fill:false, borderColor:'#2ec6ff' }
  ]},
  options: baseOptions()
});
charts.temp = new Chart($('chart-temp').getContext('2d'), {
  type: 'line',
  data: { labels, datasets: [{ label:'Temperature (°C)', data:series.temp, borderWidth:2, tension:.32, fill:false, borderColor:'#ffd166' }] },
  options: baseOptions()
});
charts.heart = new Chart($('chart-heart').getContext('2d'), {
  type: 'line',
  data: { labels, datasets: [{ label:'Heart Rate (BPM)', data:series.heart, borderWidth:2, tension:.32, fill:false, borderColor:'#27d980' }] },
  options: baseOptions()
});

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

/* ---------- AI Suggestions (trend-aware) ---------- */
function generateSuggestions(){
  const latest = {
    glucose: series.glucose.at(-1),
    bpSys:   series.bpSys.at(-1),
    bpDia:   series.bpDia.at(-1),
    temp:    series.temp.at(-1),
    heart:   series.heart.at(-1)
  };

  let messages = [];

  // Glucose
  if(latest.glucose > 140){
    messages.push("⚠️ High glucose: hydrate, take a light walk, review carb intake.");
    if(series.glucose.slice(-3).every(v => v > 140)){
      messages.push("🚨 Glucose high across several readings. Please contact your clinician.");
    }
  } else if(latest.glucose < 70){
    messages.push("⚠️ Low glucose: take 15g fast-acting carbs (juice/tablets) and recheck in 15 min.");
  } else {
    messages.push("✅ Glucose within target range (great!).");
  }

  // BP
  if(latest.bpSys > 140 || latest.bpDia > 90){
    messages.push("⚠️ High BP: reduce salt, practice slow breathing (4-7-8), and relax.");
  } else if(latest.bpSys < 90 || latest.bpDia < 60){
    messages.push("⚠️ Low BP: hydrate and sit/lie down if dizzy.");
  } else {
    messages.push("✅ Blood pressure looks fine.");
  }

  // Temperature
  if(latest.temp > 38){
    messages.push("🤒 Fever: rest, hydrate, use antipyretic as advised, and monitor symptoms.");
  } else if(latest.temp < 36){
    messages.push("⚠️ Low body temperature: keep warm and recheck.");
  } else {
    messages.push("✅ Temperature is normal.");
  }

  // Heart
  if(latest.heart > 100){
    messages.push("⚠️ Elevated heart rate: sit down, try box breathing, avoid caffeine.");
  } else if(latest.heart < 60){
    messages.push("⚠️ Low heart rate: if symptomatic (dizzy/weak), contact your doctor.");
  } else {
    messages.push("✅ Heart rate in a healthy range.");
  }

  // Rapid glucose swing
  if(series.glucose.length > 1 && Math.abs(series.glucose.at(-1) - series.glucose.at(-2)) > 40){
    messages.push("⚠️ Rapid glucose change detected. Review recent meals, insulin, or activity.");
  }

  // All-good badge
  const allGood =
    latest.glucose >= 90 && latest.glucose <= 120 &&
    latest.bpSys   >= 100 && latest.bpSys   <= 130 &&
    latest.temp    >= 36  && latest.temp    <= 37.5 &&
    latest.heart   >= 60  && latest.heart   <= 90;
  if(allGood) messages.push("✅ All readings stable — keep up the good routine!");

  return messages;
}

/* ---------- Suggestions Panel + Toasts ---------- */
function showToast(message, type="normal") {
  const container = $('toastContainer');
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  // Sound for urgent
  if(type === "urgent"){
    const sound = $('alertSound');
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(()=>{ /* autoplay may be blocked */ });
    }
  }

  setTimeout(() => {
    toast.classList.add("fade-out");
    setTimeout(() => toast.remove(), 500);
  }, 4000);
}

function updateSuggestionsPanel(messages){
  const ul = $('suggestionList');
  if(!ul) return;
  ul.innerHTML = "";
  messages.slice(-4).forEach(msg => {
    const li = document.createElement("li");
    li.textContent = msg;

    if (msg.includes("🚨")) {
      li.className = "sugg-urgent";
      showToast(msg, "urgent");
    } else if (msg.includes("⚠️") || msg.includes("Fever")) {
      li.className = "sugg-warning";
    } else if (msg.includes("✅")) {
      li.className = "sugg-good";
    } else {
      li.className = "sugg-normal";
    }
    ul.appendChild(li);
  });
}

/* ---------- Readings UI (beside each chart) ---------- */
function pushReadingLists(){
  const addItems = (id, arr, unitFmt) => {
    const ul = $(id);
    ul.innerHTML = (arr.slice(-6).toReversed())
      .map(v => `<li>${new Date().toLocaleTimeString()} — ${unitFmt(v)}</li>`).join('');
  };
  addItems('readings-glucose', series.glucose, v => `${v} mg/dL`);
  addItems('readings-bp', series.bpSys.map((s,i)=>({s, d: series.bpDia[i]})), v => `${v.s}/${v.d} mmHg`);
  addItems('readings-temp', series.temp, v => `${(+v).toFixed(1)} °C`);
  addItems('readings-heart', series.heart, v => `${v} BPM`);
}

/* ---------- Status Pills ---------- */
function setStatusPills(){
  const g = series.glucose.at(-1);
  const bps = series.bpSys.at(-1);
  const t = series.temp.at(-1);
  const h = series.heart.at(-1);

  const stG = statusFor('glucose', g); const pG = $('status-glucose');
  pG.textContent = stG.text; pG.className = `pill ${stG.cls}`;

  const stB = statusFor('bpSys', bps); const pB = $('status-bp');
  pB.textContent = stB.text; pB.className = `pill ${stB.cls}`;

  const stT = statusFor('temp', t); const pT = $('status-temp');
  pT.textContent = stT.text; pT.className = `pill ${stT.cls}`;

  const stH = statusFor('heart', h); const pH = $('status-heart');
  pH.textContent = stH.text; pH.className = `pill ${stH.cls}`;
}

/* ---------- History (no AI suggestions inside) ---------- */
function renderHistory(){
  const log = $('historyLog');
  if(!log) return;

  log.innerHTML = "";
  if(!userData.readings.length){
    log.innerHTML = "<p>No history recorded yet.</p>";
    return;
  }
  const recent = userData.readings.slice(-100).toReversed();
  recent.forEach(r => {
    const div = document.createElement('div');
    div.className = "history-item";
    div.innerHTML = `
      <div class="history-time">📅 ${new Date(r.time).toLocaleString()}</div>
      <div class="history-data">
        Glucose: <strong>${r.glucose} mg/dL</strong> |
        BP: <strong>${r.bpSys}/${r.bpDia} mmHg</strong> |
        Temp: <strong>${r.temp} °C</strong> |
        Heart: <strong>${r.heart} BPM</strong>
      </div>
    `;
    log.appendChild(div);
  });
}
function downloadCSV(){
  if (!userData.readings.length) { alert("No history to export."); return; }
  const rows = [
    ["Time","Glucose (mg/dL)","BP Systolic","BP Diastolic","Temperature (°C)","Heart Rate (BPM)"]
  ];
  userData.readings.forEach(r=>{
    rows.push([ new Date(r.time).toLocaleString(), r.glucose, r.bpSys, r.bpDia, r.temp, r.heart ]);
  });
  const csv = rows.map(row => row.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `Health_History_${(userData.profile?.name||'user')}.csv`; a.click();
  URL.revokeObjectURL(url);
}
$('downloadCsvBtn').onclick = downloadCSV;

/* ---------- Alerts on high values ---------- */
function checkAlerts(){
  const g = series.glucose.at(-1);
  const bps = series.bpSys.at(-1), bpd = series.bpDia.at(-1);
  const t = series.temp.at(-1);
  const h = series.heart.at(-1);

  if (g > 180) showToast(`Glucose very high (${g} mg/dL). Please follow your care plan.`, "urgent");
  if (bps > 160 || bpd > 100) showToast(`BP very high (${bps}/${bpd} mmHg).`, "urgent");
  if (t >= 39) showToast(`High fever (${t} °C).`, "urgent");
  if (h > 130) showToast(`Heart rate elevated (${h} BPM).`, "urgent");
}

/* ---------- Live Data Feed (demo generator) ---------- */
function addPoint(label, g,s,d,t,h){
  labels.push(label); if(labels.length > MAX_POINTS) labels.shift();

  series.glucose.push(g); if(series.glucose.length > MAX_POINTS) series.glucose.shift();
  series.bpSys.push(s);   if(series.bpSys.length > MAX_POINTS)   series.bpSys.shift();
  series.bpDia.push(d);   if(series.bpDia.length > MAX_POINTS)   series.bpDia.shift();
  series.temp.push(t);    if(series.temp.length > MAX_POINTS)    series.temp.shift();
  series.heart.push(h);   if(series.heart.length > MAX_POINTS)   series.heart.shift();
}

function renderChartsAndUI(){
  charts.glucose.update();
  charts.bp.update();
  charts.temp.update();
  charts.heart.update();
  setStatusPills();
  pushReadingLists();
  renderHistory();
}

function tick(){
  const now = new Date();
  const timeLabel = now.toLocaleTimeString();

  // Demo random values (replace with real device/API later)
  const latest = {
    glucose: Math.floor(85 + Math.random()*80),     // 85–165 mg/dL
    bpSys:   Math.floor(105 + Math.random()*40),    // 105–145 mmHg
    bpDia:   Math.floor(65 + Math.random()*25),     // 65–90  mmHg
    temp:    +(36 + Math.random()*2.8).toFixed(1),  // 36.0–38.8 °C
    heart:   Math.floor(55 + Math.random()*65)      // 55–120 BPM
  };

  addPoint(timeLabel, latest.glucose, latest.bpSys, latest.bpDia, latest.temp, latest.heart);

  // AI + Persist
  const sugg = generateSuggestions();
  updateSuggestionsPanel(sugg);

  userData.readings.push({ time: now.toISOString(), ...latest });
  if(userData.readings.length > 1000) userData.readings.shift();
  userData.suggestions.push({ time: now.toISOString(), text: sugg });
  if(userData.suggestions.length > 400) userData.suggestions.shift();
  saveUserData(session.email, userData);

  checkAlerts();
  renderChartsAndUI();
}

/* ---------- Bootstrap ---------- */
// Seed initial points so charts are not empty
(function seed(){
  for(let i=5;i>0;i--){
    const t = new Date(Date.now() - i*60000).toLocaleTimeString();
    addPoint(
      t,
      Math.floor(95 + Math.random()*40),
      Math.floor(110 + Math.random()*20),
      Math.floor(70 + Math.random()*12),
      +(36 + Math.random()*1.2).toFixed(1),
      Math.floor(60 + Math.random()*30)
    );
  }
  const initS = generateSuggestions();
  updateSuggestionsPanel(initS);
  renderChartsAndUI();
})();
setInterval(tick, 1000);
