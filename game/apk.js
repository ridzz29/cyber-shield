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
  const apkText = document.getElementById("apkText");
  const contextText = document.getElementById("contextText");
  const feedbackText = document.getElementById("feedbackText");
  const signalList = document.getElementById("signalList");
  const missionLog = document.getElementById("missionLog");

  const safeBtn = document.getElementById("safeBtn");
  const maliciousBtn = document.getElementById("maliciousBtn");
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
    { sample: "com.whatsapp", context: "Installed from Play Store. Signature verified.", isMalicious: false, difficulty: "Easy", reason: "Known package with trusted source.", signals: ["Trusted source: Play Store", "Package naming is legitimate", "No suspicious words"] },
    { sample: "com.whatsap.update", context: "Downloaded from random forum as mod APK.", isMalicious: true, difficulty: "Easy", reason: "Lookalike package with unofficial source.", signals: ["Brand typo package", "Third-party download", "Mod distribution channel"] },
    { sample: "a3d5bf9df4f2e3db9df2126f2d89a7b91ce801d4542d76be8f7d6d0db9b326de", context: "Reported in malware feed from yesterday.", isMalicious: true, difficulty: "Hard", reason: "Known malicious SHA256 indicator.", signals: ["Threat feed hit", "Hash IOC match", "High-confidence malware intel"] },
    { sample: "com.netflix.mediaclient", context: "Official app update pushed from store.", isMalicious: false, difficulty: "Easy", reason: "Legitimate package and delivery path.", signals: ["Official package", "Trusted update channel", "No unusual behavior"] },
    { sample: "com.bank.secure.verify", context: "APK asks for SMS + Accessibility + Device Admin.", isMalicious: true, difficulty: "Medium", reason: "Permission abuse + impersonation pattern.", signals: ["High-risk permissions", "Bank impersonation naming", "Credential theft risk"] },
    { sample: "com.google.android.youtube", context: "System image app present on stock device.", isMalicious: false, difficulty: "Medium", reason: "Expected official package on Android.", signals: ["Known Google package", "Expected OEM bundle", "No suspicious artifacts"] },
    { sample: "com.android.systemupdate.service.pro", context: "Sideloaded installer asks to disable Play Protect.", isMalicious: true, difficulty: "Hard", reason: "Fake updater behavior and defense evasion.", signals: ["Disables security controls", "Fake system updater", "Sideload risk"] },
    { sample: "com.zoom.videomeetings", context: "Installed through corporate MDM policy.", isMalicious: false, difficulty: "Medium", reason: "Legitimate package with controlled deployment.", signals: ["Managed deployment", "Known collaboration app", "Low anomaly profile"] },
    { sample: "com.free.vpn.unlimited.proxy.crack", context: "Promoted as premium unlocked with ad SDK bundle.", isMalicious: true, difficulty: "Medium", reason: "Crack/premium lure with shady behavior.", signals: ["Crack keyword", "Untrusted monetization SDK", "High abuse probability"] },
    { sample: "com.microsoft.teams", context: "Installed from official store listing.", isMalicious: false, difficulty: "Easy", reason: "Trusted enterprise app package.", signals: ["Official publisher", "Expected package name", "Trusted source"] },
    { sample: "com.telegram.plus.hacked", context: "Shared over chat as modified secure build.", isMalicious: true, difficulty: "Hard", reason: "Hacked mod distribution is high-risk.", signals: ["Hacked/mod naming", "Unofficial distribution", "Likely tampered binary"] },
    { sample: "org.signal", context: "Open-source messenger build from verified channel.", isMalicious: false, difficulty: "Medium", reason: "Expected package and source integrity.", signals: ["Known secure app", "Verified channel", "No malicious indicators"] }
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
  const gameKey = "apk";

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
    apkText.textContent = q.sample;
    contextText.textContent = q.context;
    feedbackText.textContent = "Choose `Mark Safe` or `Flag Malicious`.";
    renderSignals(q.signals);
    safeBtn.disabled = false;
    maliciousBtn.disabled = false;
    locked = false;
    renderHud();
  }

  function answer(markMalicious) {
    if (locked) return;
    const q = queue[idx];
    if (!q) return;
    locked = true;

    const correct = Boolean(q.isMalicious) === Boolean(markMalicious);
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
      picked: markMalicious ? "Malicious" : "Safe",
      expected: q.isMalicious ? "Malicious" : "Safe",
      correct,
      reason: q.reason
    });

    safeBtn.disabled = true;
    maliciousBtn.disabled = true;
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
    maliciousBtn.disabled = true;
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
      const res = await fetch("/game/apk.json");
      if (res.ok) cfg = { ...cfg, ...(await res.json()) };
    } catch {}
    try {
      await fetch("/game/apk2.json");
    } catch {}
  }

  startBtn.addEventListener("click", start);
  restartBtn.addEventListener("click", start);
  safeBtn.addEventListener("click", () => answer(false));
  maliciousBtn.addEventListener("click", () => answer(true));
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


