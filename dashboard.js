// Dashboard Script
const SESSION_KEY = 'ht_session';
const $ = (id) => document.getElementById(id);

let currentMetric = 'glucose';
let chart;
let history = {
  glucose: [], bp: [], temp: [], heart: []
};

// ---- Session check ----
function getSession(){
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
  catch { return null; }
}
function logout(){
  localStorage.removeItem(SESSION_KEY);
  location.href = 'index.html';
}

// ---- Tab Handling ----
function setActiveTab(metric){
  currentMetric = metric;
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.querySelector(`.tab[data-tab="${metric}"]`).classList.add('active');

  $('metricTitle').textContent = metricLabel(metric);
  $('chartTitle').textContent = `${metricLabel(metric)} Trend`;
  updateUI();
}
function metricLabel(m){
  switch(m){
    case 'glucose': return 'Glucose';
    case 'bp': return 'Blood Pressure';
    case 'temp': return 'Temperature';
    case 'heart': return 'Heart Rate';
  }
}

// ---- Chart ----
function initChart(){
  const ctx = $('metricChart').getContext('2d');
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: '',
        data: [],
        fill: false,
        borderColor: '#0078d4',
        tension: 0.2
      }]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: false } }
    }
  });
}
function updateChart(metric){
  const dataArr = history[metric];
  chart.data.labels = dataArr.map((_,i)=>i+1);
  chart.data.datasets[0].label = metricLabel(metric);
  chart.data.datasets[0].data = dataArr;
  chart.update();
}

// ---- Random Data Simulation ----
function generateReading(){
  const glucose = (70 + Math.random()*80).toFixed(1);
  const sys = Math.floor(100 + Math.random()*40);
  const dia = Math.floor(60 + Math.random()*20);
  const bp = `${sys}/${dia}`;
  const temp = (36 + Math.random()*2).toFixed(1);
  const heart = Math.floor(60 + Math.random()*40);

  history.glucose.push(Number(glucose));
  history.bp.push(bp);
  history.temp.push(Number(temp));
  history.heart.push(heart);

  if(history.glucose.length>10) history.glucose.shift();
  if(history.bp.length>10) history.bp.shift();
  if(history.temp.length>10) history.temp.shift();
  if(history.heart.length>10) history.heart.shift();

  updateUI();
}

// ---- UI Update ----
function updateUI(){
  let val;
  switch(currentMetric){
    case 'glucose': val = history.glucose.at(-1) || '--'; break;
    case 'bp': val = history.bp.at(-1) || '--'; break;
    case 'temp': val = history.temp.at(-1) || '--'; break;
    case 'heart': val = history.heart.at(-1) || '--'; break;
  }
  $('metricValue').textContent = val;

  // mini cards
  $('mini-glucose').textContent = history.glucose.at(-1) || '--';
  $('mini-bp').textContent = history.bp.at(-1) || '--';
  $('mini-temp').textContent = history.temp.at(-1) || '--';
  $('mini-heart').textContent = history.heart.at(-1) || '--';

  // AI Suggestions
  updateSuggestions();

  // chart
  if(currentMetric !== 'bp') updateChart(currentMetric);
}

// ---- Suggestions ----
function updateSuggestions(){
  const list = $('suggestionList');
  list.innerHTML = '';
  const g = history.glucose.at(-1);
  const bp = history.bp.at(-1);
  const t = history.temp.at(-1);
  const h = history.heart.at(-1);

  if(g && g > 140) addSuggestion("High glucose detected, consider reducing sugar intake.");
  if(bp){
    const [sys,dia] = bp.split('/').map(Number);
    if(sys>130 || dia>85) addSuggestion("Blood pressure is elevated. Monitor stress & salt intake.");
  }
  if(t && t > 37.5) addSuggestion("Fever detected. Stay hydrated and rest.");
  if(h && h > 100) addSuggestion("High heart rate. Try deep breathing.");
  if(list.innerHTML==='') addSuggestion("All readings look normal ✅");
}
function addSuggestion(text){
  const li = document.createElement('li');
  li.textContent = text;
  $('suggestionList').appendChild(li);
}

// ---- Toast ----
function showToast(msg){
  const div = document.createElement('div');
  div.className = 'toast';
  div.textContent = msg;
  $('toastContainer').appendChild(div);
  setTimeout(()=>div.remove(), 3000);
}

// ---- Init ----
(function init(){
  const session = getSession();
  if(!session || !session.email){ location.href = 'index.html'; return; }
  $('welcome').textContent = `Welcome, ${session.email}`;

  $('logoutBtn').onclick = logout;
  $('modeBtn').onclick = ()=> document.body.classList.toggle('dark');

  initChart();
  setActiveTab('glucose');
  generateReading();
  setInterval(generateReading, 1000);
})();
