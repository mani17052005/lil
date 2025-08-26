function toggleForm(mode){
  const sign = document.getElementById('signupForm');
  const log  = document.getElementById('loginForm');
  if(mode === 'signup'){ sign.style.display='block'; log.style.display='none'; }
  else { sign.style.display='none'; log.style.display='block'; }
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
  }else{
    alert('Invalid email or password.');
  }
}
