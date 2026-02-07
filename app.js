// ============================
// CA Foundation Tracker - app.js
// ============================

// ----------------------------
// Quote of the Day (changes daily)
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
  document.getElementById("quoteText").textContent = quote;
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

const $ = (id) => document.getElementById(id);
function safeParse(x){ try { return JSON.parse(x); } catch { return null; } }

// ----------------------------
// Progress state (localStorage)
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
  const C = 282.74; // circumference r=45
  arcEl.style.strokeDashoffset = String(C - (pct / 100) * C);
  pctEl.textContent = `${pct}%`;
}

function cssId(name){
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

// ----------------------------
// Countdown (DD-MM-YYYY input stored as ISO)
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

function getExamISO(){
  return localStorage.getItem(EXAM_DATE_KEY);
}

function setExamISO(iso){
  localStorage.setItem(EXAM_DATE_KEY, iso);
  updateCountdownDisplay();
}

let countdownInterval = null;

function updateCountdownDisplay(){
  const iso = getExamISO();
  const el = $("countdownTime");

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
// Navigation + UI
// ----------------------------
let currentSubject = null;

function showHome(){
  $("subjectScreen").classList.add("hidden");
  $("homeScreen").classList.remove("hidden");
  currentSubject = null;
  renderHome();
}

function openSubject(subj){
  currentSubject = subj;
  $("homeScreen").classList.add("hidden");
  $("subjectScreen").classList.remove("hidden");
  renderSubject();
}

function renderHome(){
  const state = loadState();
  const overall = overallStats(state);
  $("overallBelow").innerHTML = `Overall: ${overall.pct}% <span>(${overall.done}/${overall.total})</span>`;

  const grid = $("metersGrid");
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
    setRing(arc, pctEl, pct);

    card.querySelector(".subjectName").addEventListener("click", () => openSubject(subj));
  }
}

function renderSubject(){
  const state = loadState();
  const subj = currentSubject;

  $("subjectTitle").textContent = subj;

  const { done, total, pct } = statsFor(state, subj);
  $("subjectRight").textContent = `${done}/${total} done • ${pct}%`;
  $("subjectMini").textContent = "";

  const wrap = $("topics");
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
      $("subjectRight").textContent = `${s.done}/${s.total} done • ${s.pct}%`;

      const overall = overallStats(newState);
      $("overallBelow").innerHTML = `Overall: ${overall.pct}% <span>(${overall.done}/${overall.total})</span>`;
    });

    wrap.appendChild(row);
  });
}

// ----------------------------
// Buttons
// ----------------------------
$("backBtn").addEventListener("click", showHome);

$("markAll").addEventListener("click", () => {
  if(!currentSubject) return;
  const state = loadState();
  state[currentSubject] = Array(SUBJECTS[currentSubject].length).fill(true);
  saveState(state);
  renderSubject();
  renderHome();
});

$("clearAll").addEventListener("click", () => {
  if(!currentSubject) return;
  const state = loadState();
  state[currentSubject] = Array(SUBJECTS[currentSubject].length).fill(false);
  saveState(state);
  renderSubject();
  renderHome();
});

$("resetAll").addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  if(currentSubject) renderSubject();
  renderHome();
});

$("countdownPill").addEventListener("click", promptSetExamDate);

// ----------------------------
// Init (Home)
// ----------------------------
loadDailyQuote();
renderHome();
updateCountdownDisplay();
showHome();


// ============================
// ===== Study Timer =====
// ============================
const openTimerBtn = document.getElementById("openTimerBtn");
const closeTimerBtn = document.getElementById("closeTimerBtn");
const timerModal = document.getElementById("timerModal");

const timerBig = document.getElementById("timerBig");
const timerMin = document.getElementById("timerMin");
const timerSec = document.getElementById("timerSec");
const timerInputs = document.getElementById("timerInputs");

const startTimerBtn = document.getElementById("startTimerBtn");
const pauseTimerBtn = document.getElementById("pauseTimerBtn");
const resetTimerBtn = document.getElementById("resetTimerBtn");
const timerHint = document.getElementById("timerHint");

let timerInterval = null;
let remainingSeconds = 0;
let running = false;

// ============================
// ✅ Alarm Loop + Popup Control
// (requires alarmOverlay + alarmOkBtn in index.html)
// ============================
let alarmInterval = null;
let alarmCtx = null;

function startAlarmLoop(){
  stopAlarmLoop(); // prevent stacking

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  alarmCtx = new AudioCtx();
  alarmCtx.resume?.();

  const beepDuration = 0.08; // beep length
  const gap = 0.10;          // ✅ 0.1s gap
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
  const overlay = document.getElementById("alarmOverlay");
  if(overlay) overlay.classList.remove("hidden");
  startAlarmLoop();
}

function hideAlarmPopup(){
  stopAlarmLoop();
  const overlay = document.getElementById("alarmOverlay");
  if(overlay) overlay.classList.add("hidden");
}

// bind OK button (if present)
const alarmOkBtn = document.getElementById("alarmOkBtn");
if(alarmOkBtn){
  alarmOkBtn.addEventListener("click", hideAlarmPopup);
}

// ----------------------------
// Timer UI
// ----------------------------
function renderTimer(){
  const m = Math.floor(remainingSeconds / 60);
  const s = remainingSeconds % 60;
  timerBig.textContent = `${pad2(m)}:${pad2(s)}`;
}

function setButtonsState(){
  pauseTimerBtn.disabled = !running;
  resetTimerBtn.disabled = running ? false : (remainingSeconds === 0);
}

function openTimer(){
  timerModal.classList.remove("hidden");
  timerHint.textContent = "Set time and press Start.";
  if(!running) renderTimer();
}

function closeTimer(){
  timerModal.classList.add("hidden");
}

openTimerBtn.addEventListener("click", openTimer);
closeTimerBtn.addEventListener("click", closeTimer);

timerModal.addEventListener("click", (e) => {
  if(e.target === timerModal) closeTimer();
});

function startTimer(){
  const m = Math.max(0, Number(timerMin.value || 0));
  const s = Math.min(59, Math.max(0, Number(timerSec.value || 0)));

  if(!running && remainingSeconds === 0){
    remainingSeconds = (m * 60) + s;
  }

  if(remainingSeconds <= 0){
    timerHint.textContent = "Please set a time greater than 0.";
    return;
  }

  running = true;
  timerInputs.style.opacity = "0.55";
  timerInputs.style.pointerEvents = "none";
  timerHint.textContent = "Timer running… Focus!";

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

      timerInputs.style.opacity = "1";
      timerInputs.style.pointerEvents = "auto";
      setButtonsState();

      // ✅ show popup + loop beeps until OK
      showAlarmPopup();

      timerHint.textContent = "Time finished. Set again or restart.";
      return;
    }

    renderTimer();
  }, 1000);
}

function pauseTimer(){
  if(!running) return;
  running = false;

  if(timerInterval){
    clearInterval(timerInterval);
    timerInterval = null;
  }

  timerInputs.style.opacity = "1";
  timerInputs.style.pointerEvents = "auto";
  timerHint.textContent = "Paused. Press Start to continue.";
  setButtonsState();
}

function resetTimer(){
  running = false;

  if(timerInterval){
    clearInterval(timerInterval);
    timerInterval = null;
  }

  remainingSeconds = 0;
  timerInputs.style.opacity = "1";
  timerInputs.style.pointerEvents = "auto";
  renderTimer();
  timerHint.textContent = "Reset. Set time and press Start.";
  setButtonsState();
}

startTimerBtn.addEventListener("click", startTimer);
pauseTimerBtn.addEventListener("click", pauseTimer);
resetTimerBtn.addEventListener("click", resetTimer);

// initial state
renderTimer();
setButtonsState();
