const loginBox = document.getElementById('login-box');
const signupBox = document.getElementById('signup-box');
const showSignup = document.getElementById('showSignup');
const showLogin = document.getElementById('showLogin');

showSignup.addEventListener('click', () => {
  loginBox.classList.add('hidden');
  signupBox.classList.remove('hidden');
});

showLogin.addEventListener('click', () => {
  signupBox.classList.add('hidden');
  loginBox.classList.remove('hidden');
});

document.getElementById('signupBtn').addEventListener('click', () => {
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;

  if (email && password) {
    localStorage.setItem(email, password);
    alert('Sign up successful!');
    signupBox.classList.add('hidden');
    loginBox.classList.remove('hidden');
  } else {
    alert('Fill all fields');
  }
});

document.getElementById('loginBtn').addEventListener('click', () => {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  const storedPassword = localStorage.getItem(email);
  if (storedPassword && storedPassword === password) {
    alert('Login successful!');
  } else {
    alert('Invalid email or password');
  }
});
