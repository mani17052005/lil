window.onload = () => {
  const email = localStorage.getItem('userEmail');
  if (!email) {
    window.location.href = 'index.html';
  } else {
    document.getElementById('welcome-text').innerText = `Welcome, ${email}`;
  }
};

function logout() {
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userPassword');
  window.location.href = 'index.html';
}
