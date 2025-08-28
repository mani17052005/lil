const USERS_KEY = "ht_users";
const SESSION_KEY = "ht_session";

const loadUsers = () => JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
const saveUsers = (users) => localStorage.setItem(USERS_KEY, JSON.stringify(users));

// Hash function for password (simple for demo)
async function hash(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// Signup
document.getElementById("signupForm").onsubmit = async (e) => {
  e.preventDefault();
  let email = document.getElementById("signupEmail").value.trim();
  let pass = document.getElementById("signupPassword").value.trim();

  let users = loadUsers();
  if (users.find(u => u.email === email)) {
    return alert("User already exists!");
  }

  let hashed = await hash(pass);
  users.push({
    email,
    pass: hashed,
    profile: {
      name: "Unknown",
      age: "N/A",
      gender: "N/A",
      series: {
        glucose: [100, 105, 110, 108, 102],
        bpSys: [120, 122, 118, 121, 119],
        bpDia: [80, 82, 78, 79, 81],
        temp: [36.5, 36.6, 36.7, 36.6, 36.5],
        heart: [70, 72, 75, 74, 71]
      }
    }
  });
  saveUsers(users);
  alert("Signup successful! Please login.");
  e.target.reset();
};

// Login
document.getElementById("loginForm").onsubmit = async (e) => {
  e.preventDefault();
  let email = document.getElementById("loginEmail").value.trim();
  let pass = document.getElementById("loginPassword").value.trim();

  let users = loadUsers();
  let user = users.find(u => u.email === email);
  if (!user) return alert("User not found!");

  let hashed = await hash(pass);
  if (user.pass !== hashed) return alert("Wrong password!");

  localStorage.setItem(SESSION_KEY, JSON.stringify({ email }));
  location.href = "dashboard.html";
};
