document.getElementById('logoutBtn').addEventListener('click', () => {
  window.location.href = 'index.html';
});

function openFeature(feature) {
  const box = document.getElementById('featureBox');
  if (feature === 'glucose') {
    box.innerHTML = `<h3>Glucose Monitoring</h3><p>Current: ${randomValue(90,130)} mg/dL</p>`;
  } else if (feature === 'bp') {
    box.innerHTML = `<h3>Blood Pressure</h3><p>${randomValue(100,140)}/${randomValue(70,90)} mmHg</p>`;
  } else if (feature === 'temp') {
    box.innerHTML = `<h3>Body Temperature</h3><p>${randomValue(97,99).toFixed(1)} °F</p>`;
  } else if (feature === 'heart') {
    box.innerHTML = `<h3>Heart Rate</h3><p>${randomValue(60,100)} bpm</p>`;
  }
}

function randomValue(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
