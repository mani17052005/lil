// ==========================
// Auth Logic (LocalStorage)
// ==========================

const USERS_KEY   = 'ht_users';
const SESSION_KEY = 'ht_session';
const USER_DATA   = 'ht_user_data';

const $ = id => document.getElementById(id);

// --------------------------
// Helpers
// --------------------------
function toggleForm(mode) {
  $('signupForm').style.display = mode === 'login' ? 'none' : 'block';
  $('loginForm').style.display  = mode === 'login' ? 'block' : 'none';
}

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function loadUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
}
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function setSession(email, remember = true) {
  const session = JSON.stringify({ email, ts: Date.now() });
  if (remember) {
    localStorage.setItem(SESSION_KEY, session);
  } else {
    sessionStorage.setItem(SESSION_KEY, session);
  }
}
function getSession() {
  return JSON.parse(localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY) || 'null');
}

// --------------------------
// Signup
// --------------------------
async function signup() {
  const email = $('signupEmail').value.trim().toLowerCase();
  const password = $('signupPassword').value;

  if (!email || !password) return alert('⚠ Please fill all fields.');

  const users = loadUsers();
  if (users.some(u => u.email === email)) {
    alert('⚠ Account already exists. Please login.');
    toggleForm('login');
    $('loginEmail').value = email;
    return;
  }

  const passHash = await sha256(password);
  users.push({ email, passHash, createdAt: new Date().toISOString() });
  saveUsers(users);

  const blob = JSON.parse(localStorage.getItem(USER_DATA) || '{}');
  blob[email] = blob[email] || { profile: {}, readings: [], suggestions: [] };
  localStorage.setItem(USER_DATA, JSON.stringify(blob));

  alert('✅ Account created! You can login now.');
  toggleForm('login');
  $('loginEmail').value = email;
}

// --------------------------
// Login
// --------------------------
async function login() {
  const email = $('loginEmail').value.trim().toLowerCase();
  const password = $('loginPassword').value;

  if (!email || !password) return alert('⚠ Enter email and password.');

  const users = loadUsers();
  const user = users.find(u => u.email === email);
  if (!user) return alert('⚠ No account found. Please sign up.');

  const passHash = await sha256(password);
  if (passHash !== user.passHash) return alert('❌ Incorrect password.');

  setSession(email, $('rememberMe').checked);
  location.href = 'dashboard.html';
}

// --------------------------
// Init
// --------------------------
(function init() {
  const session = getSession();
  if (session?.email) {
    location.href = 'dashboard.html';
    return;
  }

  $('signupBtn').onclick = signup;
  $('loginBtn').onclick = login;
  $('goLogin').onclick = e => { e.preventDefault(); toggleForm('login'); };
  $('goSignup').onclick = e => { e.preventDefault(); toggleForm('signup'); };
})();
