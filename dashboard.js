const USERS_KEY = "ht_users";
const SESSION_KEY = "ht_session";

const loadUsers = () => JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
const saveUsers = (users) => localStorage.setItem(USERS_KEY, JSON.stringify(users));
const getSession = () => JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
const logout = () => { localStorage.removeItem(SESSION_KEY); location.href = "index.html"; };

// Session check
const session = getSession();
if (!session || !session.email) location.href = "index.html";

// Get current user
let users = loadUsers();
let user = users.find((u) => u.email === session.email);
if (!user) {
  alert("User not found!");
  logout();
}

// Profile info
function displayProfile() {
  document.getElementById("welcome").textContent = `Welcome ${user.profile.name} (${user.email})`;
  document.getElementById("profName").textContent = user.profile.name;
  document.getElementById("profAge").textContent = user.profile.age;
  document.getElementById("profGender").textContent = user.profile.gender;
}
displayProfile();

document.getElementById("logoutBtn").onclick = logout;

// ----- Edit Profile -----
const editForm = document.getElementById("editProfileForm");
const editBtn = document.getElementById("editProfileBtn");
const cancelEdit = document.getElementById("cancelEdit");

editBtn.onclick = () => {
  editForm.classList.remove("hidden");
  document.getElementById("editName").value = user.profile.name;
  document.getElementById("editAge").value = user.profile.age;
  document.getElementById("editGender").value = user.profile.gender;
};

cancelEdit.onclick = () => editForm.classList.add("hidden");

editForm.onsubmit = (e) => {
  e.preventDefault();
  user.profile.name = document.getElementById("editName").value.trim();
  user.profile.age = document.getElementById("editAge").value.trim();
  user.profile.gender = document.getElementById("editGender").value;

  // save changes
  let idx = users.findIndex((u) => u.email === user.email);
  users[idx] = user;
  saveUsers(users);

  displayProfile();
  editForm.classList.add("hidden");
  alert("Profile updated!");
};

// ----- Health Data -----
let series = user.profile.series;
let activeTab = "glucose";
let chart;

function setActiveTab(tab) {
  activeTab = tab;
  render();
}

document.querySelectorAll(".tabs button").forEach((btn) => {
  btn.onclick = () => setActiveTab(btn.dataset.tab);
});

// Render function
function render() {
  const ctx = document.getElementById("chart").getContext("2d");
  const labels = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5"];

  let data = [];
  let label = "";
  let unit = "";

  if (activeTab === "glucose") {
    data = series.glucose; label = "Glucose"; unit = "mg/dL";
  } else if (activeTab === "bp") {
    data = series.bpSys.map((s, i) => `${s}/${series.bpDia[i]}`); label = "Blood Pressure"; unit = "mmHg";
  } else if (activeTab === "temp") {
    data = series.temp; label = "Temperature"; unit = "°C";
  } else if (activeTab === "heart") {
    data = series.heart; label = "Heart Rate"; unit = "bpm";
  }

  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label,
        data: activeTab === "bp" ? series.bpSys : data,
        borderColor: "blue",
        fill: false,
      }],
    },
  });

  document.getElementById("metricInfo").textContent =
    `${label}: ${data[data.length - 1]} ${unit}`;
}

// Simulate updates
function tick() {
  const rand = (val, range) => val + (Math.random() * range - range / 2);

  series.glucose.push(Math.round(rand(series.glucose.slice(-1)[0], 10)));
  series.glucose.shift();

  series.bpSys.push(Math.round(rand(series.bpSys.slice(-1)[0], 5)));
  series.bpSys.shift();

  series.bpDia.push(Math.round(rand(series.bpDia.slice(-1)[0], 3)));
  series.bpDia.shift();

  series.temp.push(rand(series.temp.slice(-1)[0], 0.3).toFixed(1));
  series.temp.shift();

  series.heart.push(Math.round(rand(series.heart.slice(-1)[0], 5)));
  series.heart.shift();

  // Save back to user profile
  user.profile.series = series;
  let idx = users.findIndex((u) => u.email === user.email);
  users[idx] = user;
  saveUsers(users);

  render();
}

render();
setInterval(tick, 5000);
