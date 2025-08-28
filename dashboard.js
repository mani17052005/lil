// --- session helpers (same keys as app.js) ---
const SESSION_KEY = 'ht_session';
const getSession = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY)||'null'); } catch { return null; } };
const logout = () => { localStorage.removeItem(SESSION_KEY); location.href='index.html'; };

// Redirect if not logged in
const session = getSession();
if(!session || !session.email){ location.href = 'index.html'; }

// Welcome title
document.getElementById('welcome').textContent = `Your Health Dashboard — ${session.email}`;
document.getElementById('logoutBtn').onclick = logout;

// --- Theme toggle (optional, simple) ---
const modeBtn = document.getElementById('modeBtn');
modeBtn.onclick = () => document.body.classList.toggle('light');

// --- Data ---
const labels = ['T-4','T-3','T-2','T-1','Now'];
let series = {
  glucose: [110, 118, 122, 130, 126],
  bpSys:   [118, 122, 126, 124, 120],
  bpDia:   [78, 80, 82, 81, 79],
  temp:    [36.6, 36.8, 37.0, 36.7, 36.8],
  heart:   [72, 78, 80, 76, 79]
};
let activeTab = 'glucose';

// --- Chart ---
const ctx = document.getElementById('metricChart').getContext('2d');
let chart = new Chart(ctx, {
  type: 'line',
  data: { labels, datasets: [] },
  options: {
    responsive:true,
    plugins:{ legend:{labels:{color:'#fff'}} },
    scales:{ x:{ticks:{color:'#fff'}}, y:{ticks:{color:'#fff'}} }
  }
});

// --- Helpers ---
function statusFor(metric, value){
  switch(metric){
    case 'glucose':
      if(value < 70)  return {text:'Low', cls:'status-bad'};
      if(value > 140) return {text:'High', cls:'status-bad'};
      if(value >= 100) return {text:'Elevated', cls:'status-warn'};
      return {text:'Normal', cls:'status-ok'};
    case 'bp':
      if(value < 90)   return {text:'Low', cls:'status-bad'};
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

function setActiveTab(tab){
  activeTab = tab;
  document.querySelectorAll('.tab').forEach(btn => btn.classList.toggle('active', btn.dataset.tab===tab));
  render();
}

function render(){
  const title = document.getElementById('metricTitle');
  const valueEl = document.getElementById('metricValue');
  const statusEl = document.getElementById('metricStatus');
  const chartTitle = document.getElementById('chartTitle');

  if(activeTab==='glucose'){
    const v = series.glucose.at(-1);
    title.textContent = 'Glucose';
    valueEl.textContent = `${v} mg/dL`;
    const s = statusFor('glucose', v);
    statusEl.textContent = s.text; statusEl.className = `metric-status ${s.cls}`;
    chartTitle.textContent = 'Glucose Trend';
    chart.data.datasets = [{
      label:'Glucose (mg/dL)', data: series.glucose, borderColor:'#ffffff', borderWidth:2, tension:.32, fill:false
    }];
  }
  if(activeTab==='bp'){
    const s = series.bpSys.at(-1), d = series.bpDia.at(-1);
    title.textContent = 'Blood Pressure';
    valueEl.textContent = `${s}/${d} mmHg`;
    const st = statusFor('bp', s);
    statusEl.textContent = st.text; statusEl.className = `metric-status ${st.cls}`;
    chartTitle.textContent = 'Blood Pressure Trend';
    chart.data.datasets = [
      {label:'Systolic',  data:series.bpSys, borderColor:'#ff4b5c', borderWidth:2, tension:.32, fill:false},
      {label:'Diastolic', data:series.bpDia, borderColor:'#65d2ff', borderWidth:2, tension:.32, fill:false}
    ];
  }
  if(activeTab==='temp'){
    const t = series.temp.at(-1);
    title.textContent = 'Body Temperature';
    valueEl.textContent = `${t.toFixed(1)} °C`;
    const st = statusFor('temp', t);
    statusEl.textContent = st.text; statusEl.className = `metric-status ${st.cls}`;
    chartTitle.textContent = 'Temperature Trend';
    chart.data.datasets = [{label:'Temperature (°C)', data:series.temp, borderColor:'#ffd166', borderWidth:2, tension:.32, fill:false}];
  }
  if(activeTab==='heart'){
    const h = series.heart.at(-1);
    title.textContent = 'Heart Rate';
    valueEl.textContent = `${h} BPM`;
    const st = statusFor('heart', h);
    statusEl.textContent = st.text; statusEl.className = `metric-status ${st.cls}`;
    chartTitle.textContent = 'Heart Rate Trend';
    chart.data.datasets = [{label:'Heart Rate (BPM)', data:series.heart, borderColor:'#00ffb3', borderWidth:2, tension:.32, fill:false}];
  }

  // mini-cards
  document.getElementById('mini-glucose').textContent = `${series.glucose.at(-1)} mg/dL`;
  document.getElementById('mini-bp').textContent = `${series.bpSys.at(-1)}/${series.bpDia.at(-1)}`;
  document.getElementById('mini-temp').textContent = `${series.temp.at(-1).toFixed(1)} °C`;
  document.getElementById('mini-heart').textContent = `${series.heart.at(-1)} BPM`;

  chart.update();
}

// Simulated updates
function tick(){
  const g = Math.floor(90 + Math.random()*70);
  series.glucose.push(g); if(series.glucose.length>5) series.glucose.shift();

  const s = Math.floor(108 + Math.random()*32);
  const d = Math.floor(70 + Math.random()*18);
  series.bpSys.push(s); if(series.bpSys.length>5) series.bpSys.shift();
  series.bpDia.push(d); if(series.bpDia.length>5) series.bpDia.shift();

  const t = +(36 + Math.random()*2.5).toFixed(1);
  series.temp.push(t); if(series.temp.length>5) series.temp.shift();

  const h = Math.floor(55 + Math.random()*60);
  series.heart.push(h); if(series.heart.length>5) series.heart.shift();

  render();
}

setActiveTab('glucose');
setInterval(tick, 4000);
