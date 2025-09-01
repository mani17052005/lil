/***** ===========================
 *  Health Tracker — dashboard.js
 *  =========================== */

/* ---------- Session / Auth ---------- */
const SESSION_KEY = 'ht_session';
const getSession = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY)||'null'); } catch { return null; } };
const logout = () => { localStorage.removeItem(SESSION_KEY); location.href='index.html'; };

const session = getSession();
if(!session || !session.email){ location.href = 'index.html'; }

/* ---------- UI Wiring ---------- */
const $ = (id) => document.getElementById(id);
$('welcome').textContent = `Your Health Dashboard — ${session.email}`;
$('logoutBtn').onclick = logout;
$('modeBtn').onclick = () => {
  document.body.classList.toggle('light');
  if (window.metricChart) window.metricChart.update();
};

/* ---------- Per-user Storage ---------- */
const USERS_DATA_KEY = 'ht_user_data';
function loadUserBlob(){
  try { return JSON.parse(localStorage.getItem(USERS_DATA_KEY) || '{}'); }
  catch { return {}; }
}
function saveUserBlob(blob){ localStorage.setItem(USERS_DATA_KEY, JSON.stringify(blob)); }
function loadUserData(email){
  const blob = loadUserBlob();
  return blob[email] || { readings: [], suggestions: [] };
}
function saveUserData(email, data){
  const blob = loadUserBlob();
  blob[email] = data;
  saveUserBlob(blob);
}
let userData = loadUserData(session.email);

/* ---------- Live Series & Labels ---------- */
let labels = []; // time labels like "10:42:01 AM"
const MAX_POINTS = 30; // chart window

let series = {
  glucose: [],
  bpSys:   [],
  bpDia:   [],
  temp:    [],
  heart:   []
};

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

  // Optional sections (render only if present in DOM)
  const history = $('historySection');
  const doctor  = $('doctorSection');
  if (history) history.style.display = (tab === 'history') ? 'block' : 'none';
  if (doctor)  doctor.style.display  = (tab === 'doctor')  ? 'block' : 'none';

  if (tab === 'history' && history) renderHistory();
  else if (tab !== 'doctor') render();
}
window.setActiveTab = setActiveTab;

/* ---------- AI Suggestions (Trend-Aware) ---------- */
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
    messages.push("⚠️ High glucose: hydrate, light walk, monitor intake.");
    if(series.glucose.slice(-3).every(v => v > 140)){
      messages.push("🚨 Persistent high glucose! Schedule a check-up soon.");
    }
  } else if(latest.glucose < 70){
    messages.push("⚠️ Low glucose: take fast-acting carbs (juice/tablets).");
  } else {
    messages.push("✅ Glucose within target range.");
  }

  // BP
  if(latest.bpSys > 140 || latest.bpDia > 90){
    messages.push("⚠️ High BP: reduce salt, relax breathing, manage stress.");
    if(series.bpSys.slice(-3).every(v => v > 140)){
      messages.push("🚨 Persistent high BP! Consult your doctor.");
    }
  } else if(latest.bpSys < 90 || latest.bpDia < 60){
    messages.push("⚠️ Low BP: hydrate, sit/lie down if dizzy.");
  } else {
    messages.push("✅ Blood pressure looks good.");
  }

  // Temperature
  if(latest.temp > 38){
    messages.push("🤒 Fever: rest, hydrate, monitor symptoms.");
    if(series.temp.slice(-3).every(v => v > 38)){
      messages.push("🚨 Fever persisting across readings. Seek medical advice.");
    }
  } else if(latest.temp < 36){
    messages.push("⚠️ Low temperature: keep warm and recheck.");
  } else {
    messages.push("✅ Temperature is normal.");
  }

  // Heart rate
  if(latest.heart > 100){
    messages.push("⚠️ High heart rate: rest, avoid caffeine, slow breathing.");
    if(series.heart.slice(-3).every(v => v > 100)){
      messages.push("🚨 Sustained high heart rate. Please consult a clinician.");
    }
  } else if(latest.heart < 60){
    messages.push("⚠️ Low heart rate: if dizzy/weak, contact your doctor.");
  } else {
    messages.push("✅ Heart rate in a healthy range.");
  }

  // Rapid glucose swing
  if(series.glucose.length > 1 && Math.abs(series.glucose.at(-1) - series.glucose.at(-2)) > 40){
    messages.push("⚠️ Rapid glucose fluctuation detected. Review recent meals/insulin.");
  }

  // All good
  const allGood =
    latest.glucose >= 90 && latest.glucose <= 120 &&
    latest.bpSys   >= 100 && latest.bpSys   <= 130 &&
    latest.temp    >= 36  && latest.temp    <= 37.5 &&
    latest.heart   >= 60  && latest.heart   <= 90;
  if(allGood) messages.push("✅ All readings stable—great job maintaining your routine!");

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
  messages.slice(-3).forEach(msg => {
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

/* ---------- Render (cards + chart) ---------- */
function render(){
  const title = $('metricTitle');
  const valueEl = $('metricValue');
  const statusEl = $('metricStatus');
  const chartTitle = $('chartTitle');

  if(activeTab==='glucose'){
    const v = series.glucose.at(-1) ?? 0;
    title.textContent = 'Glucose';
    valueEl.textContent = `${v} mg/dL`;
    const s = statusFor('glucose', v);
    statusEl.textContent = s.text; statusEl.className = `metric-status ${s.cls}`;
    chartTitle.textContent = 'Glucose Trend';
    metricChart.data.labels = labels;
    metricChart.data.datasets = [
      { label:'Glucose (mg/dL)', data:series.glucose, borderColor:'#ffffff', borderWidth:2, tension:.32, fill:false }
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
  $('mini-glucose').textContent = gLast != null ? `${gLast} mg/dL` : '--';
  $('mini-bp').textContent      = (sLast != null && dLast != null) ? `${sLast}/${dLast}` : '--/--';
  $('mini-temp').textContent    = tLast != null ? `${(+tLast).toFixed(1)} °C` : '--';
  $('mini-heart').textContent   = hLast != null ? `${hLast} BPM` : '--';

  metricChart.options = chartOptions(); // refresh label colors for light/dark
  metricChart.update();
}

/* ---------- History (optional section) ---------- */
function renderHistory(){
  const log = $('historyLog');
  if(!log) return;

  log.innerHTML = "";
  if(!userData.readings.length){
    log.innerHTML = "<p>No history recorded yet.</p>";
    return;
  }
  const recent = userData.readings.slice(-50).toReversed();
  recent.forEach(r => {
    const suggObj = userData.suggestions.find(s => s.time >= r.time);
    const div = document.createElement('div');
    div.className = "history-item";
    div.innerHTML = `
      <div class="history-time">📅 ${new Date(r.time).toLocaleString()}</div>
      <div class="history-data">
        Glucose: ${r.glucose} mg/dL | BP: ${r.bpSys}/${r.bpDia} mmHg | Temp: ${r.temp} °C | Heart: ${r.heart} BPM
      </div>
      <div class="history-sugg">
        <strong>AI Suggestion:</strong>
        <ul>${suggObj ? suggObj.text.map(t=>`<li>${t}</li>`).join("") : "<li>--</li>"}</ul>
      </div>
    `;
    log.appendChild(div);
  });
}

/* CSV Export (optional button) */
function downloadCSV(){
  if (!userData.readings.length) { alert("No history to export."); return; }
  const rows = [
    ["Time","Glucose (mg/dL)","BP Systolic","BP Diastolic","Temperature (°C)","Heart Rate (BPM)","AI Suggestions"]
  ];
  userData.readings.forEach(r=>{
    const sugg = userData.suggestions.find(s => s.time >= r.time);
    rows.push([
      new Date(r.time).toLocaleString(),
      r.glucose, r.bpSys, r.bpDia, r.temp, r.heart,
      sugg ? sugg.text.join(" | ") : ""
    ]);
  });
  const csv = rows.map(row => row.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `Health_History_${session.email}.csv`; a.click();
  URL.revokeObjectURL(url);
}
const dlBtn = $('downloadCsvBtn');
if (dlBtn) dlBtn.onclick = downloadCSV;

/* ---------- Doctor Mode (optional section) ---------- */
const csvUpload = $('csvUpload');
if (csvUpload) {
  csvUpload.addEventListener('change', (event)=>{
    const file = event.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target.result;
      const rows = text.split(/\r?\n/).filter(Boolean).map(r=>{
        // basic CSV split respecting quotes
        const out=[]; let cur='', inQ=false;
        for (let i=0;i<r.length;i++){
          const ch=r[i];
          if(ch==='"' && r[i+1]==='"'){ cur+='"'; i++; continue; }
          if(ch==='"'){ inQ=!inQ; continue; }
          if(ch===',' && !inQ){ out.push(cur); cur=''; continue; }
          cur+=ch;
        }
        out.push(cur);
        return out.map(c=>c.replace(/^"|"$/g,''));
      });
      rows.shift(); // drop header
      const readings = rows.map(r=>({
        time:r[0], glucose:+r[1], bpSys:+r[2], bpDia:+r[3], temp:+r[4], heart:+r[5], suggestion:r[6]||""
      }));
      renderDoctorView(readings);
    };
    reader.readAsText(file);
  });
}

function renderDoctorView(readings){
  const out = $('doctorOutput');
  const canvas = $('doctorChart');
  if(!out || !canvas) return;

  out.innerHTML = `<p>Imported ${readings.length} readings</p>`;
  const ctxD = canvas.getContext('2d');
  if(window.doctorChart) window.doctorChart.destroy();
  window.doctorChart = new Chart(ctxD, {
    type: 'line',
    data: {
      labels: readings.map(r=>r.time),
      datasets: [
        {label:"Glucose",      data:readings.map(r=>r.glucose), borderColor:"#ffffff", fill:false, tension:.3},
        {label:"BP Systolic",  data:readings.map(r=>r.bpSys),   borderColor:"#ff4b5c", fill:false, tension:.3},
        {label:"BP Diastolic", data:readings.map(r=>r.bpDia),   borderColor:"#65d2ff", fill:false, tension:.3},
        {label:"Temperature",  data:readings.map(r=>r.temp),    borderColor:"#ffd166", fill:false, tension:.3},
        {label:"Heart Rate",   data:readings.map(r=>r.heart),   borderColor:"#00ffb3", fill:false, tension:.3}
      ]
    },
    options: chartOptions()
  });

  const suggs = readings.slice(-5).map(r=>`<li>${r.time}: ${r.suggestion || '—'}</li>`).join("");
  out.innerHTML += `<h4>Recent AI Suggestions</h4><ul>${suggs}</ul>`;
}

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
  const timeLabel = now.toLocaleTimeString(); // e.g., 10:42:01 AM

  const latest = {
    glucose: Math.floor(85 + Math.random()*80),     // 85–165
    bpSys:   Math.floor(105 + Math.random()*40),    // 105–145
    bpDia:   Math.floor(65 + Math.random()*25),     // 65–90
    temp:    +(36 + Math.random()*2.8).toFixed(1),  // 36.0–38.8
    heart:   Math.floor(55 + Math.random()*65)      // 55–120
  };

  addPoint(timeLabel, latest.glucose, latest.bpSys, latest.bpDia, latest.temp, latest.heart);

  // AI + Persist
  const sugg = generateSuggestions();
  updateSuggestionsPanel(sugg);

  userData.readings.push({ time: now.toISOString(), ...latest });
  if(userData.readings.length > 500) userData.readings.shift();
  userData.suggestions.push({ time: now.toISOString(), text: sugg });
  if(userData.suggestions.length > 200) userData.suggestions.shift();
  saveUserData(session.email, userData);

  render();
}

/* ---------- Bootstrap ---------- */
setActiveTab('glucose');   // default tab
// seed a few starting points so the chart isn't empty
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
  }
  // initial suggestions render
  const initS = generateSuggestions();
  updateSuggestionsPanel(initS);
  render();
})();
setInterval(tick, 2000); // update every 2 seconds

/* ---------- Optional: wire buttons if present ---------- */
const histBtn = $('downloadCsvBtn');
if (histBtn) histBtn.onclick = downloadCSV;
