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
  const emailText = document.getElementById("emailText");
  const contextText = document.getElementById("contextText");
  const feedbackText = document.getElementById("feedbackText");
  const signalList = document.getElementById("signalList");
  const missionLog = document.getElementById("missionLog");

  const safeBtn = document.getElementById("safeBtn");
  const phishingBtn = document.getElementById("phishingBtn");
  const startBtn = document.getElementById("startBtn");
  const restartBtn = document.getElementById("restartBtn");
  const resultSummary = document.getElementById("resultSummary");
  const reviewList = document.getElementById("reviewList");

  const defaultConfig = {
    totalTimeSeconds: 90,
    questionsPerRun: 10,
    maxLives: 3,
    pointsCorrect: 120,
    pointsWrong: -40
  };

  const sampleBank = [
    { sample: "From: security@microsoft.com | Subject: New sign-in from Chrome", context: "No urgency, asks to review from official app.", isPhishing: false, difficulty: "Easy", reason: "Expected sender pattern and low-pressure language.", signals: ["Trusted sender domain", "No credential request", "Normal account alert"] },
    { sample: "From: support@micr0soft-help.work | Subject: Account Suspended in 10 mins", context: "Asks for password + OTP immediately.", isPhishing: true, difficulty: "Easy", reason: "Brand impersonation and high-pressure credential theft.", signals: ["Lookalike sender domain", "Urgency pressure", "OTP/password request"] },
    { sample: "From: noreply@github.com | Subject: Dependabot alert summary", context: "Links to your repository security tab.", isPhishing: false, difficulty: "Medium", reason: "Legitimate platform sender and expected context.", signals: ["Known sender", "Relevant context", "No coercion"] },
    { sample: "From: finance@company-payroll.com | Subject: Salary delayed - verify bank account", context: "Requests account login link in mail body.", isPhishing: true, difficulty: "Medium", reason: "Sensitive financial lure with credential prompt.", signals: ["Unexpected payroll request", "Credential link", "Potential pretexting"] },
    { sample: "From: noreply@google.com | Subject: Storage report", context: "Monthly summary with no urgent action.", isPhishing: false, difficulty: "Easy", reason: "Routine message from trusted domain.", signals: ["Expected sender", "Routine language", "No panic words"] },
    { sample: "From: helpdesk@it-support-alert.click | Subject: VPN certificate expired", context: "Attachment asks to run macro-enabled document.", isPhishing: true, difficulty: "Hard", reason: "Suspicious domain + dangerous attachment instruction.", signals: ["Suspicious TLD", "Macro execution prompt", "Unverified helpdesk source"] },
    { sample: "From: alerts@bankofamerica.com | Subject: Unusual login blocked", context: "Asks to open official app to confirm activity.", isPhishing: false, difficulty: "Medium", reason: "Defensive notification pattern with safe channel guidance.", signals: ["Trusted sender", "Official-app verification", "No direct credential form"] },
    { sample: "From: hr-department@company.com | Subject: Updated policy acknowledgement", context: "Reply-To points to external mailbox provider.", isPhishing: true, difficulty: "Hard", reason: "Header mismatch suggests impersonation.", signals: ["Reply-To mismatch", "Potential spoofing", "Policy pretext attack"] },
    { sample: "From: updates@docusign.com | Subject: Contract review requested", context: "Mentions expected vendor workflow.", isPhishing: false, difficulty: "Medium", reason: "Plausible sender and expected business process.", signals: ["Known workflow", "Trusted domain", "No extortion cues"] },
    { sample: "From: admin@crypto-bonus-giveaway.top | Subject: Final Warning: wallet disabled", context: "Demands immediate seed phrase confirmation.", isPhishing: true, difficulty: "Hard", reason: "Classic crypto phishing social engineering.", signals: ["Seed phrase request", "Threat language", "Unknown sender domain"] },
    { sample: "From: security@apple.com | Subject: Device added to Apple ID", context: "Suggests checking settings manually.", isPhishing: false, difficulty: "Medium", reason: "Trusted brand sender and non-coercive recommendation.", signals: ["Trusted sender", "Manual verify path", "No direct credential request"] },
    { sample: "From: notices@appleid-recovery.net | Subject: Immediate account lock notice", context: "Contains shortened URL to verify.", isPhishing: true, difficulty: "Hard", reason: "Unofficial domain + shortened link + panic tone.", signals: ["Unofficial sender domain", "Shortened URL", "High-pressure wording"] }
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
  const gameKey = "email";

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


  function shuffle(arr) {
    const list = [...arr];
    for (let i = list.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
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

  function renderSignals(signals) {
    signalList.innerHTML = (signals || []).map((s) => `<div class="signal-item">${s}</div>`).join("");
  }

  function renderSample() {
    const q = queue[idx];
    if (!q) {
      finish("Sample queue completed.");
      return;
    }
    difficultyTag.textContent = q.difficulty;
    emailText.textContent = q.sample;
    contextText.textContent = q.context;
    feedbackText.textContent = "Choose `Mark Safe` or `Flag Phishing`.";
    renderSignals(q.signals);
    safeBtn.disabled = false;
    phishingBtn.disabled = false;
    locked = false;
    renderHud();
  }

  function answer(markPhishing) {
    if (locked) return;
    const q = queue[idx];
    if (!q) return;
    locked = true;

    const correct = Boolean(q.isPhishing) === Boolean(markPhishing);
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

    review.push({
      sample: q.sample,
      picked: markPhishing ? "Phishing" : "Safe",
      expected: q.isPhishing ? "Phishing" : "Safe",
      correct,
      reason: q.reason
    });

    safeBtn.disabled = true;
    phishingBtn.disabled = true;
    renderHud();

    if (lives <= 0) {
      setTimeout(() => finish("All lives lost."), 650);
      return;
    }

    idx += 1;
    setTimeout(() => {
      if (idx >= queue.length) finish("All samples triaged.");
      else renderSample();
    }, 760);
  }

  function finish(reason) {
    clearInterval(timerId);
    safeBtn.disabled = true;
    phishingBtn.disabled = true;
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
      const res = await fetch("/game/email.json");
      if (res.ok) cfg = { ...cfg, ...(await res.json()) };
    } catch {}
    try {
      await fetch("/game/email2.json");
    } catch {}
  }

  startBtn.addEventListener("click", start);
  restartBtn.addEventListener("click", start);
  safeBtn.addEventListener("click", () => answer(false));
  phishingBtn.addEventListener("click", () => answer(true));
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


