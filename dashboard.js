const ctx = document.getElementById('glucoseChart').getContext('2d');
let glucoseData = [110, 112, 115, 118, 120];

let chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: ['T-4', 'T-3', 'T-2', 'T-1', 'Now'],
    datasets: [{
      label: 'Glucose (mg/dL)',
      data: glucoseData,
      borderColor: '#fff',
      borderWidth: 2,
      fill: false,
      tension: 0.3
    }]
  },
  options: { responsive: true }
});

function updateGlucose() {
  let value = Math.floor(90 + Math.random() * 50);
  document.getElementById('glucoseValue').textContent = value + ' mg/dL';

  let alertMsg = document.getElementById('alertMessage');
  if(value < 100) {
    alertMsg.textContent = 'Status: Normal';
    alertMsg.style.color = '#0f0';
  } else if(value < 140) {
    alertMsg.textContent = 'Status: Elevated';
    alertMsg.style.color = '#ff0';
  } else {
    alertMsg.textContent = 'Status: High - Alert!';
    alertMsg.style.color = '#f00';
  }

  glucoseData.push(value);
  if(glucoseData.length > 5) glucoseData.shift();
  chart.data.datasets[0].data = glucoseData;
  chart.update();
}

setInterval(updateGlucose, 5000);

function logout() {
  window.location.href = 'index.html';
}
