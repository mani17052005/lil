const USERS_KEY = 'ht_users';
const SESSION_KEY = 'ht_session';

const $ = (id) => document.getElementById(id);

function toggleForm(mode){
  $('signupForm').style.display = mode === 'login' ? 'none' : 'block';
  $('loginForm').style.display  = mode === 'login' ? 'block' : 'none';
}

// Load & Save Users
function loadUsers(){ try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch { return []; } }
function saveUsers(users){ localStorage.setItem(USERS_KEY, JSON.stringify(users)); }
function setSession(user){ localStorage.setItem(SESSION_KEY, JSON.stringify(user)); }
function getSession(){ try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; } }

// Signup
function signup(){
  const user = {
    name: $('signupName').value,
    age: $('signupAge').value,
    gender: $('signupGender').value,
    blood: $('signupBlood').value,
    email: $('signupEmail').value.toLowerCase(),
    password: $('signupPassword').value
  };

  if(!user.name || !user.age || !user.gender || !user.blood || !user.email || !user.password){
    return alert('Please fill all fields.');
  }

  const users = loadUsers();
  if(users.some(u => u.email === user.email)){
    alert('Account already exists! Please login.');
    toggleForm('login');
    $('loginEmail').value = user.email;
    return;
  }
  users.push(user);
  saveUsers(users);
  alert('Account created! You can login now.');
  toggleForm('login');
  $('loginEmail').value = user.email;
}

// Login
function login(){
  const email = $('loginEmail').value.toLowerCase();
  const password = $('loginPassword').value;
  if(!email || !password) return alert('Enter email and password.');

  const users = loadUsers();
  const user = users.find(u => u.email === email && u.password === password);
  if(!user) return alert('Invalid email or password.');

  setSession(user);
  location.href = 'dashboard.html';
}

// Init
(function init(){
  const session = getSession();
  if(session && session.email) { location.href = 'dashboard.html'; return; }

  $('signupBtn').onclick = signup;
  $('loginBtn').onclick = login;
  $('goLogin').onclick = e => { e.preventDefault(); toggleForm('login'); };
  $('goSignup').onclick = e => { e.preventDefault(); toggleForm('signup'); };
})();
