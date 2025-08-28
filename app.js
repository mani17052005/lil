// --------- Keys ---------
const USERS_KEY = 'ht_users';      // array of {email, passHash, createdAt, profile:{name,age,gender,series:{...}}}
const SESSION_KEY = 'ht_session';  // {email, ts, remember}

// --------- Helpers ---------
const $ = (id) => document.getElementById(id);

function toggleForm(mode){
  const sign = $('signupForm');
  const log  = $('loginForm');
  if(mode === 'login'){ sign.style.display='none'; log.style.display='block'; }
  else { sign.style.display='block'; log.style.display='none'; }
}

// SHA-256 hash for password (frontend-only; for demo)
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
  localStorage.setItem(SESSION_KEY, JSON.stringify({email, ts: Date.now(), remember}));
}
function getSession(){
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
  catch { return null; }
}

// --------- Sign Up ---------
async function signup(){
  const name   = $('signupName').value.trim();
  const age    = $('signupAge').value.trim();
  const gender = $('signupGender').value;
  const email  = $('signupEmail').value.trim().toLowerCase();
  const password = $('signupPassword').value;

  if(!name || !age || !gender || !email || !password){
    return alert('Please fill all fields.');
  }

  const users = loadUsers();
  if(users.some(u => u.email === email)){
    alert('An account with this email already exists. Please login.');
    toggleForm('login');
    $('loginEmail').value = email;
    return;
  }

  const passHash = await sha256(password);

  // initial per-user data
  const profile = {
    name, age, gender,
    series: {
      glucose: [110, 118, 122, 130, 126],
      bpSys:   [118, 122, 126, 124, 120],
      bpDia:   [78,  80,  82,  81,  79 ],
      temp:    [36.6,36.8,37.0,36.7,36.8],
      heart:   [72,  78,  80,  76,  79 ]
    }
  };

  users.push({ email, passHash, createdAt: new Date().toISOString(), profile });
  saveUsers(users);

  alert('Account created! You can log in now.');
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

// --------- Init ---------
(function init(){
  const session = getSession();
  if(session && session.email){
    location.href = 'dashboard.html';
    return;
  }

  // Wire up
  $('signupBtn').onclick = signup;
  $('loginBtn').onclick = login;
  $('goLogin').onclick  = (e)=>{ e.preventDefault(); toggleForm('login'); };
  $('goSignup').onclick = (e)=>{ e.preventDefault(); toggleForm('signup'); };
})();
