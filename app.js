document.addEventListener('DOMContentLoaded', () => {
  const signupBox = document.getElementById('signupBox');
  const loginBox  = document.getElementById('loginBox');

  const showLogin  = document.getElementById('showLogin');
  const showSignup = document.getElementById('showSignup');

  const signupBtn  = document.getElementById('signupBtn');
  const loginBtn   = document.getElementById('loginBtn');

  const signupEmail    = document.getElementById('signupEmail');
  const signupPassword = document.getElementById('signupPassword');
  const loginEmail     = document.getElementById('loginEmail');
  const loginPassword  = document.getElementById('loginPassword');

  const signupMsg = document.getElementById('signupMsg');
  const loginMsg  = document.getElementById('loginMsg');

  // Helpers to store/read users safely under one key
  const getUsers = () => JSON.parse(localStorage.getItem('users') || '{}');
  const setUsers = (users) => localStorage.setItem('users', JSON.stringify(users));

  // Toggle links
  showLogin?.addEventListener('click', (e) => {
    e.preventDefault();
    signupBox.classList.add('hidden');
    loginBox.classList.remove('hidden');
    loginEmail.focus();
  });

  showSignup?.addEventListener('click', (e) => {
    e.preventDefault();
    loginBox.classList.add('hidden');
    signupBox.classList.remove('hidden');
    signupEmail.focus();
  });

  // Sign Up
  signupBtn.addEventListener('click', () => {
    signupMsg.textContent = '';
    signupMsg.classList.remove('error');

    const email = signupEmail.value.trim().toLowerCase();
    const pass  = signupPassword.value;

    if (!email || !pass) {
      signupMsg.textContent = 'Please enter email and password.';
      signupMsg.classList.add('error');
      return;
    }

    const users = getUsers();
    if (users[email]) {
      signupMsg.textContent = 'This email is already registered.';
      signupMsg.classList.add('error');
      return;
    }

    // Store (DEMO ONLY: do not store plain passwords in real apps)
    users[email] = { password: pass, createdAt: Date.now() };
    setUsers(users);

    signupMsg.textContent = 'Account created! You can log in now.';
    signupEmail.value = '';
    signupPassword.value = '';

    // Switch to login
    setTimeout(() => {
      signupBox.classList.add('hidden');
      loginBox.classList.remove('hidden');
      loginEmail.focus();
    }, 600);
  });

  // Login
  loginBtn.addEventListener('click', () => {
    loginMsg.textContent = '';
    loginMsg.classList.remove('error');

    const email = loginEmail.value.trim().toLowerCase();
    const pass  = loginPassword.value;

    if (!email || !pass) {
      loginMsg.textContent = 'Please enter email and password.';
      loginMsg.classList.add('error');
      return;
    }

    const users = getUsers();
    if (!users[email] || users[email].password !== pass) {
      loginMsg.textContent = 'Invalid email or password.';
      loginMsg.classList.add('error');
      return;
    }

    // Create a session and go to dashboard
    localStorage.setItem('sessionEmail', email);
    window.location.href = 'dashboard.html';
  });
});
