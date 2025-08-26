function toggleForm(mode){
  document.getElementById('signupForm').style.display = (mode === 'signup') ? 'block' : 'none';
  document.getElementById('loginForm').style.display = (mode === 'login') ? 'block' : 'none';
}

function signup(){
  const email = document.getElementById('signupEmail').value.trim();
  const pass  = document.getElementById('signupPassword').value.trim();
  if(!email || !pass){ alert('Please fill all fields.'); return; }
  localStorage.setItem('ht_user', JSON.stringify({email, pass}));
  alert('Account created! Please login.');
  toggleForm('login');
}

function login(){
  const email = document.getElementById('loginEmail').value.trim();
  const pass  = document.getElementById('loginPassword').value.trim();
  const user = JSON.parse(localStorage.getItem('ht_user') || 'null');
  if(user && user.email === email && user.pass === pass){
    location.href = 'dashboard.html';
  } else {
    alert('Invalid email or password.');
  }
}