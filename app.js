// --------- Utilities ---------
const USERS_KEY = 'ht_users';        // array of {email, passHash, createdAt}
const SESSION_KEY = 'ht_session';    // {email, ts}

const $ = (id) => document.getElementById(id);

function toggleForm(mode){
  const sign = $('signupForm');
  const log  = $('loginForm');
  if(mode === 'login'){ sign.style.display='none'; log.style.display='block'; }
  else { sign.style.display='block'; log.style.display='none'; }
}

// SHA-256 hash for password (frontend-only)
async function sha256(text){
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

function loadUsers(){
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }
  catch { return []; }
}
function saveUsers(users){
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}
function setSession(email, remember=true){
  // localStorage persists anyway, checkbox just for UI parity
  localStorage.setItem(SESSION_KEY, JSON.stringify({email, ts: Date.now(), remember}));
}
function getSession(){
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
  catch { return null; }
}
function clearSession(){
  localStorage.removeItem(SESSION_KEY);
}

// --------- Sign Up ---------
async function signup(){
  const email = $('signupEmail').value.trim().toLowerCase();
  const password = $('signupPassword').value;

  if(!email || !password) return alert('Please fill all fields.');
  const users = loadUsers();
  if(users.some(u => u.email === email)){
    alert('An account with this email already exists. Please login.');
    toggleForm('login');
    $('loginEmail').value = email;
    return;
  }
  const passHash = await sha256(password);
  users.push({email, passHash, createdAt: new Date().toISOString()});
  saveUsers(users);
  alert('Account created! You can login now.');
  toggleForm('login');
  $('loginEmail').value = email;
  $('loginPassword').value = '';
}

// --------- Login ---------
async function login(){
  const email = $('loginEmail').value.trim().toLowerCase();
  const password = $('loginPassword').value;
  const remember = $('rememberMe').checked;

  if(!email || !password) return alert('Please enter email and password.');

  const users = loadUsers();
  const user = users.find(u => u.email === email);
  if(!user) return alert('No account found. Please sign up.');

  const passHash = await sha256(password);
  if(passHash !== user.passHash) return alert('Incorrect password.');

  setSession(email, remember);
  location.href = 'dashboard.html';
}

// --------- Auto-redirect if session exists ---------
(function init(){
  // If already logged in, go straight to dashboard
  const session = getSession();
  if(session && session.email){
    // stay on login page if user explicitly logged out before? we just go to dashboard.
    // Uncomment the next line if you want to stay: return;
    // Otherwise:
    location.href = 'dashboard.html';
    return;
  }

  // Wire up buttons/links
  $('signupBtn').onclick = signup;
  $('loginBtn').onclick = login;
  $('goLogin').onclick = (e)=>{ e.preventDefault(); toggleForm('login'); };
  $('goSignup').onclick = (e)=>{ e.preventDefault(); toggleForm('signup'); };
})();
