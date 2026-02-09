// ============================
// CA Foundation Tracker + Public Discussion Forum (FULL)
// UPDATED:
// ✅ Public Study Room replaced with Public Discussion Forum
// ✅ No Room Create/Join/Copy link logic
// ✅ One global public forum (Firestore)
// ✅ Forum screen: input on top, messages below
// ✅ Chat ordering uses createdAtMs (reliable)
// ✅ Google Sheet logging restored (Apps Script Web App)
// ============================

// ----------------------------
// ✅ Google Sheet Logging (Apps Script Web App URL)
// ----------------------------
// IMPORTANT: Paste your deployed Web App /exec URL here
// Example: https://script.google.com/macros/s/XXXXX/exec
const APPS_SCRIPT_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbxvAy_BvXUTcOknFET8ppT6N1r0_eRmcNlCt_KJEijRPsw_ldxsmKycW_nwvxVSc-faTA/exec";

async function logUserToGoogleSheet(name, email){
  if(!APPS_SCRIPT_WEBAPP_URL || APPS_SCRIPT_WEBAPP_URL.includes("PASTE_")) return;

  const payload = {
    name,
    email,
    source: "CA Foundation Tracker",
    url: location.href,
    timestamp: new Date().toLocaleString()
  };

  // Using no-cors so browsers won't block the request due to CORS
  await fetch(APPS_SCRIPT_WEBAPP_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

// ----------------------------
// Quote of the Day
// ----------------------------
const QUOTES = [
  "Discipline is choosing between what you want now and what you want most.",
  "Success is built on small efforts repeated daily.",
  "You don’t have to be extreme, just consistent.",
  "The pain of discipline weighs ounces. The pain of regret weighs tons.",
  "Study while others sleep. Build while others relax.",
  "Your future self is watching you right now.",
  "Focus on progress, not perfection.",
  "Small daily improvements create massive results.",
  "Dream big. Work quietly. Stay consistent.",
  "Every page you study is one step closer."
];

function loadDailyQuote(){
  const today = new Date();
  const dayIndex = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
  const quote = QUOTES[dayIndex % QUOTES.length];
  const el = document.getElementById("quoteText");
  if(el) el.textContent = quote;
}

// ----------------------------
// DATA (topics)
// ----------------------------
const SUBJECTS = {
  "Accounting": [
    "Theoretical Framework",
    "Accounting Process",
    "Bank Reconciliation Statement",
    "Inventories",
    "Depreciation and Amortisation",
    "Bills of Exchange and Promissory Notes",
    "Final Accounts of Sole Proprietors",
    "Financial Statements of Not-for-Profit Organizations",
    "Accounts from Incomplete Records",
    "Partnership and LLP Accounts",
    "Company Accounts"
  ],
  "Business Laws": [
    "Indian Regulatory Framework",
    "The Indian Contract Act, 1872",
    "The Sale of Goods Act, 1930",
    "The Indian Partnership Act, 1932",
    "The Limited Liability Partnership Act, 2008",
    "The Companies Act, 2013",
    "The Negotiable Instruments Act, 1881"
  ],
  "Quantitative Aptitude": [
    "Ratio, Proportion, Indices & Logarithms",
    "Equations",
    "Linear Inequalities",
    "Mathematics of Finance",
    "Permutations and Combinations",
    "Sequence and Series",
    "Sets, Relations & Functions",
    "Differential & Integral Calculus",
    "Number Series, Coding-Decoding, Odd Man Out",
    "Direction Tests",
    "Seating Arrangements",
    "Blood Relations",
    "Statistical Description of Data & Sampling",
    "Measures of Central Tendency & Dispersion",
    "Probability",
    "Theoretical Distributions"
  ],
  "Business Economics": [
    "Introduction to Business Economics",
    "Theory of Demand and Supply",
    "Theory of Production and Cost",
    "Price Determination in Different Markets",
    "Determination of National Income",
    "Business Cycles",
    "Public Finance",
    "Money Market",
    "International Trade",
    "Indian Economy"
  ]
};

const STORAGE_KEY = "ca_foundation_tracker_v2";
const EXAM_DATE_KEY = "ca_exam_date_v3";
const TODO_KEY = "ca_todo_list_v1";
const THEME_KEY = "ca_theme_v1";
const USER_KEY = "ca_user_v1";

const $ = (id) => document.getElementById(id);
function safeParse(x){ try { return JSON.parse(x); } catch { return null; } }

// ----------------------------
// User capture
// ----------------------------
function loadUser(){
  const raw = localStorage.getItem(USER_KEY);
  return raw ? safeParse(raw) : null;
}
function saveUser(user){
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}
function isValidEmail(email){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function openUserCapture(){ $("userModal")?.classList.remove("hidden"); }
function closeUserCapture(){ $("userModal")?.classList.add("hidden"); }

function bindUserCapture(){
  const form = $("userForm");
  const nameEl = $("userName");
  const emailEl = $("userEmail");
  const msgEl = $("userMsg");
  if(!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = (nameEl?.value || "").trim();
    const email = (emailEl?.value || "").trim();

    if(!name){
      if(msgEl) msgEl.textContent = "Please enter your name.";
      return;
    }
    if(!isValidEmail(email)){
      if(msgEl) msgEl.textContent = "Please enter a valid email.";
      return;
    }

    saveUser({ name, email });

    // ✅ LOG TO GOOGLE SHEET (non-blocking; still works even if it fails)
    try{
      await logUserToGoogleSheet(name, email);
    }catch(err){
      console.warn("Google Sheet log failed:", err);
    }

    if(msgEl) msgEl.textContent = "Saved ✅";
    closeUserCapture();
  });
}
function initUserCapture(){
  bindUserCapture();
  if(!loadUser()) openUserCapture();
}

// ----------------------------
// Theme
// ----------------------------
function applyTheme(theme){
  document.body.setAttribute("data-theme", theme);

  const icon = $("themeIcon");
  const text = $("themeText");
  if(icon) icon.textContent = (theme === "light") ? "☀️" : "🌙";
  if(text) text.textContent = (theme === "light") ? "Light" : "Dark";

  localStorage.setItem(THEME_KEY, theme);
}
function initTheme(){
  const saved = localStorage.getItem(THEME_KEY);
  const theme = (saved === "light" || saved === "dark") ? saved : "dark";
  applyTheme(theme);

  $("themeToggle")?.addEventListener("click", () => {
    const current = document.body.getAttribute("data-theme") || "dark";
    applyTheme(current === "dark" ? "light" : "dark");
  });
}

// ----------------------------
// Progress localStorage
// ----------------------------
function defaultState(){
  const st = {};
  for(const subj of Object.keys(SUBJECTS)){
    st[subj] = Array(SUBJECTS[subj].length).fill(false);
  }
  return st;
}
function loadState(){
  const raw = localStorage.getItem(STORAGE_KEY);
  const parsed = raw ? safeParse(raw) : null;
  const base = defaultState();
  if(!parsed || typeof parsed !== "object") return base;

  for(const subj of Object.keys(base)){
    const arr = Array.isArray(parsed[subj]) ? parsed[subj] : [];
    base[subj] = base[subj].map((_, i) => Boolean(arr[i]));
  }
  return base;
}
function saveState(state){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
function statsFor(state, subj){
  const arr = state[subj] || [];
  const done = arr.filter(Boolean).length;
  const total = arr.length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { done, total, pct };
}
function overallStats(state){
  let done = 0, total = 0;
  for(const subj of Object.keys(SUBJECTS)){
    const s = statsFor(state, subj);
    done += s.done;
    total += s.total;
  }
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { done, total, pct };
}
function setRing(arcEl, pctEl, pct){
  const C = 282.74;
  arcEl.style.strokeDashoffset = String(C - (pct / 100) * C);
  pctEl.textContent = `${pct}%`;
}
function cssId(name){
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

// ----------------------------
// Countdown
// ----------------------------
function pad2(n){ return String(n).padStart(2, "0"); }

function isoToDDMMYYYY(iso){
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if(!m) return "";
  return `${m[3]}-${m[2]}-${m[1]}`;
}
function ddmmyyyyToISO(ddmmyyyy){
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(ddmmyyyy);
  if(!m) return null;

  const dd = Number(m[1]), mm = Number(m[2]), yyyy = Number(m[3]);
  if(mm < 1 || mm > 12) return null;

  const d = new Date(`${m[3]}-${m[2]}-${m[1]}T00:00:00`);
  if(Number.isNaN(d.getTime())) return null;
  if(d.getFullYear() !== yyyy || (d.getMonth() + 1) !== mm || d.getDate() !== dd) return null;

  return `${m[3]}-${m[2]}-${m[1]}`;
}
function getExamISO(){ return localStorage.getItem(EXAM_DATE_KEY); }
function setExamISO(iso){
  localStorage.setItem(EXAM_DATE_KEY, iso);
  updateCountdownDisplay();
}

let countdownInterval = null;

function updateCountdownDisplay(){
  const iso = getExamISO();
  const el = $("countdownTime");
  if(!el) return;

  if(countdownInterval){
    clearInterval(countdownInterval);
    countdownInterval = null;
  }

  if(!iso){
    el.textContent = "SET EXAM DATE";
    return;
  }

  function tick(){
    const target = new Date(iso + "T09:00:00");
    const now = new Date();
    let diff = target - now;
    if(diff < 0) diff = 0;

    const totalSec = Math.floor(diff / 1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    el.textContent = `${days}d ${pad2(hours)}:${pad2(mins)}:${pad2(secs)}`;
  }

  tick();
  countdownInterval = setInterval(tick, 1000);
}

function promptSetExamDate(){
  const iso = getExamISO();
  const current = iso ? isoToDDMMYYYY(iso) : "";
  const input = prompt("Set exam date (DD-MM-YYYY):", current);
  if(!input) return;

  const newISO = ddmmyyyyToISO(input.trim());
  if(!newISO){
    alert("Invalid date. Use DD-MM-YYYY (example: 08-05-2026).");
    return;
  }
  setExamISO(newISO);
}

// ----------------------------
// Navigation
// ----------------------------
let currentSubject = null;

function showHome(){
  $("subjectScreen")?.classList.add("hidden");
  $("forumScreen")?.classList.add("hidden");
  $("homeScreen")?.classList.remove("hidden");
  currentSubject = null;
  renderHome();
}
function openSubject(subj){
  currentSubject = subj;
  $("homeScreen")?.classList.add("hidden");
  $("forumScreen")?.classList.add("hidden");
  $("subjectScreen")?.classList.remove("hidden");
  renderSubject();
}

// (rest of your file remains EXACTLY same from here)
// ✅ Your Timer, Todo, Forum Firestore code and DOMContentLoaded stay unchanged
// I’m keeping them as-is below:

function renderHome(){
  const state = loadState();
  const overall = overallStats(state);
  const overallEl = $("overallBelow");
  if(overallEl){
    overallEl.innerHTML = `Overall: ${overall.pct}% <span>(${overall.done}/${overall.total})</span>`;
  }

  const grid = $("metersGrid");
  if(!grid) return;
  grid.innerHTML = "";

  for(const subj of Object.keys(SUBJECTS)){
    const { done, total, pct } = statsFor(state, subj);
    const id = cssId(subj);

    const card = document.createElement("div");
    card.className = "meterCard";

    card.innerHTML = `
      <div class="ring" aria-label="${subj} progress">
        <div class="pct" id="pct_${id}">${pct}%</div>
        <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r="45" fill="none"
            stroke="rgba(255,255,255,.22)" stroke-width="10"></circle>
          <circle id="arc_${id}" cx="60" cy="60" r="45" fill="none"
            stroke="var(--green)" stroke-width="10"
            stroke-linecap="round"
            stroke-dasharray="282.74"
            stroke-dashoffset="282.74"
            transform="rotate(-90 60 60)"></circle>
        </svg>
      </div>

      <div class="subjectName">${subj}</div>
      <div class="doneText">${done}/${total} done</div>
    `;

    grid.appendChild(card);

    const arc = card.querySelector(`#arc_${id}`);
    const pctEl = card.querySelector(`#pct_${id}`);
    if(arc && pctEl) setRing(arc, pctEl, pct);

    card.querySelector(".subjectName")?.addEventListener("click", () => openSubject(subj));
  }
}

function renderSubject(){
  const state = loadState();
  const subj = currentSubject;
  if(!subj) return;

  $("subjectTitle") && ($("subjectTitle").textContent = subj);

  const { done, total, pct } = statsFor(state, subj);
  $("subjectRight") && ($("subjectRight").textContent = `${done}/${total} done • ${pct}%`);

  const wrap = $("topics");
  if(!wrap) return;
  wrap.innerHTML = "";

  SUBJECTS[subj].forEach((topic, idx) => {
    const row = document.createElement("div");
    row.className = "topicRow";

    row.innerHTML = `
      <div class="topicName">${topic}</div>
      <input type="checkbox" id="cb_${idx}" />
    `;

    const cb = row.querySelector(`#cb_${idx}`);
    cb.checked = Boolean(state[subj][idx]);

    cb.addEventListener("change", () => {
      const newState = loadState();
      newState[subj][idx] = cb.checked;
      saveState(newState);

      const s = statsFor(newState, subj);
      $("subjectRight") && ($("subjectRight").textContent = `${s.done}/${s.total} done • ${s.pct}%`);

      const overall = overallStats(newState);
      const overallEl = $("overallBelow");
      if(overallEl){
        overallEl.innerHTML = `Overall: ${overall.pct}% <span>(${overall.done}/${overall.total})</span>`;
      }
    });

    wrap.appendChild(row);
  });
}

// ----------------------------
// Timer + Alarm
// ----------------------------
let timerInterval = null;
let remainingSeconds = 0;
let running = false;
let alarmInterval = null;
let alarmCtx = null;

function startAlarmLoop(){
  stopAlarmLoop();
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  alarmCtx = new AudioCtx();
  alarmCtx.resume?.();

  const beepDuration = 0.08;
  const gap = 0.10;
  const beepsPerCycle = 4;

  function playPattern(){
    const startAt = alarmCtx.currentTime + 0.02;
    for(let i = 0; i < beepsPerCycle; i++){
      const t0 = startAt + i * (beepDuration + gap);
      const osc = alarmCtx.createOscillator();
      const gain = alarmCtx.createGain();

      osc.type = "square";
      osc.frequency.value = 900;

      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(0.16, t0 + 0.01);
      gain.gain.linearRampToValueAtTime(0, t0 + beepDuration);

      osc.connect(gain);
      gain.connect(alarmCtx.destination);
      osc.start(t0);
      osc.stop(t0 + beepDuration);
    }
  }

  playPattern();
  const cycleMs = beepsPerCycle * (beepDuration + gap) * 1000;
  alarmInterval = setInterval(playPattern, cycleMs);
}
function stopAlarmLoop(){
  if(alarmInterval){ clearInterval(alarmInterval); alarmInterval = null; }
  if(alarmCtx){ alarmCtx.close(); alarmCtx = null; }
}
function showAlarmPopup(){
  $("alarmOverlay")?.classList.remove("hidden");
  startAlarmLoop();
}
function hideAlarmPopup(){
  stopAlarmLoop();
  $("alarmOverlay")?.classList.add("hidden");
}
function renderTimer(){
  const timerBig = $("timerBig");
  if(!timerBig) return;
  const m = Math.floor(remainingSeconds / 60);
  const s = remainingSeconds % 60;
  timerBig.textContent = `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}
function setButtonsState(){
  $("pauseTimerBtn") && ($("pauseTimerBtn").disabled = !running);
  $("resetTimerBtn") && ($("resetTimerBtn").disabled = running ? false : (remainingSeconds === 0));
}
function openTimer(){ $("timerModal")?.classList.remove("hidden"); if(!running) renderTimer(); }
function closeTimer(){ $("timerModal")?.classList.add("hidden"); }

function startTimer(){
  const m = Math.max(0, Number($("timerMin")?.value || 0));
  const s = Math.min(59, Math.max(0, Number($("timerSec")?.value || 0)));
  const timerInputs = $("timerInputs");
  const timerHint = $("timerHint");

  if(!running && remainingSeconds === 0) remainingSeconds = (m * 60) + s;
  if(remainingSeconds <= 0){
    if(timerHint) timerHint.textContent = "Please set a time greater than 0.";
    return;
  }

  running = true;
  if(timerInputs){ timerInputs.style.opacity = "0.55"; timerInputs.style.pointerEvents = "none"; }
  if(timerHint) timerHint.textContent = "Timer running… Focus!";
  setButtonsState();
  renderTimer();

  if(timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    remainingSeconds -= 1;
    if(remainingSeconds <= 0){
      remainingSeconds = 0;
      renderTimer();
      clearInterval(timerInterval);
      timerInterval = null;
      running = false;

      if(timerInputs){ timerInputs.style.opacity = "1"; timerInputs.style.pointerEvents = "auto"; }
      setButtonsState();
      showAlarmPopup();
      if(timerHint) timerHint.textContent = "Time finished. Set again or restart.";
      return;
    }
    renderTimer();
  }, 1000);
}
function pauseTimer(){
  if(!running) return;
  running = false;
  if(timerInterval){ clearInterval(timerInterval); timerInterval = null; }
  $("timerInputs") && (($("timerInputs").style.opacity = "1"), ($("timerInputs").style.pointerEvents = "auto"));
  $("timerHint") && ($("timerHint").textContent = "Paused. Press Start to continue.");
  setButtonsState();
}
function resetTimer(){
  running = false;
  if(timerInterval){ clearInterval(timerInterval); timerInterval = null; }
  remainingSeconds = 0;
  $("timerInputs") && (($("timerInputs").style.opacity = "1"), ($("timerInputs").style.pointerEvents = "auto"));
  renderTimer();
  $("timerHint") && ($("timerHint").textContent = "Reset. Set time and press Start.");
  setButtonsState();
}

// ----------------------------
// To-Do
// ----------------------------
function escapeHTML(str){
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function loadTodos(){
  const raw = localStorage.getItem(TODO_KEY);
  try { return raw ? JSON.parse(raw) : []; } catch { return []; }
}
function saveTodos(todos){
  localStorage.setItem(TODO_KEY, JSON.stringify(todos));
}
function renderTodos(){
  const listEl = $("todoList");
  if(!listEl) return;

  const todos = loadTodos();
  listEl.innerHTML = "";

  todos.forEach((task, index) => {
    const row = document.createElement("div");
    row.className = "todoItem";
    row.innerHTML = `
      <span>${escapeHTML(task)}</span>
      <button type="button" aria-label="Delete task">✕</button>
    `;

    row.querySelector("button").addEventListener("click", () => {
      const updated = loadTodos();
      updated.splice(index, 1);
      saveTodos(updated);
      renderTodos();
    });

    listEl.appendChild(row);
  });
}
function bindTodo(){
  $("addTodoBtn")?.addEventListener("click", () => {
    const input = $("todoInput");
    const value = (input?.value || "").trim();
    if(!value) return;
    const todos = loadTodos();
    todos.push(value);
    saveTodos(todos);
    input.value = "";
    renderTodos();
  });

  $("todoInput")?.addEventListener("keydown", (e) => {
    if(e.key === "Enter") $("addTodoBtn")?.click();
  });
}

// ============================
// ✅ PUBLIC DISCUSSION FORUM (Firestore)
// ============================

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBtwjeGsQfrT8kBRyA45d1ajwFX0q8qTWk",
  authDomain: "ca-study-rooms.firebaseapp.com",
  projectId: "ca-study-rooms",
  storageBucket: "ca-study-rooms.appspot.com",
  messagingSenderId: "95273803267",
  appId: "1:95273803267:web:9795448f0fffff79e98b836"
};

let db = null;
let unsubForum = null;

// ✅ single global forum id
const FORUM_ID = "public_discussion_forum";

function setForumUIEnabled(enabled){
  $("forumInput") && ($("forumInput").disabled = !enabled);
  $("forumSendBtn") && ($("forumSendBtn").disabled = !enabled);
}
function setForumStatus(text){ $("forumStatus") && ($("forumStatus").textContent = text); }

function formatTimeFromMs(ms){
  if(!ms) return "";
  try{
    return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }catch{
    return "";
  }
}

function renderForumMessages(msgs){
  const list = $("forumMessages");
  if(!list) return;

  list.innerHTML = msgs.map(m => {
    const name = escapeHTML(m.name || "Student");
    const text = escapeHTML(m.text || "");
    const time = escapeHTML(formatTimeFromMs(m.createdAtMs));
    return `
      <div class="chatMsg">
        <div class="chatMsgTop">
          <div class="chatMsgName">${name}</div>
          <div class="chatMsgTime">${time}</div>
        </div>
        <div class="chatMsgText">${text}</div>
      </div>
    `;
  }).join("");

  list.scrollTop = list.scrollHeight;
}

async function initFirebase(){
  if(db) return db;

  const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js");
  const { getFirestore } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js");

  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  return db;
}

// ✅ Open forum screen
function showForum(){
  $("homeScreen")?.classList.add("hidden");
  $("subjectScreen")?.classList.add("hidden");
  $("forumScreen")?.classList.remove("hidden");

  connectForum().catch(err => {
    console.error("Forum connect failed:", err);
    alert("Forum connect failed: " + (err?.message || String(err)));
  });
}

function hideForum(){
  $("forumScreen")?.classList.add("hidden");
  showHome();
}

async function connectForum(){
  try{
    await initFirebase();

    const {
      doc, setDoc,
      collection, query, orderBy, limit, onSnapshot
    } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js");

    if(unsubForum){ unsubForum(); unsubForum = null; }

    await setDoc(doc(db, "forums", FORUM_ID), { createdAtMs: Date.now() }, { merge: true });

    setForumStatus("Live ✅");
    setForumUIEnabled(true);

    const q = query(
      collection(db, "forums", FORUM_ID, "messages"),
      orderBy("createdAtMs", "desc"),
      limit(120)
    );

    unsubForum = onSnapshot(q, (snap) => {
      const docs = snap.docs.slice().reverse().map(d => ({ id: d.id, ...d.data() }));
      renderForumMessages(docs);
    }, (err) => {
      console.error("Forum listener error:", err);
      alert("Forum listener failed: " + err.message);
      setForumStatus("Offline");
      setForumUIEnabled(false);
    });

  }catch(err){
    console.error("CONNECT FORUM FAILED:", err);
    setForumStatus("Offline");
    setForumUIEnabled(false);
    throw err;
  }
}

async function sendForumMessage(){
  const input = $("forumInput");
  const text = (input?.value || "").trim();
  if(!text) return;

  const user = loadUser();
  const name = user?.name ? String(user.name).slice(0, 30) : "Student";

  input.value = "";

  try{
    await initFirebase();
    const { collection, addDoc } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js");

    await addDoc(collection(db, "forums", FORUM_ID, "messages"), {
      name,
      text: text.slice(0, 220),
      createdAtMs: Date.now()
    });

  }catch(err){
    console.error("FORUM SEND FAILED:", err);
    alert("Send failed: " + err.message);
    setForumStatus("Send failed");
    setTimeout(() => setForumStatus("Live ✅"), 1200);
  }
}

function bindForumUI(){
  $("forumNavBtn")?.addEventListener("click", showForum);
  $("forumBackBtn")?.addEventListener("click", hideForum);

  $("forumSendBtn")?.addEventListener("click", sendForumMessage);
  $("forumInput")?.addEventListener("keydown", (e) => {
    if(e.key === "Enter") sendForumMessage();
  });

  setForumStatus("Offline");
  setForumUIEnabled(false);
}

// ----------------------------
// DOM Ready
// ----------------------------
document.addEventListener("DOMContentLoaded", async () => {
  initTheme();
  initUserCapture();

  loadDailyQuote();
  renderHome();
  updateCountdownDisplay();
  showHome();

  $("countdownPill")?.addEventListener("click", promptSetExamDate);

  $("doneBtn")?.addEventListener("click", showHome);
  $("backBtn")?.addEventListener("click", showHome);

  $("markAll")?.addEventListener("click", () => {
    if(!currentSubject) return;
    const state = loadState();
    state[currentSubject] = Array(SUBJECTS[currentSubject].length).fill(true);
    saveState(state);
    renderSubject();
    renderHome();
  });

  $("clearAll")?.addEventListener("click", () => {
    if(!currentSubject) return;
    const state = loadState();
    state[currentSubject] = Array(SUBJECTS[currentSubject].length).fill(false);
    saveState(state);
    renderSubject();
    renderHome();
  });

  $("resetAll")?.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    if(currentSubject) renderSubject();
    renderHome();
  });

  // Timer
  $("openTimerBtn")?.addEventListener("click", openTimer);
  $("closeTimerBtn")?.addEventListener("click", closeTimer);

  $("timerModal")?.addEventListener("click", (e) => {
    if(e.target === $("timerModal")) closeTimer();
  });

  $("startTimerBtn")?.addEventListener("click", startTimer);
  $("pauseTimerBtn")?.addEventListener("click", pauseTimer);
  $("resetTimerBtn")?.addEventListener("click", resetTimer);
  $("alarmOkBtn")?.addEventListener("click", hideAlarmPopup);

  renderTimer();
  setButtonsState();

  // To-do
  bindTodo();
  renderTodos();

  // ✅ Public Discussion Forum
  bindForumUI();
});

