(function () {
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
  const scenarioText = document.getElementById("scenarioText");
  const contextText = document.getElementById("contextText");
  const feedbackText = document.getElementById("feedbackText");
  const signalList = document.getElementById("signalList");
  const missionLog = document.getElementById("missionLog");

  const legitBtn = document.getElementById("legitBtn");
  const manipulationBtn = document.getElementById("manipulationBtn");
  const startBtn = document.getElementById("startBtn");
  const restartBtn = document.getElementById("restartBtn");
  const resultSummary = document.getElementById("resultSummary");
  const reviewList = document.getElementById("reviewList");

  const defaultConfig = { totalTimeSeconds: 90, questionsPerRun: 10, maxLives: 3, pointsCorrect: 120, pointsWrong: -40 };
  const sampleBank = [
    { sample: "Caller claims to be IT admin and asks for OTP to 'fix VPN now'.", context: "Mentions your manager's name and urgency.", isManipulation: true, difficulty: "Easy", reason: "Authority + urgency + OTP request is social engineering.", signals: ["Urgency pressure", "Sensitive credential request", "Impersonated authority"] },
    { sample: "HR asks you to review policy from intranet portal in weekly newsletter.", context: "No secret request; standard process reminder.", isManipulation: false, difficulty: "Easy", reason: "Routine internal communication without pressure.", signals: ["Expected process", "No secrets requested", "Normal context"] },
    { sample: "Vendor rep asks for invoice payment change over phone only.", context: "Refuses written confirmation and wants immediate transfer.", isManipulation: true, difficulty: "Medium", reason: "Out-of-band payment diversion pattern.", signals: ["Payment redirect request", "No formal verification", "Immediate action pressure"] },
    { sample: "Security team requests ticket ID and device model after incident you reported.", context: "Request arrives in existing ticket thread.", isManipulation: false, difficulty: "Medium", reason: "Expected follow-up in established support workflow.", signals: ["Existing ticket context", "No credential ask", "Legitimate scope"] },
    { sample: "Chat message: 'CEO needs gift cards in 20 minutes; keep this confidential'.", context: "Sender account has display name mismatch.", isManipulation: true, difficulty: "Hard", reason: "Classic business email compromise social script.", signals: ["Confidential urgency", "Gift card payment", "Identity mismatch"] },
    { sample: "Bank notification asks you to verify activity from official app only.", context: "No links in message body.", isManipulation: false, difficulty: "Medium", reason: "Safe-channel verification model.", signals: ["Official channel guidance", "No direct link trap", "No panic coercion"] },
    { sample: "Recruiter requests resume and portfolio through company ATS form.", context: "No financial or credential details requested.", isManipulation: false, difficulty: "Easy", reason: "Normal recruitment workflow.", signals: ["Expected business flow", "Low-risk data request", "Transparent process"] },
    { sample: "Courier 'delivery issue' text asks card details for small fee.", context: "Domain is unknown and timing is random.", isManipulation: true, difficulty: "Easy", reason: "Smishing pattern using micro-payment lure.", signals: ["Payment bait", "Unknown sender", "Unverified link"] },
    { sample: "New teammate asks for production DB password on chat for hotfix.", context: "No ticket or approval trail.", isManipulation: true, difficulty: "Hard", reason: "Privilege escalation attempt without controls.", signals: ["Secret sharing request", "No authorization workflow", "High impact target"] },
    { sample: "Facilities asks to confirm desk move timing through office portal.", context: "You already requested relocation yesterday.", isManipulation: false, difficulty: "Medium", reason: "Expected request tied to known event.", signals: ["Contextual legitimacy", "No sensitive ask", "Trusted channel"] },
    { sample: "SMS says payroll failed; submit bank PIN now to avoid salary hold.", context: "Includes short URL and final warning.", isManipulation: true, difficulty: "Hard", reason: "Credential extortion with fear-based deadline.", signals: ["PIN request", "Shortened link", "Final warning language"] },
    { sample: "IT broadcast advises everyone to update authenticator app before Friday.", context: "Provides internal wiki link and helpdesk extension.", isManipulation: false, difficulty: "Medium", reason: "Transparent broad communication with verifiable support.", signals: ["Public internal notice", "Verifiable support contact", "No secret request"] }
  ];

  let cfg = { ...defaultConfig };
  let timerId;
  let timeLeft = cfg.totalTimeSeconds;
  let score = 0;
  let streak = 0;
  let lives = cfg.maxLives;
  let idx = 0;
  let queue = [];
  let review = [];
  let locked = false;
  let runStartedAt = 0;
  const gameKey = "social-engineering";

  function getSessionUser() {
    try {
      const rawUser = localStorage.getItem("cyber_user");
      if (!rawUser) return null;
      return JSON.parse(rawUser);
    } catch {
      return null;
    }
  }

  async function submitScore(correctCount, accuracy) {
    const user = getSessionUser();
    if (!user?.email) return;
    const durationSeconds = Math.max(0, Math.round((Date.now() - runStartedAt) / 1000));
    const payload = {
      userName: user?.name || "User",
      userEmail: String(user.email || "").toLowerCase(),
      gameKey,
      score,
      accuracy,
      correctCount,
      totalQuestions: review.length,
      durationSeconds
    };
    try {
      await fetch("/api/game-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch {
      // ignore score sync failures
    }
  }


  function shuffle(arr) { const a = [...arr]; for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function setPanel(panel) { introPanel.classList.remove("active"); playPanel.classList.remove("active"); endPanel.classList.remove("active"); panel.classList.add("active"); }
  function getMultiplier() { return Math.min(2.5, 1 + Math.floor(streak / 2) * 0.3); }

  function logLine(text, kind) {
    const row = document.createElement("div");
    row.className = `log-item${kind === "good" ? " good" : kind === "bad" ? " bad" : ""}`;
    row.textContent = text;
    missionLog.prepend(row);
    while (missionLog.children.length > 9) missionLog.removeChild(missionLog.lastChild);
  }

  function renderHud() {
    scoreValue.textContent = String(score);
    streakValue.textContent = String(streak);
    questionValue.textContent = `${Math.min(idx + 1, queue.length)} / ${queue.length}`;
    timerValue.textContent = `${Math.max(0, timeLeft)}s`;
    livesValue.textContent = String(lives);
    multiplierValue.textContent = `x${getMultiplier().toFixed(1)}`;
  }

  function renderSignals(signals) { signalList.innerHTML = (signals || []).map((s) => `<div class="signal-item">${s}</div>`).join(""); }

  function renderSample() {
    const q = queue[idx];
    if (!q) return finish("Scenario queue completed.");
    difficultyTag.textContent = q.difficulty;
    scenarioText.textContent = q.sample;
    contextText.textContent = q.context;
    feedbackText.textContent = "Choose `Mark Legit` or `Flag Manipulation`.";
    renderSignals(q.signals);
    legitBtn.disabled = false;
    manipulationBtn.disabled = false;
    locked = false;
    renderHud();
  }

  function answer(markManipulation) {
    if (locked) return;
    const q = queue[idx];
    if (!q) return;
    locked = true;
    const correct = Boolean(q.isManipulation) === Boolean(markManipulation);
    if (correct) {
      streak += 1;
      const gained = Math.round(cfg.pointsCorrect * getMultiplier());
      score += gained;
      feedbackText.textContent = `Correct +${gained}. ${q.reason}`;
      logLine(`Q${idx + 1}: Correct (+${gained})`, "good");
    } else {
      score = Math.max(0, score + cfg.pointsWrong);
      streak = 0;
      lives = Math.max(0, lives - 1);
      feedbackText.textContent = `Incorrect ${cfg.pointsWrong}. ${q.reason}`;
      logLine(`Q${idx + 1}: Incorrect (${cfg.pointsWrong})`, "bad");
    }
    review.push({ sample: q.sample, picked: markManipulation ? "Manipulation" : "Legit", expected: q.isManipulation ? "Manipulation" : "Legit", correct, reason: q.reason });
    legitBtn.disabled = true;
    manipulationBtn.disabled = true;
    renderHud();
    if (lives <= 0) return setTimeout(() => finish("All lives lost."), 650);
    idx += 1;
    setTimeout(() => (idx >= queue.length ? finish("All scenarios triaged.") : renderSample()), 760);
  }

  function finish(reason) {
    clearInterval(timerId);
    legitBtn.disabled = true;
    manipulationBtn.disabled = true;
    const correctCount = review.filter((r) => r.correct).length;
    const accuracy = review.length ? Math.round((correctCount / review.length) * 100) : 0;
    resultSummary.textContent = `Score: ${score} | Accuracy: ${accuracy}% | Correct: ${correctCount}/${review.length} | ${reason}`;
    submitScore(correctCount, accuracy);
    reviewList.innerHTML = review.map((r) => `
      <article class="review-item ${r.correct ? "good" : "bad"}">
        <p><strong>Scenario:</strong> ${r.sample}</p>
        <p><strong>Your Answer:</strong> ${r.picked} | <strong>Expected:</strong> ${r.expected}</p>
        <p>${r.reason}</p>
      </article>
    `).join("");
    setPanel(endPanel);
  }

  function start() {
    clearInterval(timerId);
    timeLeft = cfg.totalTimeSeconds;
    score = 0;
    streak = 0;
    lives = cfg.maxLives;
    idx = 0;
    review = [];
    runStartedAt = Date.now();
    queue = shuffle(sampleBank).slice(0, cfg.questionsPerRun);
    missionLog.innerHTML = "";
    logLine("Protocol deployed.");
    setPanel(playPanel);
    renderHud();
    renderSample();
    timerId = setInterval(() => {
      timeLeft -= 1;
      renderHud();
      if (timeLeft <= 0) finish("Timer expired.");
    }, 1000);
  }

  async function loadConfig() {
    try {
      const res = await fetch("/game/social-engineering.json");
      if (res.ok) cfg = { ...cfg, ...(await res.json()) };
    } catch {}
    try {
      await fetch("/game/social-engineering2.json");
    } catch {}
  }

  startBtn.addEventListener("click", start);
  restartBtn.addEventListener("click", start);
  legitBtn.addEventListener("click", () => answer(false));
  manipulationBtn.addEventListener("click", () => answer(true));
  document.addEventListener("keydown", (e) => {
    if (!playPanel.classList.contains("active")) return;
    const key = e.key.toLowerCase();
    if (key === "a") answer(false);
    if (key === "d") answer(true);
  });

  (async function init() {
    await loadConfig();
    setPanel(introPanel);
    renderHud();
    logLine("Awaiting deployment.");
  })();
})();


