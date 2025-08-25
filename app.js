function signUp() {
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  
  if(email && password) {
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userPassword', password);
    document.getElementById('signup-message').innerText = "Account created! You can log in now.";
  } else {
    alert("Please enter email and password");
  }
}

function login() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  const storedEmail = localStorage.getItem('userEmail');
  const storedPassword = localStorage.getItem('userPassword');
  
  if(email === storedEmail && password === storedPassword) {
    window.location.href = "dashboard.html";
  } else {
    document.getElementById('login-message').innerText = "Invalid credentials!";
  }
}

function showLogin() {
  document.getElementById('signup-container').style.display = "none";
  document.getElementById('login-container').style.display = "block";
}

function showSignup() {
  document.getElementById('signup-container').style.display = "block";
  document.getElementById('login-container').style.display = "none";
}
