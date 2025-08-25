function logout() {
  window.location.href = 'index.html';
}

const ctx = document.getElementById('featureChart').getContext('2d');
let chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: ['T-4', 'T-3', 'T-2', 'T-1', 'Now'],
    datasets: [{
      label: 'Value',
      data: [0, 0, 0, 0, 0],
      borderColor: '#2575fc',
      fill: false,
      tension: 0.3
    }]
  },
  options: { responsive: true }
});

function showFeature(feature) {
  const title = document.getElementById('featureTitle');
  let label = '';
  let min = 0, max = 0;

  if (feature === 'glucose') {
    label = 'Glucose (mg/dL)';
    min = 90; max = 140;
  } else if (feature === 'bp') {
    label = 'Blood Pressure (mmHg)';
    min = 70; max = 130;
  } else if (feature === 'heart') {
    label = 'Heart Rate (bpm)';
    min = 60; max = 120;
  } else if (feature === 'temp') {
    label = 'Body Temp (°C)';
    min = 36; max = 38;
  }

  title.textContent = label;

  let newData = Array.from({ length: 5 }, () => Math.floor(min + Math.random() * (max - min)));
  chart.data.datasets[0].data = newData;
  chart.data.datasets[0].label = label;
  chart.update();
}
