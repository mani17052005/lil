/* ===============================
   Health Tracker — dashboard.js
   =============================== */
const SESSION_KEY = "ht_session";
const USERS_KEY = "ht_users";
const USERS_DATA_KEY = "ht_user_data";

const $ = (id) => document.getElementById(id);

// ---------- Session ----------
function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}
function logout() {
  localStorage.removeItem(SESSION_KEY);
  location.href = "index.html";
}

const session = getSession();
if (!session || !session.email) location.href = "index.html";

// ---------- Load User Profile ----------
function loadUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
}
const user = loadUsers().find((u) => u.email === session.email);
$("profileName").textContent = user?.name || session.email;
$("profileMeta").textContent =
  `${user?.age || "-"} yrs • ${user?.gender || "-"} • Blood: ${user?.blood || "-"}`;
$("logoutBtn").onclick = logout;

// ---------- Dark Mode ----------
$("modeBtn").onclick = () => {
  document.body.classList.toggle("bg-white");
  document.body.classList.toggle("text-black");
};

// ---------- Data Storage ----------
function loadUserBlob() {
  try {
    return JSON.parse(localStorage.getItem(USERS_DATA_KEY) || "{}");
  } catch {
    return {};
  }
}
function saveUserBlob(blob) {
  localStorage.setItem(USERS_DATA_KEY, JSON.stringify(blob));
}
function loadUserData(email) {
  const blob = loadUserBlob();
  return blob[email] || { readings: [], suggestions: [] };
}
function saveUserData(email, data) {
  const blob = loadUserBlob();
  blob[email] = data;
  saveUserBlob(blob);
}
let userData = loadUserData(session.email);

// ---------- Chart Data ----------
let labels = [];
const MAX_POINTS = 30;
let series = { glucose: [], bpSys: [], bpDia: [], temp: [], heart: [] };
let activeTab = "glucose";

const ctx = $("metricChart").getContext("2d");
let metricChart = new Chart(ctx, {
  type: "line",
  data: { labels, datasets: [] },
  options: { responsive: true, animation: false }
});
window.metricChart = metricChart;

// ---------- Status Helper ----------
function statusFor(metric, value) {
  switch (metric) {
    case "glucose":
      if (value < 70) return { text: "Low", cls: "text-yellow-400" };
      if (value > 140) return { text: "High", cls: "text-red-500" };
      return { text: "Normal", cls: "text-green-400" };
    case "bpSys":
      if (value < 90) return { text: "Low", cls: "text-yellow-400" };
      if (value > 140) return { text: "High", cls: "text-red-500" };
      return { text: "Normal", cls: "text-green-400" };
    case "temp":
      if (value < 36) return { text: "Low", cls: "text-yellow-400" };
      if (value > 38) return { text: "Fever", cls: "text-red-500" };
      return { text: "Normal", cls: "text-green-400" };
    case "heart":
      if (value < 60) return { text: "Low", cls: "text-yellow-400" };
      if (value > 100) return { text: "High", cls: "text-red-500" };
      return { text: "Normal", cls: "text-green-400" };
  }
}

// ---------- Tabs ----------
function setActiveTab(tab) {
  activeTab = tab;
  document.querySelectorAll(".tab").forEach((btn) =>
    btn.classList.toggle("bg-blue-600", btn.dataset.tab === tab)
  );

  if (tab === "history") {
    $("historySection").classList.remove("hidden");
    renderHistory();
  } else {
    $("historySection").classList.add("hidden");
    render();
  }
}
window.setActiveTab = setActiveTab;

// ---------- AI Suggestions ----------
function generateSuggestions() {
  const latest = {
    glucose: series.glucose.at(-1),
    bpSys: series.bpSys.at(-1),
    bpDia: series.bpDia.at(-1),
    temp: series.temp.at(-1),
    heart: series.heart.at(-1),
  };
  let msgs = [];

  if (latest.glucose > 140) msgs.push("⚠️ High glucose detected.");
  else if (latest.glucose < 70) msgs.push("⚠️ Low glucose detected.");
  else msgs.push("✅ Glucose normal.");

  if (latest.bpSys > 140 || latest.bpDia > 90) msgs.push("⚠️ High BP detected.");
  else if (latest.bpSys < 90) msgs.push("⚠️ Low BP detected.");
  else msgs.push("✅ BP normal.");

  if (latest.temp > 38) msgs.push("🤒 Fever detected.");
  else msgs.push("✅ Temperature normal.");

  if (latest.heart > 100) msgs.push("⚠️ High heart rate.");
  else if (latest.heart < 60) msgs.push("⚠️ Low heart rate.");
  else msgs.push("✅ Heart rate normal.");

  return msgs;
}

function updateSuggestionsPanel(msgs) {
  const ul = $("suggestionList");
  ul.innerHTML = "";
  msgs.forEach((m) => {
    const li = document.createElement("li");
    li.textContent = m;
    ul.appendChild(li);
  });
}

// ---------- Render ----------
function render() {
  const title = $("metricTitle");
  const valueEl = $("metricValue");
  const statusEl = $("metricStatus");
  const chartTitle = $("chartTitle");

  if (activeTab === "glucose") {
    const v = series.glucose.at(-1) ?? 0;
    title.textContent = "Glucose";
    valueEl.textContent = `${v} mg/dL`;
    const s = statusFor("glucose", v);
    statusEl.textContent = s.text; statusEl.className = s.cls;
    chartTitle.textContent = "Glucose Trend";
    metricChart.data.labels = labels;
    metricChart.data.datasets = [{ label: "Glucose", data: series.glucose, borderColor: "#00f" }];
  }
  if (activeTab === "bp") {
    const sVal = series.bpSys.at(-1) ?? 0, dVal = series.bpDia.at(-1) ?? 0;
    title.textContent = "Blood Pressure";
    valueEl.textContent = `${sVal}/${dVal} mmHg`;
    const st = statusFor("bpSys", sVal);
    statusEl.textContent = st.text; statusEl.className = st.cls;
    chartTitle.textContent = "BP Trend";
    metricChart.data.labels = labels;
    metricChart.data.datasets = [
      { label: "Systolic", data: series.bpSys, borderColor: "#f00" },
      { label: "Diastolic", data: series.bpDia, borderColor: "#0ff" }
    ];
  }
  if (activeTab === "temp") {
    const t = series.temp.at(-1) ?? 0;
    title.textContent = "Temperature";
    valueEl.textContent = `${t} °C`;
    const st = statusFor("temp", t);
    statusEl.textContent = st.text; statusEl.className = st.cls;
    chartTitle.textContent = "Temperature Trend";
    metricChart.data.labels = labels;
    metricChart.data.datasets = [{ label: "Temp", data: series.temp, borderColor: "#ff0" }];
  }
  if (activeTab === "heart") {
    const h = series.heart.at(-1) ?? 0;
    title.textContent = "Heart Rate";
    valueEl.textContent = `${h} BPM`;
    const st = statusFor("heart", h);
    statusEl.textContent = st.text; statusEl.className = st.cls;
    chartTitle.textContent = "Heart Rate Trend";
    metricChart.data.labels = labels;
    metricChart.data.datasets = [{ label: "Heart Rate", data: series.heart, borderColor: "#0f0" }];
  }

  metricChart.update();
}

// ---------- History ----------
function renderHistory() {
  const log = $("historyLog");
  log.innerHTML = "";
  if (!userData.readings.length) {
    log.innerHTML = "<p>No history yet.</p>";
    return;
  }
  userData.readings.slice(-50).reverse().forEach((r) => {
    const div = document.createElement("div");
    div.className = "border-b border-gray-600 p-2";
    div.innerHTML = `
      <div class="text-sm text-gray-400">${new Date(r.time).toLocaleString()}</div>
      <div>Glucose: ${r.glucose} | BP: ${r.bpSys}/${r.bpDia} | Temp: ${r.temp} | Heart: ${r.heart}</div>
    `;
    log.appendChild(div);
  });
}

$("downloadCsvBtn").onclick = () => {
  if (!userData.readings.length) return alert("No history to export.");
  const rows = [["Time", "Glucose", "BP Sys", "BP Dia", "Temp", "Heart"]];
  userData.readings.forEach((r) => {
    rows.push([r.time, r.glucose, r.bpSys, r.bpDia, r.temp, r.heart]);
  });
  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "history.csv"; a.click();
  URL.revokeObjectURL(url);
};

// ---------- Data Simulation ----------
function addPoint(label, g, s, d, t, h) {
  labels.push(label);
  if (labels.length > MAX_POINTS) labels.shift();
  series.glucose.push(g); if (series.glucose.length > MAX_POINTS) series.glucose.shift();
  series.bpSys.push(s);   if (series.bpSys.length > MAX_POINTS) series.bpSys.shift();
  series.bpDia.push(d);   if (series.bpDia.length > MAX_POINTS) series.bpDia.shift();
  series.temp.push(t);    if (series.temp.length > MAX_POINTS) series.temp.shift();
  series.heart.push(h);   if (series.heart.length > MAX_POINTS) series.heart.shift();
}

function tick() {
  const now = new Date();
  const timeLabel = now.toLocaleTimeString();

  const latest = {
    glucose: Math.floor(85 + Math.random() * 80),
    bpSys: Math.floor(105 + Math.random() * 40),
    bpDia: Math.floor(65 + Math.random() * 25),
    temp: +(36 + Math.random() * 2.8).toFixed(1),
    heart: Math.floor(55 + Math.random() * 65),
  };

  addPoint(timeLabel, latest.glucose, latest.bpSys, latest.bpDia, latest.temp, latest.heart);

  const suggs = generateSuggestions();
  updateSuggestionsPanel(suggs);

  userData.readings.push({ time: now.toISOString(), ...latest });
  if (userData.readings.length > 500) userData.readings.shift();
  userData.suggestions.push({ time: now.toISOString(), text: suggs });
  if (userData.suggestions.length > 200) userData.suggestions.shift();
  saveUserData(session.email, userData);

  render();
}

// ---------- Init ----------
setActiveTab("glucose");
(function seed() {
  for (let i = 5; i > 0; i--) {
    const t = new Date(Date.now() - i * 60000);
    addPoint(t.toLocaleTimeString(),
      Math.floor(95 + Math.random() * 40),
      Math.floor(110 + Math.random() * 20),
      Math.floor(70 + Math.random() * 12),
      +(36 + Math.random() * 1.2).toFixed(1),
      Math.floor(60 + Math.random() * 30)
    );
  }
  const initS = generateSuggestions();
  updateSuggestionsPanel(initS);
  render();
})();
setInterval(tick, 2000);
