// --------- Utilities / Storage Keys ---------
const USERS_KEY     = 'ht_users';
const SESSION_KEY   = 'ht_session';
const PROFILE_KEY   = 'ht_user_profiles'; // per-user profile blob

const $ = (id) => document.getElementById(id);

function toggleForm(mode){
  $('signupForm').style.display = mode === 'login' ? 'none' : 'block';
  $('loginForm').style.display  = mode === 'login' ? 'block' : 'none';
}

// SHA-256 password hashing
async function sha256(text){
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

// Users
function loadUsers(){
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }
  catch { return []; }
}
function saveUsers(users){
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Session
function setSession(email, remember=true){
  localStorage.setItem(SESSION_KEY, JSON.stringify({email, ts: Date.now(), remember}));
}
function getSession(){
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
  catch { return null; }
}
function clearSession(){ localStorage.removeItem(SESSION_KEY); }

// Profiles
function loadProfiles(){
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}'); }
  catch { return {}; }
}
function saveProfiles(blob){
  localStorage.setItem(PROFILE_KEY, JSON.stringify(blob));
}
function ensureDefaultProfile(email){
  const all = loadProfiles();
  if(!all[email]){
    const name = email.split('@')[0];
    all[email] = {
      email,
      name,
      avatar: '😀',
      units: 'mgdl',   // mg/dL (or mmol)
      theme: 'dark',
      goals: { dailyReadings: 10 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    saveProfiles(all);
  }
}

// --------- Sign Up ---------
async function signup(){
  const email = $('signupEmail').value.trim().toLowerCase();
  const password = $('signupPassword').value;

  if(!email || !password) return alert('Please fill all fields.');
  const users = loadUsers();
  if(users.some(u => u.email === email)){
    alert('Account already exists. Please login.');
    toggleForm('login');
    $('loginEmail').value = email;
    return;
  }
  const passHash = await sha256(password);
  users.push({email, passHash, createdAt: new Date().toISOString()});
  saveUsers(users);

  // create default profile
  ensureDefaultProfile(email);

  alert('Account created! You can login now.');
  toggleForm('login');
  $('loginEmail').value = email;
}

// --------- Login ---------
async function login(){
  const email = $('loginEmail').value.trim().toLowerCase();
  const password = $('loginPassword').value;
  if(!email || !password) return alert('Enter email and password.');

  const users = loadUsers();
  const user = users.find(u => u.email === email);
  if(!user) return alert('No account found. Please sign up.');

  const passHash = await sha256(password);
  if(passHash !== user.passHash) return alert('Incorrect password.');

  setSession(email, $('rememberMe').checked);
  location.href = 'dashboard.html';
}

// --------- Init ---------
(function init(){
  const session = getSession();
  if(session && session.email) {
    // already logged in -> go to dashboard
    // (if you're testing and want to stay here, comment the next line)
    // location.href = 'dashboard.html';
  }

  $('signupBtn').onclick = signup;
  $('loginBtn').onclick = login;
  $('goLogin').onclick = e => { e.preventDefault(); toggleForm('login'); };
  $('goSignup').onclick = e => { e.preventDefault(); toggleForm('signup'); };
})();
