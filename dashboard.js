const USERS_KEY = "ht_users";
const SESSION_KEY = "ht_session";

const loadUsers = () => JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
const saveUsers = (users) => localStorage.setItem(USERS_KEY, JSON.stringify(users));
const getSession = () => JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
const logout = () => { localStorage.removeItem(SESSION_KEY); location.href = "index.html"; };

// Check session
const session = getSession();
if (!session || !session.email) location.href = "index.html";

// Load user
let users = loadUsers();
let user = users.find(u => u.email === session.email);
if (!user) logout();

document.getElementById("logoutBtn").onclick = logout;

// Profile
function displayProfile() {
  document.getElementById("welcome").textContent = `Welcome ${user.profile.name}`;
  document.getElementById("profName").textContent = user.profile.name;
  document.getElementById("profAge").textContent = user.profile.age;
  document.getElementById("profGender").textContent = user.profile.gender;
}
displayProfile();

// Edit profile
const editForm = document.getElementById("editProfileForm");
document.getElementById("editProfileBtn").onclick = () => {
  editForm.classList.remove("hidden");
  document.getElementById("editName").value = user.profile.name;
  document.getElementById("editAge").value = user.profile.age;
  document.getElementById("editGender").value = user.profile.gender;
};
document.getElementById("cancelEdit").onclick = () => editForm.classList.add("hidden");

editForm.onsubmit = (e) => {
  e.preventDefault();
  user.profile.name = document.getElementById("editName").value.trim();
  user.profile.age = document.getElementById("editAge").value.trim();
  user.profile.gender = document.getElementById("editGender").value;

  let idx = users.findIndex(u => u.email === user.email);
  users[idx] = user;
  saveUsers(users);

  displayProfile();
  editForm.classList.add("hidden");
  alert("Profile updated!");
};

// Metrics
let series = user.profile.series;
let activeTab = "glucose";
let chart;

function setActiveTab(tab) {
  activeTab = tab;
  render();
}
document.querySelectorAll(".tabs button").forEach(btn => {
  btn.onclick = () => setActiveTab(btn.dataset.tab);
});

function render() {
  const ctx = document.getElementById("chart").getContext("2d");
  const labels = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5"];

  let data, label, unit;
  if (activeTab === "glucose") { data = series.glucose; label="Glucose"; unit="mg/dL"; }
  else if (activeTab === "bp") { data = series.bpSys; label="Blood Pressure (Sys)"; unit="mmHg"; }
  else if (activeTab === "temp") { data = series.temp; label="Temperature"; unit="°C"; }
  else { data = series.heart; label="Heart Rate"; unit="bpm"; }

  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: "line",
    data: { labels, datasets: [{ label, data, borderColor: "blue", fill: false }] }
  });

  document.getElementById("metricInfo").textContent =
    `${label}: ${data[data.length-1]} ${unit}`;
}

function tick() {
  const rand = (v, r) => v + (Math.random() * r - r/2);

  series.glucose.push(Math.round(rand(series.glucose.slice(-1)[0], 10))); series.glucose.shift();
  series.bpSys.push(Math.round(rand(series.bpSys.slice(-1)[0], 5))); series.bpSys.shift();
  series.bpDia.push(Math.round(rand(series.bpDia.slice(-1)[0], 3))); series.bpDia.shift();
  series.temp.push(rand(series.temp.slice(-1)[0], 0.3).toFixed(1)); series.temp.shift();
  series.heart.push(Math.round(rand(series.heart.slice(-1)[0], 5))); series.heart.shift();

  user.profile.series = series;
  users[users.findIndex(u => u.email === user.email)] = user;
  saveUsers(users);

  render();
}

render();
setInterval(tick, 5000);
