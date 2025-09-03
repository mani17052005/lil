// ==========================
// 🔹 Health Tracker Auth JS
// LocalStorage-based demo login/signup
// ==========================

// Storage Keys
const USERS_KEY   = 'ht_users';
const SESSION_KEY = 'ht_session';
const USER_DATA   = 'ht_user_data';

// Short helper for element lookup
const $ = (id) => document.getElementById(id);

// --------------------------
// 🔹 UI Helpers
// --------------------------
function toggleForm(mode) {
  const signupForm = $('signupForm');
  const loginForm  = $('loginForm');

  if (!signupForm || !loginForm) return;

  if (mode === 'login') {
    signupForm.style.display = 'none';
    loginForm.style.display  = 'block';
  } else {
    signupForm.style.display = 'block';
    loginForm.style.display  = 'none';
  }
}

// SHA-256 password hashing (async)
async function sha256(text) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
              .map(b => b.toString(16).padStart(2, '0'))
              .join('');
}

// --------------------------
// 🔹 LocalStorage Utilities
// --------------------------
function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function setSession(email, remember = true) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ email, ts: Date.now(), remember })
  );
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY)) || null;
  } catch {
    return null;
  }
}

// --------------------------
// 🔹 Auth: Sign Up
// --------------------------
async function signup() {
  const email    = $('signupEmail')?.value.trim().toLowerCase();
  const password = $('signupPassword')?.value;

  if (!email || !password) {
    alert('⚠ Please fill all fields.');
    return;
  }

  const users = loadUsers();

  if (users.some(u => u.email === email)) {
    alert('⚠ Account already exists. Please login.');
    toggleForm('login');
    if ($('loginEmail')) $('loginEmail').value = email;
    return;
  }

  const passHash = await sha256(password);
  users.push({ email, passHash, createdAt: new Date().toISOString() });
  saveUsers(users);

  // Create default profile for this user
  const blob = JSON.parse(localStorage.getItem(USER_DATA) || '{}');
  blob[email] = blob[email] || { profile: {}, readings: [], suggestions: [] };
  localStorage.setItem(USER_DATA, JSON.stringify(blob));

  alert('✅ Account created! You can login now.');
  toggleForm('login');
  if ($('loginEmail')) $('loginEmail').value = email;
}

// --------------------------
// 🔹 Auth: Login
// --------------------------
async function login() {
  const email    = $('loginEmail')?.value.trim().toLowerCase();
  const password = $('loginPassword')?.value;

  if (!email || !password) {
    alert('⚠ Enter email and password.');
    return;
  }

  const users = loadUsers();
  const user  = users.find(u => u.email === email);

  if (!user) {
    alert('⚠ No account found. Please sign up.');
    return;
  }

  const passHash = await sha256(password);
  if (passHash !== user.passHash) {
    alert('❌ Incorrect password.');
    return;
  }

  setSession(email, $('rememberMe')?.checked);
  location.href = 'dashboard.html';
}

// --------------------------
// 🔹 Init on Page Load
// --------------------------
(function init() {
  const session = getSession();
  if (session?.email) {
    // Auto-login if session exists
    location.href = 'dashboard.html';
    return;
  }

  // Attach events safely
  $('signupBtn')?.addEventListener('click', signup);
  $('loginBtn')?.addEventListener('click', login);
  $('goLogin')?.addEventListener('click', (e) => { e.preventDefault(); toggleForm('login'); });
  $('goSignup')?.addEventListener('click', (e) => { e.preventDefault(); toggleForm('signup'); });
})();
