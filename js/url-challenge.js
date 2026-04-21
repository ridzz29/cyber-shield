const introPanel = document.getElementById("introPanel");
const playPanel = document.getElementById("playPanel");
const endPanel = document.getElementById("endPanel");

const scoreValue = document.getElementById("scoreValue");
const questionValue = document.getElementById("questionValue");
const streakValue = document.getElementById("streakValue");
const timerValue = document.getElementById("timerValue");
const livesValue = document.getElementById("livesValue");
const multiplierValue = document.getElementById("multiplierValue");

const difficultyTag = document.getElementById("difficultyTag");
const promptTitle = document.getElementById("promptTitle");
const urlText = document.getElementById("urlText");
const contextText = document.getElementById("contextText");
const feedbackText = document.getElementById("feedbackText");
const signalList = document.getElementById("signalList");
const missionLog = document.getElementById("missionLog");

const safeBtn = document.getElementById("safeBtn");
const phishBtn = document.getElementById("phishBtn");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const resultSummary = document.getElementById("resultSummary");
const reviewList = document.getElementById("reviewList");

const TOTAL_TIME_SECONDS = 90;
const QUESTIONS_PER_RUN = 10;
const MAX_LIVES = 3;
const BASE_CORRECT_POINTS = 120;
const WRONG_POINTS = -40;

const questionBank = [
  {
    url: "https://accounts.spotify.com/login",
    prompt: "Routine account sign-in from your normal workflow.",
    isPhishing: false,
    difficulty: "Easy",
    reason: "Primary trusted domain and expected account path.",
    signals: ["HTTPS enabled", "Trusted base domain", "No urgency pressure"]
  },
  {
    url: "http://spotify-security-alerts.work/reset",
    prompt: "You must verify in 10 minutes or account will be deleted.",
    isPhishing: true,
    difficulty: "Easy",
    reason: "Fake lookalike domain and insecure protocol with pressure tactics.",
    signals: ["HTTP only", "Lookalike branding", "Urgency coercion"]
  },
  {
    url: "https://accounts.google.com/signin/v2/identifier",
    prompt: "You manually opened settings and reached sign-in page.",
    isPhishing: false,
    difficulty: "Medium",
    reason: "Expected Google accounts host for authentication.",
    signals: ["Official service host", "Legitimate path", "No suspicious TLD"]
  },
  {
    url: "https://google.com.account-security-update.cc/auth",
    prompt: "OTP needed immediately to prevent permanent lockout.",
    isPhishing: true,
    difficulty: "Medium",
    reason: "Attacker-controlled domain despite using brand text.",
    signals: ["Misleading subdomain", "Suspicious TLD", "Credential harvesting hint"]
  },
  {
    url: "https://paypal.com/security/report",
    prompt: "Review recent login activity from security center.",
    isPhishing: false,
    difficulty: "Medium",
    reason: "Normal trusted root domain and plausible security context.",
    signals: ["Trusted root domain", "Standard security action", "No forced panic"]
  },
  {
    url: "https://paypa1-security-check.top/confirm",
    prompt: "Payment failed. Enter password and card details now.",
    isPhishing: true,
    difficulty: "Hard",
    reason: "Typosquatting with malicious credential request.",
    signals: ["Brand typo", "Suspicious TLD", "Sensitive data request"]
  },
  {
    url: "https://xn--micrsoft-85a.com/session",
    prompt: "Forwarded security bulletin asks for immediate re-authentication.",
    isPhishing: true,
    difficulty: "Hard",
    reason: "Deceptive punycode-like hostname pattern.",
    signals: ["IDN/punycode style", "Untrusted domain", "High-pressure wording"]
  },
  {
    url: "https://support.apple.com/en-in",
    prompt: "You searched Apple help manually and landed here.",
    isPhishing: false,
    difficulty: "Easy",
    reason: "Official support domain and normal locale path.",
    signals: ["Trusted vendor domain", "Expected content path", "No coercion"]
  },
  {
    url: "https://appleid-security-review.net/session",
    prompt: "Your account will be suspended unless you verify now.",
    isPhishing: true,
    difficulty: "Hard",
    reason: "Non-official domain with high-pressure social engineering.",
    signals: ["Unofficial domain", "Fear-based urgency", "Credential prompt expected"]
  },
  {
    url: "https://bankofamerica.com/",
    prompt: "You manually typed your bank URL to check statements.",
    isPhishing: false,
    difficulty: "Medium",
    reason: "Expected legitimate root domain.",
    signals: ["Correct institution domain", "User-initiated navigation", "No suspicious hints"]
  },
  {
    url: "https://secure-login-bankofamerica-account.net/verify",
    prompt: "Email says suspicious transfer found, confirm password now.",
    isPhishing: true,
    difficulty: "Hard",
    reason: "Unofficial domain string and forced credential action.",
    signals: ["Keyword-stuffed fake domain", "Credential pressure", "High-risk pattern"]
  },
  {
    url: "https://microsoft.com/security",
    prompt: "Security dashboard review request from trusted app notification.",
    isPhishing: false,
    difficulty: "Easy",
    reason: "Trusted vendor domain and normal security workflow.",
    signals: ["Known trusted root", "Expected use case", "No manipulative language"]
  }
];

let timerId;
let timeLeft = TOTAL_TIME_SECONDS;
let score = 0;
let streak = 0;
let lives = MAX_LIVES;
let idx = 0;
let questions = [];
let review = [];
let locked = false;

function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function setPanel(panel) {
  introPanel.classList.remove("active");
  playPanel.classList.remove("active");
  endPanel.classList.remove("active");
  panel.classList.add("active");
}

function getMultiplier() {
  const steps = Math.floor(streak / 2);
  return Math.min(2.5, 1 + (steps * 0.3));
}

function addMissionLog(text, kind = "neutral") {
  if (!missionLog) return;
  const row = document.createElement("div");
  row.className = `log-item${kind === "good" ? " good" : kind === "bad" ? " bad" : ""}`;
  row.textContent = text;
  missionLog.prepend(row);
  const maxRows = 9;
  while (missionLog.children.length > maxRows) {
    missionLog.removeChild(missionLog.lastChild);
  }
}

function renderHud() {
  scoreValue.textContent = String(score);
  streakValue.textContent = String(streak);
  questionValue.textContent = `${Math.min(idx + 1, questions.length)} / ${questions.length}`;
  timerValue.textContent = `${Math.max(0, timeLeft)}s`;
  livesValue.textContent = String(lives);
  multiplierValue.textContent = `x${getMultiplier().toFixed(1)}`;
}

function renderSignals(signals) {
  signalList.innerHTML = (signals || []).map((signal) => `<div class="signal-item">${signal}</div>`).join("");
}

function renderQuestion() {
  const q = questions[idx];
  if (!q) {
    finishRun("Question bank exhausted.");
    return;
  }
  difficultyTag.textContent = q.difficulty;
  promptTitle.textContent = "Classify this URL";
  urlText.textContent = q.url;
  contextText.textContent = q.prompt;
  feedbackText.textContent = "Choose `Mark Safe` or `Flag Phishing`.";
  renderSignals(q.signals);
  locked = false;
  safeBtn.disabled = false;
  phishBtn.disabled = false;
  renderHud();
}

function applyAnswer(pickedPhish) {
  if (locked) return;
  const q = questions[idx];
  if (!q) return;
  locked = true;

  const correct = Boolean(q.isPhishing) === Boolean(pickedPhish);
  if (correct) {
    streak += 1;
    const gained = Math.round(BASE_CORRECT_POINTS * getMultiplier());
    score += gained;
    feedbackText.textContent = `Correct +${gained}. ${q.reason}`;
    addMissionLog(`Q${idx + 1}: Correct (+${gained})`, "good");
  } else {
    score = Math.max(0, score + WRONG_POINTS);
    streak = 0;
    lives = Math.max(0, lives - 1);
    feedbackText.textContent = `Incorrect ${WRONG_POINTS}. ${q.reason}`;
    addMissionLog(`Q${idx + 1}: Incorrect (${WRONG_POINTS})`, "bad");
  }

  review.push({
    url: q.url,
    picked: pickedPhish ? "Phishing" : "Safe",
    expected: q.isPhishing ? "Phishing" : "Safe",
    correct,
    reason: q.reason
  });

  safeBtn.disabled = true;
  phishBtn.disabled = true;
  renderHud();

  if (lives <= 0) {
    setTimeout(() => finishRun("All lives lost."), 700);
    return;
  }

  idx += 1;
  setTimeout(() => {
    if (idx >= questions.length) {
      finishRun("All targets classified.");
    } else {
      renderQuestion();
    }
  }, 760);
}

function finishRun(endReason) {
  clearInterval(timerId);
  safeBtn.disabled = true;
  phishBtn.disabled = true;

  const correctCount = review.filter((r) => r.correct).length;
  const accuracy = review.length ? Math.round((correctCount / review.length) * 100) : 0;
  resultSummary.textContent = `Score: ${score} | Accuracy: ${accuracy}% | Correct: ${correctCount}/${review.length} | ${endReason}`;

  reviewList.innerHTML = review.map((r) => `
    <article class="review-item ${r.correct ? "good" : "bad"}">
      <p><strong>URL:</strong> ${r.url}</p>
      <p><strong>Your Answer:</strong> ${r.picked} | <strong>Expected:</strong> ${r.expected}</p>
      <p>${r.reason}</p>
    </article>
  `).join("");

  setPanel(endPanel);
}

function startRun() {
  clearInterval(timerId);
  timeLeft = TOTAL_TIME_SECONDS;
  score = 0;
  streak = 0;
  lives = MAX_LIVES;
  idx = 0;
  review = [];
  questions = shuffle(questionBank).slice(0, QUESTIONS_PER_RUN);
  missionLog.innerHTML = "";
  addMissionLog("Protocol deployed.");

  setPanel(playPanel);
  renderHud();
  renderQuestion();

  timerId = setInterval(() => {
    timeLeft -= 1;
    renderHud();
    if (timeLeft <= 0) {
      finishRun("Timer expired.");
    }
  }, 1000);
}

startBtn.addEventListener("click", startRun);
restartBtn.addEventListener("click", startRun);
safeBtn.addEventListener("click", () => applyAnswer(false));
phishBtn.addEventListener("click", () => applyAnswer(true));

document.addEventListener("keydown", (event) => {
  if (!playPanel.classList.contains("active")) return;
  if (event.key.toLowerCase() === "a") {
    applyAnswer(false);
  } else if (event.key.toLowerCase() === "d") {
    applyAnswer(true);
  }
});

setPanel(introPanel);
renderHud();
addMissionLog("Awaiting deployment.");
