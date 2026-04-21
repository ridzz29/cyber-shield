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
  const urlText = document.getElementById("urlText");
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
    { sample: "https://accounts.google.com/signin", context: "Official domain and valid HTTPS certificate.", isPhishing: false, difficulty: "Easy", reason: "Trusted domain and expected login path.", signals: ["Exact brand domain", "HTTPS valid", "No deceptive subdomain"] },
    { sample: "http://google-login-security-check.ru/verify", context: "Claims account suspension and asks immediate re-login.", isPhishing: true, difficulty: "Easy", reason: "Fake domain with urgency lure and insecure HTTP.", signals: ["Suspicious TLD", "Urgency language", "No HTTPS"] },
    { sample: "https://microsoft.com.security-alert-center.co/login", context: "Looks branded but domain ends in security-alert-center.co.", isPhishing: true, difficulty: "Hard", reason: "Brand keyword in subdomain, not real parent domain.", signals: ["Subdomain deception", "Brand impersonation", "Domain mismatch"] },
    { sample: "https://github.com/login", context: "Normal authentication endpoint.", isPhishing: false, difficulty: "Easy", reason: "Legitimate known destination.", signals: ["Trusted domain", "Expected route", "No obfuscation"] },
    { sample: "https://paypaI.com-security-check.net/auth", context: "Letter 'I' used to mimic lowercase 'l' in brand.", isPhishing: true, difficulty: "Medium", reason: "Homoglyph typo-squatting pattern.", signals: ["Lookalike characters", "Typosquatting", "Non-official domain"] },
    { sample: "https://support.apple.com/en-in", context: "Official support center in regional path.", isPhishing: false, difficulty: "Medium", reason: "Real vendor domain and standard URL structure.", signals: ["Official domain", "Legit locale path", "No malicious query"] },
    { sample: "https://secure-login-dropbox.com/account/recover", context: "Email says your storage will be deleted today.", isPhishing: true, difficulty: "Medium", reason: "Brand in domain but not official registrar namespace.", signals: ["Brand+keyword domain", "Fear pressure", "Unofficial host"] },
    { sample: "https://www.npci.org.in/what-we-do/upi/product-overview", context: "Informational page referenced by official bank notice.", isPhishing: false, difficulty: "Medium", reason: "Legitimate public reference domain.", signals: ["Known institution", "Informational path", "No credential capture"] },
    { sample: "https://login.amazon.com.re-authenticate-user.cn/update", context: "Contains amazon.com in left-most segment only.", isPhishing: true, difficulty: "Hard", reason: "Real root domain is re-authenticate-user.cn.", signals: ["Misleading prefix", "Actual root mismatch", "Credential bait"] },
    { sample: "https://www.cloudflare.com/learning/security/what-is-phishing/", context: "Security education article.", isPhishing: false, difficulty: "Easy", reason: "Trusted content domain and non-sensitive intent.", signals: ["Known vendor domain", "Educational resource", "No login request"] },
    { sample: "https://outlook.office365.com.credential-check.io/mail", context: "Prompt says mailbox blocked unless verified now.", isPhishing: true, difficulty: "Hard", reason: "Office365 string used as deceptive subdomain.", signals: ["Subdomain impersonation", "Urgent credential request", "Domain mismatch"] },
    { sample: "https://www.linkedin.com/jobs", context: "User manually typed URL from bookmark.", isPhishing: false, difficulty: "Easy", reason: "Expected host and navigation path.", signals: ["Trusted domain", "Bookmark source", "No suspicious params"] }
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
  const gameKey = "url";

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
    urlText.textContent = q.sample;
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
      const res = await fetch("/game/url.json");
      if (res.ok) cfg = { ...cfg, ...(await res.json()) };
    } catch {}
    try {
      await fetch("/game/url2.json");
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


