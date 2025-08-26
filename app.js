function toggleForm(form) {
  if(form === 'signup') {
    document.getElementById('signupForm').style.display = 'block';
    document.getElementById('loginForm').style.display = 'none';
  } else {
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
  }
}

function signup() {
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  if(email && password) {
    localStorage.setItem('user', JSON.stringify({ email, password }));
    alert('Sign Up Successful! Please login.');
    toggleForm('login');
  } else {
    alert('Fill all fields!');
  }
}

function login() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const user = JSON.parse(localStorage.getItem('user'));
  if(user && user.email === email && user.password === password) {
    window.location.href = 'dashboard.html';
  } else {
    alert('Invalid credentials!');
  }
}
