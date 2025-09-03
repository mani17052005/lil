// auth.js - Signup / Login / Forgot (localStorage + SHA-256)

const USERS_KEY = 'ht_users';
const SESSION_KEY = 'ht_session';
const USER_DATA = 'ht_user_data';
const $ = id => document.getElementById(id);

async function sha256(text){
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

function loadUsers(){ try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch { return []; } }
function saveUsers(u){ localStorage.setItem(USERS_KEY, JSON.stringify(u)); }
function setSession(email, remember=true){
  const s = JSON.stringify({email, ts: Date.now()});
  if(remember) localStorage.setItem(SESSION_KEY, s);
  else sessionStorage.setItem(SESSION_KEY, s);
}
function getSession(){ try { return JSON.parse(localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; } }
function ensureUserData(email){
  const blob = JSON.parse(localStorage.getItem(USER_DATA) || '{}');
  blob[email] = blob[email] || { profile:{}, readings:[], suggestions:[] };
  localStorage.setItem(USER_DATA, JSON.stringify(blob));
}

// UI refs
const loginForm = $('loginForm'), signupForm = $('signupForm'), forgotModal = $('forgotModal');

// show/hide helpers
const show = el => el.classList.remove('hidden');
const hide = el => el.classList.add('hidden');

// wire up show/hide
$('showSignup').onclick = () => { hide(loginForm); show(signupForm); };
$('showLogin').onclick  = () => { show(loginForm); hide(signupForm); };
$('showForgot').onclick = (e) => { e.preventDefault(); show(forgotModal); };
$('cancelReset').onclick = () => { hide(forgotModal); $('forgotEmail').value=''; $('forgotNewPassword').value=''; };

// Signup
$('signupBtn').onclick = async () => {
  const email = $('signupEmail').value.trim().toLowerCase();
  const pwd   = $('signupPassword').value;
  if(!email || !pwd) return alert('Fill email and password.');
  const users = loadUsers();
  if(users.some(u=>u.email===email)) { alert('Account exists. Please login.'); show(loginForm); hide(signupForm); $('loginEmail').value = email; return; }
  const passHash = await sha256(pwd);
  users.push({ email, passHash, createdAt: new Date().toISOString() });
  saveUsers(users);
  ensureUserData(email);
  alert('Account created. You can login now.');
  show(loginForm); hide(signupForm);
  $('loginEmail').value = email;
};

// Login
$('loginBtn').onclick = async () => {
  const email = $('loginEmail').value.trim().toLowerCase();
  const pwd = $('loginPassword').value;
  const remember = $('rememberMe').checked;
  if(!email || !pwd) return alert('Enter email and password.');
  const users = loadUsers();
  const user = users.find(u=>u.email===email);
  if(!user) return alert('No account found. Please sign up.');
  const passHash = await sha256(pwd);
  if(passHash !== user.passHash) return alert('Incorrect password.');
  setSession(email, remember);
  ensureUserData(email);
  location.href = 'dashboard.html';
};

// Reset password (Forgot)
$('resetBtn').onclick = async () => {
  const email = $('forgotEmail').value.trim().toLowerCase();
  const newPwd = $('forgotNewPassword').value;
  if(!email || !newPwd) return alert('Enter email and new password.');
  const users = loadUsers();
  const idx = users.findIndex(u=>u.email===email);
  if(idx === -1) return alert('No account with that email.');
  users[idx].passHash = await sha256(newPwd);
  users[idx].updatedAt = new Date().toISOString();
  saveUsers(users);
  hide(forgotModal);
  $('forgotEmail').value=''; $('forgotNewPassword').value='';
  alert('Password reset successful. Login with new password.');
};

// Auto redirect if already logged in
window.addEventListener('load', () => {
  const s = getSession();
  if(s?.email) location.href = 'dashboard.html';
});
