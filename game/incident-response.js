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

  const localBtn = document.getElementById("localBtn");
  const escalateBtn = document.getElementById("escalateBtn");
  const startBtn = document.getElementById("startBtn");
  const restartBtn = document.getElementById("restartBtn");
  const resultSummary = document.getElementById("resultSummary");
  const reviewList = document.getElementById("reviewList");

  const defaultConfig = { totalTimeSeconds: 90, questionsPerRun: 10, maxLives: 3, pointsCorrect: 120, pointsWrong: -40 };
  const sampleBank = [
    { sample: "One workstation reports adware popup and unusual browser extension.", context: "No privileged account use and EDR containment succeeded immediately.", needsEscalation: false, difficulty: "Easy", reason: "Limited scope, contained endpoint, no critical asset impact.", signals: ["Single endpoint", "Contained quickly", "No lateral activity"] },
    { sample: "Domain admin account logs in from foreign IP and disables endpoint sensors.", context: "Multiple servers show matching suspicious activity.", needsEscalation: true, difficulty: "Hard", reason: "Privileged compromise with potential lateral movement needs incident command.", signals: ["Privileged account", "Defense evasion", "Multi-host impact"] },
    { sample: "Failed login spikes against one user mailbox for 10 minutes.", context: "MFA blocked access and source IP was blacklisted.", needsEscalation: false, difficulty: "Easy", reason: "Brute-force attempt mitigated with no confirmed breach.", signals: ["Blocked by MFA", "No successful access", "Scope controlled"] },
    { sample: "Payment records encrypted on finance share with ransom note discovered.", context: "Backups are available but encryption spread to adjacent hosts.", needsEscalation: true, difficulty: "Hard", reason: "Active ransomware event with business-critical disruption.", signals: ["Data encryption", "Business critical system", "Propagation evidence"] },
    { sample: "Suspicious attachment opened by intern, but sandbox detonation shows benign macro.", context: "No persistence or callback observed.", needsEscalation: false, difficulty: "Medium", reason: "Investigated and validated benign with no compromise indicators.", signals: ["Sandbox validated", "No callback traffic", "No persistence"] },
    { sample: "Customer PII exported from CRM by service account outside business hours.", context: "Export volume exceeds normal baseline by 20x.", needsEscalation: true, difficulty: "Hard", reason: "Possible data breach with legal and regulatory consequences.", signals: ["PII involved", "Anomalous volume", "Off-hours extraction"] },
    { sample: "SIEM alert flags known malware hash on quarantined USB before execution.", context: "Host never executed file and was isolated.", needsEscalation: false, difficulty: "Medium", reason: "Prevented event with no impact beyond local host handling.", signals: ["Prevented execution", "Local containment", "No spread"] },
    { sample: "Two cloud API keys leaked in public repo with active usage seen.", context: "One key has production write privileges.", needsEscalation: true, difficulty: "Hard", reason: "Credential exposure with active misuse on production environment.", signals: ["Credential leak", "Production privilege", "Observed abuse"] },
    { sample: "VPN gateway shows brief outage from planned maintenance window.", context: "No malicious logs and services restored as documented.", needsEscalation: false, difficulty: "Easy", reason: "Operational issue, not a security incident.", signals: ["Planned change", "No IOC", "Expected recovery"] },
    { sample: "Multiple subsidiaries report same phishing payload bypassing filters in one hour.", context: "Credential harvesting pages are collecting employee sign-ins.", needsEscalation: true, difficulty: "Hard", reason: "Coordinated enterprise-wide campaign with active credential theft.", signals: ["Multi-entity impact", "Filter bypass", "Active credential theft"] },
    { sample: "Internal portal defacement appears on one static page only.", context: "Audit logs show unauthorized deploy token usage.", needsEscalation: true, difficulty: "Medium", reason: "Integrity compromise indicates account/token breach.", signals: ["Unauthorized deploy", "Integrity violation", "Potential token compromise"] },
    { sample: "User receives scam call pretending to helpdesk and reports immediately.", context: "No credentials were shared and account activity is normal.", needsEscalation: false, difficulty: "Medium", reason: "Attempt blocked early; awareness event logged locally.", signals: ["No disclosure", "No account anomaly", "Awareness response"] }
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
  const gameKey = "incident-response";

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
    feedbackText.textContent = "Choose `Handle Local` or `Escalate Incident`.";
    renderSignals(q.signals);
    localBtn.disabled = false;
    escalateBtn.disabled = false;
    locked = false;
    renderHud();
  }

  function answer(markEscalate) {
    if (locked) return;
    const q = queue[idx];
    if (!q) return;
    locked = true;
    const correct = Boolean(q.needsEscalation) === Boolean(markEscalate);
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
    review.push({ sample: q.sample, picked: markEscalate ? "Escalate" : "Handle Local", expected: q.needsEscalation ? "Escalate" : "Handle Local", correct, reason: q.reason });
    localBtn.disabled = true;
    escalateBtn.disabled = true;
    renderHud();
    if (lives <= 0) return setTimeout(() => finish("All lives lost."), 650);
    idx += 1;
    setTimeout(() => (idx >= queue.length ? finish("All scenarios triaged.") : renderSample()), 760);
  }

  function finish(reason) {
    clearInterval(timerId);
    localBtn.disabled = true;
    escalateBtn.disabled = true;
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
      const res = await fetch("/game/incident-response.json");
      if (res.ok) cfg = { ...cfg, ...(await res.json()) };
    } catch {}
    try {
      await fetch("/game/incident-response2.json");
    } catch {}
  }

  startBtn.addEventListener("click", start);
  restartBtn.addEventListener("click", start);
  localBtn.addEventListener("click", () => answer(false));
  escalateBtn.addEventListener("click", () => answer(true));
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


