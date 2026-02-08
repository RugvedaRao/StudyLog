// ============================
// CA Foundation Tracker + Shareable Study Rooms (Firestore)
// app.js (FULL)
// ============================

/* ----------------------------
   Quote of the Day (changes daily)
---------------------------- */
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

/* ----------------------------
   DATA (topics)
---------------------------- */
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

// Optional: Google Apps Script lead capture (keep if you want)
const LEAD_ENDPOINT = "https://script.google.com/macros/s/AKfycbxvAy_BvXUTcOknFET8ppT6N1r0_eRmcNlCt_KJEijRPsw_ldxsmKycW_nwvxVSc-faTA/exec";

const $ = (id) => document.getElementById(id);
function safeParse(x){ try { return JSON.parse(x); } catch { return null; } }

/* ============================
   ✅ User Capture (Name + Email)
============================ */
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

async function sendLeadToServer(user){
  if(!LEAD_ENDPOINT || LEAD_ENDPOINT.includes("YOUR_")) return;
  const fd = new FormData();
  fd.append("name", user.name);
  fd.append("email", user.email);
  fd.append("source", "CA Foundation Tracker");
  fd.append("page", location.href);

  try{
    await fetch(LEAD_ENDPOINT, { method: "POST", body: fd });
  }catch(err){
    console.warn("Lead submit failed:", err);
  }
}

function openUserCapture(){
  const modal = $("userModal");
  if(modal) modal.classList.remove("hidden");
}
function closeUserCapture(){
  const modal = $("userModal");
  if(modal) modal.classList.add("hidden");
}

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

    const user = { name, email };
    saveUser(user);

    if(msgEl) msgEl.textContent = "Saved ✅";
    closeUserCapture();

    sendLeadToServer(user);
  });
}

function initUserCapture(){
  bindUserCapture();
  const user = loadUser();
  if(!user) openUserCapture();
}

/* ============================
   ✅ Theme Toggle
============================ */
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

  const btn = $("themeToggle");
  if(!btn) return;

  btn.addEventListener("click", () => {
    const current = document.body.getAttribute("data-theme") || "dark";
    applyTheme(current === "dark" ? "light" : "dark");
  });
}

/* ----------------------------
   Progress state (localStorage)
---------------------------- */
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

/* ----------------------------
   Countdown (DD-MM-YYYY input stored as ISO)
---------------------------- */
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

/* ----------------------------
   Navigation + UI
---------------------------- */
let currentSubject = null;

function showHome(){
  $("subjectScreen")?.classList.add("hidden");
  $("homeScreen")?.classList.remove("hidden");
  currentSubject = null;
  renderHome();
}

function openSubject(subj){
  currentSubject = subj;
  $("homeScreen")?.classList.add("hidden");
  $("subjectScreen")?.classList.remove("hidden");
  renderSubject();
}

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
  $("subjectMini") && ($("subjectMini").textContent = "");

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

/* ----------------------------
   Study Timer + Alarm
---------------------------- */
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
  if(alarmInterval){
    clearInterval(alarmInterval);
    alarmInterval = null;
  }
  if(alarmCtx){
    alarmCtx.close();
    alarmCtx = null;
  }
}

function showAlarmPopup(){
  const overlay = $("alarmOverlay");
  if(overlay) overlay.classList.remove("hidden");
  startAlarmLoop();
}

function hideAlarmPopup(){
  stopAlarmLoop();
  const overlay = $("alarmOverlay");
  if(overlay) overlay.classList.add("hidden");
}

function renderTimer(){
  const timerBig = $("timerBig");
  if(!timerBig) return;

  const m = Math.floor(remainingSeconds / 60);
  const s = remainingSeconds % 60;
  timerBig.textContent = `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

function setButtonsState(){
  const pauseTimerBtn = $("pauseTimerBtn");
  const resetTimerBtn = $("resetTimerBtn");

  if(pauseTimerBtn) pauseTimerBtn.disabled = !running;
  if(resetTimerBtn) resetTimerBtn.disabled = running ? false : (remainingSeconds === 0);
}

function openTimer(){
  const timerModal = $("timerModal");
  const timerHint = $("timerHint");
  if(timerModal) timerModal.classList.remove("hidden");
  if(timerHint) timerHint.textContent = "Set time and press Start.";
  if(!running) renderTimer();
}

function closeTimer(){
  const timerModal = $("timerModal");
  if(timerModal) timerModal.classList.add("hidden");
}

function startTimer(){
  const timerMin = $("timerMin");
  const timerSec = $("timerSec");
  const timerInputs = $("timerInputs");
  const timerHint = $("timerHint");

  const m = Math.max(0, Number(timerMin?.value || 0));
  const s = Math.min(59, Math.max(0, Number(timerSec?.value || 0)));

  if(!running && remainingSeconds === 0){
    remainingSeconds = (m * 60) + s;
  }

  if(remainingSeconds <= 0){
    if(timerHint) timerHint.textContent = "Please set a time greater than 0.";
    return;
  }

  running = true;
  if(timerInputs){
    timerInputs.style.opacity = "0.55";
    timerInputs.style.pointerEvents = "none";
  }
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

      if(timerInputs){
        timerInputs.style.opacity = "1";
        timerInputs.style.pointerEvents = "auto";
      }
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

  const timerInputs = $("timerInputs");
  const timerHint = $("timerHint");

  running = false;

  if(timerInterval){
    clearInterval(timerInterval);
    timerInterval = null;
  }

  if(timerInputs){
    timerInputs.style.opacity = "1";
    timerInputs.style.pointerEvents = "auto";
  }
  if(timerHint) timerHint.textContent = "Paused. Press Start to continue.";
  setButtonsState();
}

function resetTimer(){
  const timerInputs = $("timerInputs");
  const timerHint = $("timerHint");

  running = false;

  if(timerInterval){
    clearInterval(timerInterval);
    timerInterval = null;
  }

  remainingSeconds = 0;
  if(timerInputs){
    timerInputs.style.opacity = "1";
    timerInputs.style.pointerEvents = "auto";
  }
  renderTimer();
  if(timerHint) timerHint.textContent = "Reset. Set time and press Start.";
  setButtonsState();
}

/* ----------------------------
   ✅ To-Do List Logic
---------------------------- */
function loadTodos(){
  const raw = localStorage.getItem(TODO_KEY);
  try { return raw ? JSON.parse(raw) : []; }
  catch { return []; }
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
  const addTodoBtn = $("addTodoBtn");
  const todoInput = $("todoInput");

  if(addTodoBtn){
    addTodoBtn.addEventListener("click", () => {
      const value = (todoInput?.value || "").trim();
      if(!value) return;

      const todos = loadTodos();
      todos.push(value);
      saveTodos(todos);

      todoInput.value = "";
      renderTodos();
    });
  }

  if(todoInput){
    todoInput.addEventListener("keydown", (e) => {
      if(e.key === "Enter"){
        addTodoBtn?.click();
      }
    });
  }
}

/* ============================
   ✅ SHAREABLE STUDY ROOMS (Firestore)
   Rooms by URL: ?room=ROOM_ID
============================ */

/**
 * ✅ 1) Create Firebase project + Firestore
 * ✅ 2) Paste your config here:
 */
const firebaseConfig = {
  apiKey: "PASTE_API_KEY",
  authDomain: "PASTE_AUTH_DOMAIN",
  projectId: "PASTE_PROJECT_ID"
};

let db = null;
let unsubMessages = null;
let activeRoomId = null;

function escapeHTML(str){
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function fmtTime(ts){
  try{
    const d = ts?.toDate ? ts.toDate() : (ts instanceof Date ? ts : new Date(ts));
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }catch{
    return "";
  }
}

function randomRoomId(){
  // short readable code
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  for(let i=0;i<8;i++){
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

function getRoomFromURL(){
  const u = new URL(location.href);
  const room = (u.searchParams.get("room") || "").trim();
  return room || null;
}

function setRoomInURL(roomId){
  const u = new URL(location.href);
  u.searchParams.set("room", roomId);
  history.replaceState({}, "", u.toString());
}

function makeShareLink(roomId){
  const u = new URL(location.href);
  u.searchParams.set("room", roomId);
  return u.toString();
}

function setChatUIEnabled(enabled){
  const input = $("chatInput");
  const send = $("chatSendBtn");
  const copy = $("copyRoomLinkBtn");
  if(input) input.disabled = !enabled;
  if(send) send.disabled = !enabled;
  if(copy) copy.disabled = !enabled;
}

function setChatStatus(text){
  const el = $("chatStatus");
  if(el) el.textContent = text;
}

function setRoomMeta(text){
  const el = $("chatRoomMeta");
  if(el) el.textContent = text;
}

function renderChatMessages(msgs){
  const list = $("chatMessages");
  if(!list) return;

  list.innerHTML = msgs.map(m => {
    const name = escapeHTML(m.name || "Student");
    const time = escapeHTML(fmtTime(m.createdAt));
    const text = escapeHTML(m.text || "");
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
  // Don’t crash app if config not filled
  if(
    !firebaseConfig.apiKey || firebaseConfig.apiKey.includes("PASTE_") ||
    !firebaseConfig.projectId || firebaseConfig.projectId.includes("PASTE_")
  ){
    setChatStatus("Config missing");
    setRoomMeta("Paste Firebase config in app.js");
    setChatUIEnabled(false);
    return null;
  }

  const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js");
  const {
    getFirestore, doc, setDoc, serverTimestamp,
    collection, addDoc, query, orderBy, limit, onSnapshot
  } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js");

  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);

  return { doc, setDoc, serverTimestamp, collection, addDoc, query, orderBy, limit, onSnapshot };
}

async function joinRoom(roomId){
  roomId = (roomId || "").trim().toLowerCase();
  if(!roomId) return;

  const fb = await initFirebase();
  if(!fb) return;

  const { doc, setDoc, serverTimestamp, collection, query, orderBy, limit, onSnapshot } = fb;

  // cleanup old listener
  if(unsubMessages){
    unsubMessages();
    unsubMessages = null;
  }

  activeRoomId = roomId;
  setRoomInURL(roomId);

  setChatStatus("Live ✅");
  setRoomMeta(`Room: ${roomId} • Share link to invite friends`);
  setChatUIEnabled(true);

  // ensure room doc exists
  try{
    await setDoc(doc(db, "rooms", roomId), { createdAt: serverTimestamp() }, { merge: true });
  }catch(err){
    console.warn("room create/merge failed:", err);
  }

  // listen messages
  const q = query(
    collection(db, "rooms", roomId, "messages"),
    orderBy("createdAt", "desc"),
    limit(80)
  );

  unsubMessages = onSnapshot(q, (snap) => {
    const docs = snap.docs.slice().reverse().map(d => ({ id: d.id, ...d.data() }));
    renderChatMessages(docs);
  }, (err) => {
    console.warn("chat listen error:", err);
    setChatStatus("Offline");
  });
}

async function sendChatMessage(){
  const roomId = activeRoomId;
  if(!roomId) return;

  const input = $("chatInput");
  const text = (input?.value || "").trim();
  if(!text) return;

  const user = loadUser();
  const name = user?.name ? String(user.name).slice(0, 30) : "Student";

  const fb = await initFirebase();
  if(!fb) return;

  const { collection, addDoc, serverTimestamp } = fb;

  // clear early for snappy UI
  input.value = "";

  try{
    await addDoc(collection(db, "rooms", roomId, "messages"), {
      name,
      text: text.slice(0, 220),
      createdAt: serverTimestamp()
    });
  }catch(err){
    console.warn("send failed:", err);
    setChatStatus("Send failed");
    setTimeout(() => setChatStatus("Live ✅"), 1200);
  }
}

async function copyRoomLink(){
  if(!activeRoomId) return;
  const link = makeShareLink(activeRoomId);

  try{
    await navigator.clipboard.writeText(link);
    setChatStatus("Link copied ✅");
    setTimeout(() => setChatStatus("Live ✅"), 1200);
  }catch{
    // fallback
    prompt("Copy this link:", link);
  }
}

function bindChatUI(){
  $("createRoomBtn")?.addEventListener("click", () => {
    const roomId = randomRoomId();
    joinRoom(roomId);
  });

  $("joinRoomBtn")?.addEventListener("click", () => {
    const code = ($("joinRoomInput")?.value || "").trim();
    if(!code){
      alert("Enter a room code.");
      return;
    }
    joinRoom(code);
  });

  $("copyRoomLinkBtn")?.addEventListener("click", copyRoomLink);

  $("chatSendBtn")?.addEventListener("click", sendChatMessage);
  $("chatInput")?.addEventListener("keydown", (e) => {
    if(e.key === "Enter") sendChatMessage();
  });
}

async function initRoomFromURL(){
  const roomId = getRoomFromURL();
  if(roomId){
    await joinRoom(roomId);
  }else{
    // No room selected initially
    setChatStatus("Offline");
    setChatUIEnabled(false);
    setRoomMeta("No room • Create or join to start");
  }
}

/* ----------------------------
   ✅ Bind Events after DOM ready
---------------------------- */
document.addEventListener("DOMContentLoaded", async () => {
  // Theme
  initTheme();

  // User capture
  initUserCapture();

  // Done button -> Home
  $("doneBtn")?.addEventListener("click", showHome);

  // Quote + UI
  loadDailyQuote();
  renderHome();
  updateCountdownDisplay();
  showHome();

  // Countdown click
  $("countdownPill")?.addEventListener("click", promptSetExamDate);

  // Subject screen buttons
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

  // Timer bindings
  $("openTimerBtn")?.addEventListener("click", openTimer);
  $("closeTimerBtn")?.addEventListener("click", closeTimer);

  const timerModal = $("timerModal");
  if(timerModal){
    timerModal.addEventListener("click", (e) => {
      if(e.target === timerModal) closeTimer();
    });
  }

  $("startTimerBtn")?.addEventListener("click", startTimer);
  $("pauseTimerBtn")?.addEventListener("click", pauseTimer);
  $("resetTimerBtn")?.addEventListener("click", resetTimer);

  // Alarm OK
  $("alarmOkBtn")?.addEventListener("click", hideAlarmPopup);

  // To-do
  bindTodo();
  renderTodos();

  // Timer initial view
  renderTimer();
  setButtonsState();

  // ✅ Study room
  bindChatUI();
  await initRoomFromURL();
});
// ============================
// ✅ SHAREABLE STUDY ROOMS (Firestore)
// Rooms: /rooms/{roomId}
// Messages: /rooms/{roomId}/messages
// ============================

// ✅ Your config (from screenshot)
const firebaseConfig = {
  apiKey: "AIzaSyBtwjeGsQfrT8kBRyA45d1ajwFX0q8qTWk",
  authDomain: "ca-study-rooms.firebaseapp.com",
  projectId: "ca-study-rooms",
  storageBucket: "ca-study-rooms.firebasestorage.app",
  messagingSenderId: "95273803267",
  appId: "1:95273803267:web:9795448f0fffff79e98b836"
};

let db = null;
let unsubMessages = null;
let activeRoomId = null;

// ---- helpers ----
function escapeHTML(str){
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function randomRoomId(){
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  for(let i=0; i<8; i++){
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

function getRoomFromURL(){
  const u = new URL(location.href);
  return (u.searchParams.get("room") || "").trim() || null;
}

function setRoomInURL(roomId){
  const u = new URL(location.href);
  u.searchParams.set("room", roomId);
  history.replaceState({}, "", u.toString());
}

function makeShareLink(roomId){
  const u = new URL(location.href);
  u.searchParams.set("room", roomId);
  return u.toString();
}

function setChatUIEnabled(enabled){
  const input = document.getElementById("chatInput");
  const send = document.getElementById("chatSendBtn");
  const copy = document.getElementById("copyRoomLinkBtn");
  if(input) input.disabled = !enabled;
  if(send) send.disabled = !enabled;
  if(copy) copy.disabled = !enabled;
}

function setChatStatus(text){
  const el = document.getElementById("chatStatus");
  if(el) el.textContent = text;
}

function setRoomMeta(text){
  const el = document.getElementById("chatRoomMeta");
  if(el) el.textContent = text;
}

function renderChatMessages(msgs){
  const list = document.getElementById("chatMessages");
  if(!list) return;

  list.innerHTML = msgs.map(m => {
    const name = escapeHTML(m.name || "Student");
    const text = escapeHTML(m.text || "");
    return `
      <div class="chatMsg">
        <div class="chatMsgTop">
          <div class="chatMsgName">${name}</div>
          <div class="chatMsgTime"></div>
        </div>
        <div class="chatMsgText">${text}</div>
      </div>
    `;
  }).join("");

  list.scrollTop = list.scrollHeight;
}

// ---- firebase init (CDN modular imports) ----
async function initFirebase(){
  if(db) return db;

  const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js");
  const { getFirestore } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js");

  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  return db;
}

async function joinRoom(roomId){
  roomId = (roomId || "").trim().toLowerCase();
  if(!roomId) return;

  await initFirebase();

  const {
    doc, setDoc, serverTimestamp,
    collection, query, orderBy, limit, onSnapshot
  } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js");

  // stop old room listener
  if(unsubMessages){
    unsubMessages();
    unsubMessages = null;
  }

  activeRoomId = roomId;
  setRoomInURL(roomId);

  setChatStatus("Live ✅");
  setRoomMeta(`Room: ${roomId} • Share link to invite friends`);
  setChatUIEnabled(true);

  // create room doc if not exists
  await setDoc(doc(db, "rooms", roomId), { createdAt: serverTimestamp() }, { merge: true });

  // listen to messages
  const q = query(
    collection(db, "rooms", roomId, "messages"),
    orderBy("createdAt", "desc"),
    limit(80)
  );

  unsubMessages = onSnapshot(q, (snap) => {
    const docs = snap.docs.slice().reverse().map(d => ({ id: d.id, ...d.data() }));
    renderChatMessages(docs);
  }, (err) => {
    console.warn("Chat listener error:", err);
    setChatStatus("Offline");
  });
}

async function sendChatMessage(){
  if(!activeRoomId) return;

  const input = document.getElementById("chatInput");
  const text = (input?.value || "").trim();
  if(!text) return;

  // uses your existing user capture function if you have it:
  // const user = loadUser();
  // const name = user?.name ? String(user.name).slice(0, 30) : "Student";
  const name = "Student"; // change to your loadUser() name if needed

  input.value = "";

  await initFirebase();
  const { collection, addDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js");

  try{
    await addDoc(collection(db, "rooms", activeRoomId, "messages"), {
      name,
      text: text.slice(0, 220),
      createdAt: serverTimestamp()
    });
  }catch(err){
    console.warn("Send failed:", err);
    setChatStatus("Send failed");
    setTimeout(() => setChatStatus("Live ✅"), 1200);
  }
}

async function copyRoomLink(){
  if(!activeRoomId) return;
  const link = makeShareLink(activeRoomId);

  try{
    await navigator.clipboard.writeText(link);
    setChatStatus("Link copied ✅");
    setTimeout(() => setChatStatus("Live ✅"), 1200);
  }catch{
    prompt("Copy this link:", link);
  }
}

function bindChatUI(){
  document.getElementById("createRoomBtn")?.addEventListener("click", () => {
    joinRoom(randomRoomId());
  });

  document.getElementById("joinRoomBtn")?.addEventListener("click", () => {
    const code = (document.getElementById("joinRoomInput")?.value || "").trim();
    if(!code) return alert("Enter a room code.");
    joinRoom(code);
  });

  document.getElementById("copyRoomLinkBtn")?.addEventListener("click", copyRoomLink);

  document.getElementById("chatSendBtn")?.addEventListener("click", sendChatMessage);
  document.getElementById("chatInput")?.addEventListener("keydown", (e) => {
    if(e.key === "Enter") sendChatMessage();
  });
}

async function initRoomFromURL(){
  const roomId = getRoomFromURL();
  if(roomId){
    await joinRoom(roomId);
  }else{
    setChatStatus("Offline");
    setRoomMeta("No room • Create or join");
    setChatUIEnabled(false);
  }
}

// ✅ Call these in DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  bindChatUI();
  initRoomFromURL();
});
