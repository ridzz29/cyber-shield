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
  const passwordText = document.getElementById("passwordText");
  const contextText = document.getElementById("contextText");
  const feedbackText = document.getElementById("feedbackText");
  const signalList = document.getElementById("signalList");
  const missionLog = document.getElementById("missionLog");

  const strongBtn = document.getElementById("strongBtn");
  const riskyBtn = document.getElementById("riskyBtn");
  const startBtn = document.getElementById("startBtn");
  const restartBtn = document.getElementById("restartBtn");
  const resultSummary = document.getElementById("resultSummary");
  const reviewList = document.getElementById("reviewList");

  const defaultConfig = { totalTimeSeconds: 90, questionsPerRun: 10, maxLives: 3, pointsCorrect: 120, pointsWrong: -40 };
  const sampleBank = [
    { sample: "P@ssword123", context: "User has used similar password on social media accounts.", isRisky: true, difficulty: "Easy", reason: "Common pattern and reuse exposure.", signals: ["Dictionary base word", "Predictable suffix", "Known reuse risk"] },
    { sample: "Tiger!River$Canvas92", context: "Unique passphrase for one banking account only.", isRisky: false, difficulty: "Easy", reason: "Long unpredictable passphrase with symbols.", signals: ["Length > 16", "High entropy", "No reuse"] },
    { sample: "Riddhi@2003", context: "Contains first name and birth year.", isRisky: true, difficulty: "Easy", reason: "Personally guessable from public profile data.", signals: ["Personal info included", "Year suffix", "Low resistance to targeted guessing"] },
    { sample: "violet-plasma!orbit#lane", context: "Stored in password manager and never reused.", isRisky: false, difficulty: "Medium", reason: "Strong unique passphrase with good entropy.", signals: ["Unique secret", "High length", "Manager-stored"] },
    { sample: "Qwerty@12345", context: "Used as fallback in multiple enterprise systems.", isRisky: true, difficulty: "Medium", reason: "Keyboard pattern and organization-wide reuse.", signals: ["Keyboard sequence", "Cross-service reuse", "Common breach candidate"] },
    { sample: "D3lt@-F0x!Prism+74", context: "Generated randomly and paired with MFA.", isRisky: false, difficulty: "Medium", reason: "Randomized structure and strong second factor pairing.", signals: ["Random composition", "Long complexity", "MFA enabled"] },
    { sample: "Summer2026!", context: "User changes only season and year each quarter.", isRisky: true, difficulty: "Hard", reason: "Predictable rotation strategy.", signals: ["Pattern rotation", "Temporal predictability", "Low adaptive strength"] },
    { sample: "a!Q9$uM2#vR8*L1@tP4", context: "Service-specific and never shared in chat.", isRisky: false, difficulty: "Hard", reason: "High entropy and operational hygiene.", signals: ["Very high entropy", "No sharing", "Service specific"] },
    { sample: "CompanyName@123", context: "Suggested by teammate for convenience.", isRisky: true, difficulty: "Medium", reason: "Brand+numbers is common cracking candidate.", signals: ["Organization keyword", "Common construction", "Likely in wordlists"] },
    { sample: "N3bula!Anchor#Field%77", context: "Personal vault generated, distinct per app.", isRisky: false, difficulty: "Hard", reason: "Unique long secret with non-trivial structure.", signals: ["Distinct per app", "Strong entropy", "No personal clues"] },
    { sample: "ilovemydog", context: "No symbols or numbers, used in old email account.", isRisky: true, difficulty: "Easy", reason: "Short plain phrase vulnerable to dictionary attacks.", signals: ["All lowercase", "No complexity", "Low cracking cost"] },
    { sample: "C0balt!Lake-Delta?91", context: "Used only for payroll system with MFA backup.", isRisky: false, difficulty: "Medium", reason: "Good entropy and deployment controls.", signals: ["Complex and long", "Single-use secret", "MFA in place"] }
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
  const gameKey = "password";

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
    if (!q) return finish("Sample queue completed.");
    difficultyTag.textContent = q.difficulty;
    passwordText.textContent = q.sample;
    contextText.textContent = q.context;
    feedbackText.textContent = "Choose `Mark Strong` or `Flag Risky`.";
    renderSignals(q.signals);
    strongBtn.disabled = false;
    riskyBtn.disabled = false;
    locked = false;
    renderHud();
  }

  function answer(markRisky) {
    if (locked) return;
    const q = queue[idx];
    if (!q) return;
    locked = true;
    const correct = Boolean(q.isRisky) === Boolean(markRisky);
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
    review.push({ sample: q.sample, picked: markRisky ? "Risky" : "Strong", expected: q.isRisky ? "Risky" : "Strong", correct, reason: q.reason });
    strongBtn.disabled = true;
    riskyBtn.disabled = true;
    renderHud();
    if (lives <= 0) return setTimeout(() => finish("All lives lost."), 650);
    idx += 1;
    setTimeout(() => (idx >= queue.length ? finish("All samples triaged.") : renderSample()), 760);
  }

  function finish(reason) {
    clearInterval(timerId);
    strongBtn.disabled = true;
    riskyBtn.disabled = true;
    const correctCount = review.filter((r) => r.correct).length;
    const accuracy = review.length ? Math.round((correctCount / review.length) * 100) : 0;
    resultSummary.textContent = `Score: ${score} | Accuracy: ${accuracy}% | Correct: ${correctCount}/${review.length} | ${reason}`;
    submitScore(correctCount, accuracy);
    reviewList.innerHTML = review.map((r) => `
      <article class="review-item ${r.correct ? "good" : "bad"}">
        <p><strong>Sample:</strong> ${r.sample}</p>
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
      const res = await fetch("/game/password.json");
      if (res.ok) cfg = { ...cfg, ...(await res.json()) };
    } catch {}
    try {
      await fetch("/game/password2.json");
    } catch {}
  }

  startBtn.addEventListener("click", start);
  restartBtn.addEventListener("click", start);
  strongBtn.addEventListener("click", () => answer(false));
  riskyBtn.addEventListener("click", () => answer(true));
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


