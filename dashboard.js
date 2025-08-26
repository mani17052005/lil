
let currentTab = 'glucose';

const chartCtx = document.getElementById('metricChart').getContext('2d');
let chart = new Chart(chartCtx, {
  type: 'line',
  data: {
    labels: ['T-4', 'T-3', 'T-2', 'T-1', 'Now'],
    datasets: [{
      label: 'Glucose (mg/dL)',
      data: [110, 108, 115, 120, 125],
      borderColor: '#fff',
      borderWidth: 2,
      fill: false,
      tension: 0.3
    }]
  },
  options: {
    plugins: { legend: { labels: { color: '#fff' } } },
    scales: {
      x: { ticks: { color: '#fff' } },
      y: { ticks: { color: '#fff' } }
    }
  }
});

const metricData = {
  glucose: [110, 108, 115, 120, 125],
  bp: [120, 118, 122, 119, 121],
  temp: [36.5, 36.6, 36.7, 36.8, 36.9],
  heart: [72, 75, 78, 74, 76]
};

function updateMiniValues() {
  document.getElementById('mini-glucose').innerText = metricData.glucose.at(-1);
  document.getElementById('mini-bp').innerText = metricData.bp.at(-1) + '/80';
  document.getElementById('mini-temp').innerText = metricData.temp.at(-1) + '°C';
  document.getElementById('mini-heart').innerText = metricData.heart.at(-1);
}

function simulateData() {
  metricData.glucose.push(Math.floor(90 + Math.random() * 40));
  if (metricData.glucose.length > 5) metricData.glucose.shift();

  metricData.bp.push(Math.floor(110 + Math.random() * 20));
  if (metricData.bp.length > 5) metricData.bp.shift();

  metricData.temp.push((36 + Math.random()).toFixed(1));
  if (metricData.temp.length > 5) metricData.temp.shift();

  metricData.heart.push(Math.floor(65 + Math.random() * 20));
  if (metricData.heart.length > 5) metricData.heart.shift();

  updateMiniValues();
  updateMainCard();
}

function updateMainCard() {
  const title = document.getElementById('metricTitle');
  const value = document.getElementById('metricValue');
  const status = document.getElementById('metricStatus');
  const chartTitle = document.getElementById('chartTitle');

  let dataset = [];
  if (currentTab === 'glucose') {
    title.innerText = 'Glucose';
    value.innerText = metricData.glucose.at(-1) + ' mg/dL';
    status.innerText = 'Normal Range';
    chartTitle.innerText = 'Glucose Trend';
    dataset = metricData.glucose;
    chart.data.datasets[0].label = 'Glucose (mg/dL)';
  } else if (currentTab === 'bp') {
    title.innerText = 'Blood Pressure';
    value.innerText = metricData.bp.at(-1) + '/80 mmHg';
    status.innerText = 'Normal';
    chartTitle.innerText = 'Blood Pressure Trend';
    dataset = metricData.bp;
    chart.data.datasets[0].label = 'BP (Systolic)';
  } else if (currentTab === 'temp') {
    title.innerText = 'Temperature';
    value.innerText = metricData.temp.at(-1) + ' °C';
    status.innerText = 'Stable';
    chartTitle.innerText = 'Temperature Trend';
    dataset = metricData.temp;
    chart.data.datasets[0].label = 'Temp (°C)';
  } else if (currentTab === 'heart') {
    title.innerText = 'Heart Rate';
    value.innerText = metricData.heart.at(-1) + ' bpm';
    status.innerText = 'Normal';
    chartTitle.innerText = 'Heart Rate Trend';
    dataset = metricData.heart;
    chart.data.datasets[0].label = 'Heart Rate (bpm)';
  }

  chart.data.datasets[0].data = dataset;
  chart.update();
}

function setActiveTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`.tab[data-tab="${tab}"]`).classList.add('active');
  updateMainCard();
}

function logout() {
  localStorage.removeItem('ht_user');
  location.href = 'index.html';
}

// Initial
updateMiniValues();
updateMainCard();
setInterval(simulateData, 5000);
