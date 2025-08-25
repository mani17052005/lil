function toggleForms() {
  document.getElementById('signup-container').classList.toggle('hidden');
  document.getElementById('login-container').classList.toggle('hidden');
}

// Store user data in localStorage (for demo purposes)
function signUp() {
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;

  if (email && password) {
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userPassword', password);
    document.getElementById('signup-message').innerText = 'Account created! Please login.';
    setTimeout(toggleForms, 1500);
  } else {
    document.getElementById('signup-message').innerText = 'Please fill in all fields.';
  }
}

function login() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  const storedEmail = localStorage.getItem('userEmail');
  const storedPassword = localStorage.getItem('userPassword');

  if (email === storedEmail && password === storedPassword) {
    window.location.href = 'dashboard.html'; // Redirect to dashboard
  } else {
    document.getElementById('login-message').innerText = 'Invalid email or password.';
  }
}
