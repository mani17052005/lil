document.addEventListener('DOMContentLoaded', () => {
  const email = localStorage.getItem('sessionEmail');
  if (!email) {
    // Not logged in → back to login
    window.location.href = 'index.html';
    return;
  }

  document.getElementById('who').textContent = email;

  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('sessionEmail');
    window.location.href = 'index.html';
  });
});

function openFeature(feature) {
  const box = document.getElementById('featurePanel');
  const r = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  if (feature === 'glucose') {
    box.innerHTML = `<h3>Glucose</h3><p>Current: <strong>${r(90, 130)}</strong> mg/dL</p>`;
  } else if (feature === 'bp') {
    box.innerHTML = `<h3>Blood Pressure</h3><p><strong>${r(105, 135)}/${r(65, 88)}</strong> mmHg</p>`;
  } else if (feature === 'temp') {
    box.innerHTML = `<h3>Body Temperature</h3><p><strong>${(36 + Math.random()*1.2).toFixed(1)}</strong> °C</p>`;
  } else if (feature === 'heart') {
    box.innerHTML = `<h3>Heart Rate</h3><p><strong>${r(60, 100)}</strong> bpm</p>`;
  }
}
