const landingView = document.getElementById("landingView");
const authView = document.getElementById("authView");
const dashView = document.getElementById("dashView");

const userLabel = document.getElementById("userLabel");
const welcome = document.getElementById("welcome");
const joinNowBtn = document.getElementById("joinNowBtn");

const showLogin = document.getElementById("showLogin");
const showSignup = document.getElementById("showSignup");
const loginPane = document.getElementById("loginPane");
const signupPane = document.getElementById("signupPane");

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const loginMsg = document.getElementById("loginMsg");
const signupMsg = document.getElementById("signupMsg");

const learnTab = document.getElementById("learnTab");
const scoreTab = document.getElementById("scoreTab");
const leaderboardTab = document.getElementById("leaderboardTab");
const anTab = document.getElementById("anTab");
const adminTab = document.getElementById("adminTab");
const learnSection = document.getElementById("learnSection");
const leaderboardSection = document.getElementById("leaderboardSection");
const anSection = document.getElementById("anSection");
const anAskSection = document.getElementById("anAskSection");
const adminSection = document.getElementById("adminSection");
const infoSection = document.getElementById("infoSection");
const scoreSection = document.getElementById("scoreSection");
const leaderSection = document.getElementById("leaderSection");
const settingsSection = document.getElementById("settingsSection");
const infoTitle = document.getElementById("infoTitle");
const infoDesc = document.getElementById("infoDesc");
const infoBody = document.getElementById("infoBody");
const scoreBars = document.getElementById("scoreBars");
const overallAccuracy = document.getElementById("overallAccuracy");
const bestModule = document.getElementById("bestModule");
const lowestModule = document.getElementById("lowestModule");
const myRuns = document.getElementById("myRuns");
const myAvgScore = document.getElementById("myAvgScore");
const myBestScore = document.getElementById("myBestScore");
const myGamesPlayed = document.getElementById("myGamesPlayed");
const myRecentBody = document.getElementById("myRecentBody");

const menuDashboard = document.getElementById("menuDashboard");
const menuAbout = document.getElementById("menuAbout");
const menuServices = document.getElementById("menuServices");
const menuContact = document.getElementById("menuContact");
const menuScores = document.getElementById("menuScores");
const menuLeaderboard = document.getElementById("menuLeaderboard");
const menuSettings = document.getElementById("menuSettings");
const menuSupport = document.getElementById("menuSupport");

const leaderForm = document.getElementById("leaderForm");
const leaderName = document.getElementById("leaderName");
const leaderPhishing = document.getElementById("leaderPhishing");
const leaderPassword = document.getElementById("leaderPassword");
const leaderLinks = document.getElementById("leaderLinks");
const leaderMalware = document.getElementById("leaderMalware");
const leaderEmail = document.getElementById("leaderEmail");
const leaderPodium = document.getElementById("leaderPodium");
const leaderBars = document.getElementById("leaderBars");
const leaderTableBody = document.getElementById("leaderTableBody");

const urlBtn = document.getElementById("urlBtn");
const apkBtn = document.getElementById("apkBtn");
const mailBtn = document.getElementById("mailBtn");
const urlPane = document.getElementById("urlPane");
const apkPane = document.getElementById("apkPane");
const mailPane = document.getElementById("mailPane");
const urlAnalyzeForm = document.getElementById("urlAnalyzeForm");
const apkAnalyzeForm = document.getElementById("apkAnalyzeForm");
const mailAnalyzeForm = document.getElementById("mailAnalyzeForm");
const urlInput = document.getElementById("urlInput");
const apkName = document.getElementById("apkName");
const apkFile = document.getElementById("apkFile");
const apkFileMeta = document.getElementById("apkFileMeta");
const apkSource = document.getElementById("apkSource");
const mailHead = document.getElementById("mailHead");
  const urlAnalyzeBtn = document.getElementById("urlAnalyzeBtn");
  const thinkBeforeBtn = document.getElementById("thinkBeforeBtn");
  const urlRefreshBtn = document.getElementById("urlRefreshBtn");
const thinkBeforePanel = document.getElementById("thinkBeforePanel");
const thinkBeforeTitle = document.getElementById("thinkBeforeTitle");
const thinkBeforeResult = document.getElementById("thinkBeforeResult");
const thinkBeforeStatus = document.getElementById("thinkBeforeStatus");
const thinkBeforeScore = document.getElementById("thinkBeforeScore");
const thinkBeforeExplain = document.getElementById("thinkBeforeExplain");
const thinkBeforeConnection = document.getElementById("thinkBeforeConnection");
const thinkBeforeRetryBtn = document.getElementById("thinkBeforeRetryBtn");
const thinkBeforeDisableBtn = document.getElementById("thinkBeforeDisableBtn");
  const apkAnalyzeBtn = document.getElementById("apkAnalyzeBtn");
  const apkRefreshBtn = document.getElementById("apkRefreshBtn");
  const mailAnalyzeBtn = document.getElementById("mailAnalyzeBtn");
  const mailRefreshBtn = document.getElementById("mailRefreshBtn");
const adminExportForm = document.getElementById("adminExportForm");
const adminKeyInput = document.getElementById("adminKeyInput");
const exportLeaderboardBtn = document.getElementById("exportLeaderboardBtn");
const dataTableBody = document.getElementById("dataTableBody");
const dataTypeFilter = document.getElementById("dataTypeFilter");
const dataRefreshBtn = document.getElementById("dataRefreshBtn");
const dataClearBtn = document.getElementById("dataClearBtn");
const urlResult = document.getElementById("urlResult");
const riskLevelBadge = document.getElementById("riskLevelBadge");
const riskMeterFill = document.getElementById("riskMeterFill");
const riskSummary = document.getElementById("riskSummary");
const riskScoreValue = document.getElementById("riskScoreValue");
const riskConfidenceValue = document.getElementById("riskConfidenceValue");
const riskAccuracyValue = document.getElementById("riskAccuracyValue");
const riskFactors = document.getElementById("riskFactors");
const urlLoadingGraph = document.getElementById("urlLoadingGraph");
const apkResult = document.getElementById("apkResult");
const apkRiskLevelBadge = document.getElementById("apkRiskLevelBadge");
const apkRiskMeterFill = document.getElementById("apkRiskMeterFill");
const apkRiskSummary = document.getElementById("apkRiskSummary");
const apkRiskScoreValue = document.getElementById("apkRiskScoreValue");
const apkRiskConfidenceValue = document.getElementById("apkRiskConfidenceValue");
const apkRiskAccuracyValue = document.getElementById("apkRiskAccuracyValue");
const apkRiskFactors = document.getElementById("apkRiskFactors");
const apkLoadingGraph = document.getElementById("apkLoadingGraph");
const emailResult = document.getElementById("emailResult");
const emailRiskLevelBadge = document.getElementById("emailRiskLevelBadge");
const emailRiskMeterFill = document.getElementById("emailRiskMeterFill");
const emailRiskSummary = document.getElementById("emailRiskSummary");
const emailRiskScoreValue = document.getElementById("emailRiskScoreValue");
const emailRiskConfidenceValue = document.getElementById("emailRiskConfidenceValue");
const emailRiskAccuracyValue = document.getElementById("emailRiskAccuracyValue");
const emailRiskFactors = document.getElementById("emailRiskFactors");
const emailLoadingGraph = document.getElementById("emailLoadingGraph");
const analyzerDesktopList = document.getElementById("analyzerDesktopList");
const anHistoryCount = document.getElementById("anHistoryCount");
const agentStatus = document.getElementById("agentStatus");
const agentSteps = document.getElementById("agentSteps");
const agentReport = document.getElementById("agentReport");
const analyzerAskTitle = document.getElementById("analyzerAskTitle");
const analyzerAskTag = document.getElementById("analyzerAskTag");
const analyzerAskLabel = document.getElementById("analyzerAskLabel");
const analyzerAskForm = document.getElementById("analyzerAskForm");
const analyzerAskInput = document.getElementById("analyzerAskInput");
const analyzerAskBtn = document.getElementById("analyzerAskBtn");
const analyzerAskOutput = document.getElementById("analyzerAskOutput");
const openAnalyzerChatBtn = document.getElementById("openAnalyzerChatBtn");
const chatbotModal = document.getElementById("chatbotModal");
const chatbotCloseBtn = document.getElementById("chatbotCloseBtn");
const chatbotLog = document.getElementById("chatbotLog");
const chatbotForm = document.getElementById("chatbotForm");
const chatbotInput = document.getElementById("chatbotInput");
const chatbotSend = document.getElementById("chatbotSend");
const chatbotStatusBadge = document.getElementById("chatbotStatusBadge");
const chatbotCounter = document.getElementById("chatbotCounter");
const chatbotQuickActions = document.getElementById("chatbotQuickActions");
const chatbotTitle = document.getElementById("chatbotTitle");
const chatbotHint = document.getElementById("chatbotHint");
const historyModal = document.getElementById("historyModal");
const historyModalClose = document.getElementById("historyModalClose");
const historyModalType = document.getElementById("historyModalType");
const historyModalTime = document.getElementById("historyModalTime");
const historyModalSource = document.getElementById("historyModalSource");
const historyModalRisk = document.getElementById("historyModalRisk");
const historyModalSafe = document.getElementById("historyModalSafe");
const historyModalUser = document.getElementById("historyModalUser");
const historyModalEmail = document.getElementById("historyModalEmail");
const historyModalId = document.getElementById("historyModalId");
const historyModalDetails = document.getElementById("historyModalDetails");
const analyzerChatLaunchButtons = document.querySelectorAll("[data-open-analyzer-chat]");
const themeDarkBtn = document.getElementById("themeDarkBtn");
const themeLightBtn = document.getElementById("themeLightBtn");
const resetGameBtn = document.getElementById("resetGameBtn");
const deleteAccountBtn = document.getElementById("deleteAccountBtn");
const phishNewBtn = document.getElementById("phishNewBtn");
const phishQuestionWrap = document.getElementById("phishQuestionWrap");
const phishFrom = document.getElementById("phishFrom");
const phishSubject = document.getElementById("phishSubject");
const phishSnippet = document.getElementById("phishSnippet");
const phishLink = document.getElementById("phishLink");
const phishQuestionText = document.getElementById("phishQuestionText");
const phishOptions = document.getElementById("phishOptions");
const phishResult = document.getElementById("phishResult");
const phishScore = document.getElementById("phishScore");
const phishRound = document.getElementById("phishRound");
const phishHunterCard = document.getElementById("phishHunterCard");
const passwordFortressCard = document.getElementById("passwordFortressCard");
const safeLinkSprintCard = document.getElementById("safeLinkSprintCard");
const malwareDefenseCard = document.getElementById("malwareDefenseCard");
const scoreDashboardCard = document.getElementById("scoreDashboardCard");
const phishGamePanel = document.getElementById("phishGamePanel");
const phishMetricBar = document.getElementById("phishMetricBar");
const passMetricBar = document.getElementById("passMetricBar");
const linksMetricBar = document.getElementById("linksMetricBar");
const scoreMetricBar = document.getElementById("scoreMetricBar");
const learnGameUrlCard = document.getElementById("learnGameUrlCard");
const learnGameApkCard = document.getElementById("learnGameApkCard");
const learnGameEmailCard = document.getElementById("learnGameEmailCard");
const learnGamePasswordCard = document.getElementById("learnGamePasswordCard");
const learnGameSocialCard = document.getElementById("learnGameSocialCard");
const learnGameIncidentCard = document.getElementById("learnGameIncidentCard");
const questLevelBadge = document.getElementById("questLevelBadge");
const questXpBadge = document.getElementById("questXpBadge");
const questStreakBadge = document.getElementById("questStreakBadge");
const questProgressBar = document.getElementById("questProgressBar");
const questProgressLabel = document.getElementById("questProgressLabel");
const questGrid = document.getElementById("questGrid");
let supportChatBusy = false;
let chatbotBusy = false;
let chatbotInitialized = false;
let chatbotTypingEl = null;
let activeChatbotAnalyzer = "url";
const TBYC_MESSAGE_SOURCE = "cyber-shield";
const TBYC_EXTENSION_SOURCE = "tbyc-extension";
const TBYC_MESSAGE_TYPE_ANALYZE = "TBYC_ANALYZE_URL";
const TBYC_MESSAGE_TYPE_RESULT = "TBYC_ANALYZE_RESULT";
const TBYC_MESSAGE_TYPE_ENABLE = "TBYC_SET_ENABLED";
const TBYC_MESSAGE_TYPE_ENABLE_ACK = "TBYC_SET_ENABLED_ACK";
  let thinkBeforePendingRequestId = "";
  let thinkBeforeEnableRequestId = "";
  let thinkBeforeFallbackTimer;
  let thinkBeforeEnableTimer;
  let thinkBeforeApiRequestId = "";
  let thinkBeforeApiReady = false;
  let thinkBeforeApiFailed = false;
  let thinkBeforeExtensionReady = false;
  let thinkBeforeLogged = false;
  let thinkBeforeLogUrl = "";

const logoutBtn = document.getElementById("logoutBtn");
const logoLinks = document.querySelectorAll(".logo-link");

let errorPopupTimer;
let currentView = "landing";
const viewHistory = [];
let analyzerRowsCache = [];
let currentPhishQuestionId = "";
let phishingScore = 0;
let phishingRound = 0;
let currentAnalyzerTab = "url";
const latestAnalyzerResultByTab = {
  url: null,
  apk: null,
  email: null
};
const agentStateByTab = {
  url: { status: "Idle.", steps: [], report: null, caseId: "" },
  apk: { status: "Idle.", steps: [], report: null, caseId: "" },
  email: { status: "Idle.", steps: [], report: null, caseId: "" }
};

const infoContent = {
  about: {
    title: "About Security",
    desc: "Cyber-Shield focuses on practical cybersecurity awareness and prevention.",
    body: [
      "Cyber-Shield helps users understand everyday cyber risks with simple guidance and interactive learning.",
      "It focuses on phishing awareness, password hygiene, secure browsing, and safer handling of unknown links, apps, and emails."
    ]
  },
  services: {
    title: "Services",
    desc: "Tools and guidance to improve cyber safety across daily digital actions.",
    body: [
      "URL, APK, and email risk checks from a single dashboard.",
      "Hands-on awareness modules and dashboards to support safer user behavior over time."
    ]
  },
  contact: {
    title: "Contact",
    desc: "Reach our security support team for guidance or incident reporting.",
    body: [
      "Email: support@cyber-shield.local",
      "Phone: +1 (800) 555-0179 | Hours: Monday-Friday, 9:00 AM-6:00 PM"
    ]
  },
  support: {
    title: "AI Support",
    desc: "Ask Cyber-Shield AI about security issues, suspicious activity, or best practices.",
    body: []
  }
};

const defaultLeaderboardData = [
  { name: "Ava", phishing: 92, password: 84, links: 88, malware: 79, email: 90 },
  { name: "Noah", phishing: 85, password: 81, links: 86, malware: 76, email: 82 },
  { name: "Mia", phishing: 90, password: 87, links: 91, malware: 83, email: 88 },
  { name: "Ethan", phishing: 78, password: 74, links: 80, malware: 72, email: 77 }
];
const themeStorageKey = "cyber_theme";
const adminSessionStorageKey = "cyber_admin_session";
const questStoragePrefix = "cyber_quest_state_";
const questMissions = [
  { id: "phishing-hunter", title: "Phishing Hunter", desc: "Play one phishing mission.", xp: 30, action: "open-phish" },
  { id: "url-scan", title: "URL Scout", desc: "Run one URL analysis.", xp: 20, action: "go-url" },
  { id: "apk-triage", title: "APK Triage", desc: "Analyze one APK hash/file.", xp: 25, action: "go-apk" },
  { id: "email-triage", title: "Email Defender", desc: "Analyze one suspicious email.", xp: 25, action: "go-email" },
  { id: "score-check", title: "Score Checkpoint", desc: "Open your score dashboard.", xp: 15, action: "go-score" },
  { id: "rank-push", title: "Rank Push", desc: "Open leaderboard and submit results.", xp: 35, action: "go-leaderboard" }
];

function getAnalyzerHiddenStorageKey() {
  const email = String(getSessionUser()?.email || "guest@local").trim().toLowerCase() || "guest@local";
  return `cyber_hidden_analyzer_ids_${email}`;
}

function loadHiddenAnalyzerIds() {
  try {
    const raw = localStorage.getItem(getAnalyzerHiddenStorageKey());
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.map((v) => String(v || "")).filter(Boolean));
  } catch {
    return new Set();
  }
}

function saveHiddenAnalyzerIds(idSet) {
  localStorage.setItem(getAnalyzerHiddenStorageKey(), JSON.stringify(Array.from(idSet)));
}

function getSessionUser() {
  const raw = localStorage.getItem("cyber_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function isAdminSession() {
  return localStorage.getItem(adminSessionStorageKey) === "1";
}

function setAdminSession(isAdmin) {
  if (isAdmin) {
    localStorage.setItem(adminSessionStorageKey, "1");
  } else {
    localStorage.removeItem(adminSessionStorageKey);
  }
}

function applyAdminAccessVisibility() {
  const isAdmin = isAdminSession();
  if (learnTab) {
    learnTab.style.display = isAdmin ? "none" : "";
    learnTab.hidden = isAdmin;
  }
  if (scoreTab) {
    scoreTab.style.display = isAdmin ? "none" : "";
    scoreTab.hidden = isAdmin;
  }
  if (anTab) {
    anTab.style.display = isAdmin ? "none" : "";
    anTab.hidden = isAdmin;
  }
  if (leaderboardTab) {
    leaderboardTab.style.display = isAdmin ? "" : "none";
    leaderboardTab.hidden = !isAdmin;
  }
  if (adminTab) {
    adminTab.style.display = isAdmin ? "" : "none";
    adminTab.hidden = !isAdmin;
  }
  if (menuLeaderboard) {
    menuLeaderboard.style.display = isAdmin ? "" : "none";
    menuLeaderboard.hidden = !isAdmin;
  }
  if (!isAdmin) {
    if (leaderboardSection) leaderboardSection.classList.remove("active");
    if (adminSection) adminSection.classList.remove("active");
  } else {
    if (learnSection) learnSection.classList.remove("active");
    if (anSection) anSection.classList.remove("active");
    if (anAskSection) anAskSection.classList.remove("active");
    if (infoSection) infoSection.classList.remove("active");
    if (scoreSection) scoreSection.classList.remove("active");
    if (leaderSection) leaderSection.classList.remove("active");
    if (settingsSection) settingsSection.classList.remove("active");
    if (leaderboardSection) leaderboardSection.classList.add("active");
    if (leaderboardTab) leaderboardTab.classList.add("active");
    if (adminTab) adminTab.classList.remove("active");
  }
}

function getLeaderboardStorageKey() {
  const user = getSessionUser();
  const email = (user?.email || "guest").toLowerCase();
  return `cyber_leaderboard_data_${email}`;
}

function getQuestStorageKey() {
  const user = getSessionUser();
  const email = (user?.email || "guest").toLowerCase();
  return `${questStoragePrefix}${email}`;
}

function getTodayKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getDayDiff(previousDay, currentDay) {
  if (!previousDay || !currentDay) return 0;
  const prev = new Date(`${previousDay}T00:00:00`);
  const curr = new Date(`${currentDay}T00:00:00`);
  if (Number.isNaN(prev.getTime()) || Number.isNaN(curr.getTime())) return 0;
  return Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
}

function loadQuestState() {
  const fallback = { completed: [], streak: 0, lastDoneDate: "" };
  const raw = localStorage.getItem(getQuestStorageKey());
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    const completed = Array.isArray(parsed.completed) ? parsed.completed.filter((id) => questMissions.some((m) => m.id === id)) : [];
    return {
      completed,
      streak: Number(parsed.streak || 0),
      lastDoneDate: String(parsed.lastDoneDate || "")
    };
  } catch {
    return fallback;
  }
}

function saveQuestState(state) {
  localStorage.setItem(getQuestStorageKey(), JSON.stringify(state));
}

function computeQuestStats(state) {
  const completedSet = new Set(state.completed);
  const completedCount = state.completed.length;
  const xp = questMissions
    .filter((m) => completedSet.has(m.id))
    .reduce((sum, m) => sum + m.xp, 0);
  const level = 1 + Math.floor(xp / 100);
  const levelXp = xp % 100;
  return { completedSet, completedCount, xp, level, levelXp };
}

function completeQuest(questId) {
  const state = loadQuestState();
  if (state.completed.includes(questId)) return;

  state.completed.push(questId);
  const today = getTodayKey();
  const gap = getDayDiff(state.lastDoneDate, today);
  if (!state.lastDoneDate) {
    state.streak = 1;
  } else if (gap === 1) {
    state.streak += 1;
  } else if (gap > 1) {
    state.streak = 1;
  }
  state.lastDoneDate = today;
  saveQuestState(state);
}

function handleQuestAction(action) {
  if (action === "open-phish") {
    openPhishingHunterGame();
    return;
  }
  if (action === "go-url") {
    setMainTab("an");
    setDashboardMenu("dashboard");
    setAnalyzerTab("url");
    return;
  }
  if (action === "go-apk") {
    setMainTab("an");
    setDashboardMenu("dashboard");
    setAnalyzerTab("apk");
    return;
  }
  if (action === "go-email") {
    setMainTab("an");
    setDashboardMenu("dashboard");
    setAnalyzerTab("mail");
    return;
  }
  if (action === "go-score") {
    showScoreBoard();
    return;
  }
  if (action === "go-leaderboard") {
    showLeaderboard();
  }
}

function renderQuestBoard() {
  if (!questGrid) return;
  const state = loadQuestState();
  const stats = computeQuestStats(state);

  if (questLevelBadge) questLevelBadge.textContent = `Level ${stats.level}`;
  if (questXpBadge) questXpBadge.textContent = `${stats.xp} XP`;
  if (questStreakBadge) questStreakBadge.textContent = `Streak ${state.streak}`;
  if (questProgressBar) {
    const ratio = Math.round((stats.completedCount / questMissions.length) * 100);
    questProgressBar.style.width = `${ratio}%`;
  }
  if (questProgressLabel) {
    questProgressLabel.textContent = `${stats.completedCount} / ${questMissions.length} missions complete`;
  }

  questGrid.innerHTML = questMissions.map((mission, index) => {
    const done = stats.completedSet.has(mission.id);
    const unlocked = done || index <= stats.completedCount;
    const status = done ? "Completed" : unlocked ? "Start Mission" : "Locked";
    return `
      <article class="quest-item ${unlocked ? "" : "locked"}">
        <div class="quest-item-head">
          <h5>${escapeHtml(mission.title)}</h5>
          <span class="quest-xp">+${mission.xp} XP</span>
        </div>
        <p class="tag">${escapeHtml(mission.desc)}</p>
        <button
          class="quest-action"
          type="button"
          data-quest-id="${escapeHtml(mission.id)}"
          data-quest-action="${escapeHtml(mission.action)}"
          ${unlocked ? "" : "disabled"}
        >${status}</button>
      </article>
    `;
  }).join("");
}

function ensureErrorPopup() {
  let popup = document.getElementById("errorPopup");
  if (popup) return popup;

  const style = document.createElement("style");
  style.textContent = `
    #errorPopup {
      position: fixed;
      top: 18px;
      right: 18px;
      z-index: 9999;
      min-width: 240px;
      max-width: 420px;
      padding: 12px 14px;
      border-radius: 10px;
      background: #ffebee;
      color: #b71c1c;
      border: 1px solid #ef9a9a;
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.2);
      font-weight: 700;
      opacity: 0;
      transform: translateY(-8px);
      pointer-events: none;
      transition: opacity 0.18s ease, transform 0.18s ease;
    }
    #errorPopup.show {
      opacity: 1;
      transform: translateY(0);
    }
  `;
  document.head.appendChild(style);

  popup = document.createElement("div");
  popup.id = "errorPopup";
  popup.setAttribute("role", "alert");
  document.body.appendChild(popup);
  return popup;
}

function setAuthMode(mode) {
  const loginMode = mode === "login";
  showLogin.classList.toggle("active", loginMode);
  showSignup.classList.toggle("active", !loginMode);
  loginPane.classList.toggle("active", loginMode);
  signupPane.classList.toggle("active", !loginMode);
  loginMsg.textContent = "";
  signupMsg.textContent = "";
}

function resetAnalyzerSearchState() {
  if (urlInput) urlInput.value = "";
  if (apkName) apkName.value = "";
  if (mailHead) mailHead.value = "";
  if (apkFile) apkFile.value = "";
  if (apkFileMeta) apkFileMeta.textContent = "You can paste package/hash above or choose an APK file.";
  if (agentStatus) agentStatus.textContent = "Idle.";
  if (agentSteps) agentSteps.innerHTML = "";
  if (agentReport) {
    agentReport.innerHTML = "";
    agentReport.classList.add("hidden");
  }
  if (analyzerAskInput) analyzerAskInput.value = "";
  if (analyzerAskOutput) {
    analyzerAskOutput.textContent = "";
    analyzerAskOutput.classList.add("hidden");
  }
  agentStateByTab.url = { status: "Idle.", steps: [], report: null, caseId: "" };
  agentStateByTab.apk = { status: "Idle.", steps: [], report: null, caseId: "" };
  agentStateByTab.email = { status: "Idle.", steps: [], report: null, caseId: "" };
}

function resetUrlAnalyzerUi() {
  setAnalyzerLoading("url", false);
  if (urlInput) urlInput.value = "";
  if (urlResult) urlResult.classList.add("hidden");
  if (riskLevelBadge) {
    riskLevelBadge.textContent = "-";
    riskLevelBadge.className = "risk-badge";
  }
  if (riskMeterFill) riskMeterFill.style.width = "0%";
  if (riskSummary) riskSummary.textContent = "Run analysis to see details.";
  if (riskScoreValue) riskScoreValue.textContent = "0%";
  if (riskConfidenceValue) riskConfidenceValue.textContent = "0%";
  if (riskAccuracyValue) riskAccuracyValue.textContent = "0%";
  if (riskFactors) riskFactors.innerHTML = "";
  latestAnalyzerResultByTab.url = null;

  if (thinkBeforePanel) thinkBeforePanel.classList.add("hidden");
  if (thinkBeforeTitle) thinkBeforeTitle.textContent = "Think Before You Click";
  if (thinkBeforeResult) thinkBeforeResult.classList.add("hidden");
  if (thinkBeforeStatus) {
    thinkBeforeStatus.textContent = "-";
    thinkBeforeStatus.className = "think-before-status";
  }
  if (thinkBeforeScore) thinkBeforeScore.textContent = "0";
  if (thinkBeforeExplain) thinkBeforeExplain.textContent = "";
  setThinkBeforeConnectionStatus("wait", "Extension: not checked");
  thinkBeforeApiReady = false;
  thinkBeforeApiFailed = false;
  thinkBeforeExtensionReady = false;
}

function resetApkAnalyzerUi() {
  setAnalyzerLoading("apk", false);
  if (apkName) apkName.value = "";
  if (apkFile) apkFile.value = "";
  if (apkFileMeta) apkFileMeta.textContent = "You can paste package/hash above or choose an APK file.";
  if (apkSource) apkSource.selectedIndex = 0;
  if (apkResult) apkResult.classList.add("hidden");
  if (apkRiskLevelBadge) {
    apkRiskLevelBadge.textContent = "-";
    apkRiskLevelBadge.className = "risk-badge";
  }
  if (apkRiskMeterFill) apkRiskMeterFill.style.width = "0%";
  if (apkRiskSummary) apkRiskSummary.textContent = "Run analysis to see details.";
  if (apkRiskScoreValue) apkRiskScoreValue.textContent = "0%";
  if (apkRiskConfidenceValue) apkRiskConfidenceValue.textContent = "0%";
  if (apkRiskAccuracyValue) apkRiskAccuracyValue.textContent = "0%";
  if (apkRiskFactors) apkRiskFactors.innerHTML = "";
  latestAnalyzerResultByTab.apk = null;
}

function resetEmailAnalyzerUi() {
  setAnalyzerLoading("email", false);
  if (mailHead) mailHead.value = "";
  if (emailResult) emailResult.classList.add("hidden");
  if (emailRiskLevelBadge) {
    emailRiskLevelBadge.textContent = "-";
    emailRiskLevelBadge.className = "risk-badge";
  }
  if (emailRiskMeterFill) emailRiskMeterFill.style.width = "0%";
  if (emailRiskSummary) emailRiskSummary.textContent = "Run analysis to see details.";
  if (emailRiskScoreValue) emailRiskScoreValue.textContent = "0%";
  if (emailRiskConfidenceValue) emailRiskConfidenceValue.textContent = "0%";
  if (emailRiskAccuracyValue) emailRiskAccuracyValue.textContent = "0%";
  if (emailRiskFactors) emailRiskFactors.innerHTML = "";
  latestAnalyzerResultByTab.email = null;
}

function refreshAnalyzerTab(tabKey) {
  if (analyzerAskInput) analyzerAskInput.value = "";
  if (analyzerAskOutput) {
    analyzerAskOutput.textContent = "";
    analyzerAskOutput.classList.add("hidden");
  }
  if (tabKey === "apk") {
    resetApkAnalyzerUi();
    agentStateByTab.apk = { status: "Idle.", steps: [], report: null, caseId: "" };
  } else if (tabKey === "email") {
    resetEmailAnalyzerUi();
    agentStateByTab.email = { status: "Idle.", steps: [], report: null, caseId: "" };
  } else {
    resetUrlAnalyzerUi();
    agentStateByTab.url = { status: "Idle.", steps: [], report: null, caseId: "" };
  }
}

function setMainTab(tab) {
  if (tab === "admin" && !isAdminSession()) {
    showErrorPopup("Only admin can access Data.");
    tab = "learn";
  }
  if (tab !== "an") {
    resetAnalyzerSearchState();
  }
  if (scoreTab) scoreTab.classList.toggle("active", false);
  learnTab.classList.toggle("active", tab === "learn");
  anTab.classList.toggle("active", tab === "an");
  adminTab.classList.toggle("active", tab === "admin");
  learnSection.classList.toggle("active", tab === "learn");
  anSection.classList.toggle("active", tab === "an");
  if (anAskSection) anAskSection.classList.toggle("active", tab === "an");
  adminSection.classList.toggle("active", tab === "admin");
  infoSection.classList.remove("active");
  scoreSection.classList.remove("active");
  leaderSection.classList.remove("active");
  settingsSection.classList.remove("active");
}

function setAnalyzerTab(tab) {
  const nextTab = tab === "apk" ? "apk" : tab === "mail" ? "email" : "url";
  const previousTab = currentAnalyzerTab;
  currentAnalyzerTab = nextTab;
  urlBtn.classList.toggle("active", tab === "url");
  apkBtn.classList.toggle("active", tab === "apk");
  mailBtn.classList.toggle("active", tab === "mail");
  urlPane.classList.toggle("active", tab === "url");
  apkPane.classList.toggle("active", tab === "apk");
  mailPane.classList.toggle("active", tab === "mail");
  if (previousTab !== currentAnalyzerTab) {
    refreshAnalyzerTab(currentAnalyzerTab);
  }
  updateAnalyzerAskPanel(currentAnalyzerTab);
  applyChatbotAnalyzerPreset(currentAnalyzerTab, false);
  renderAgentStateForTab(currentAnalyzerTab);
}

function updateAnalyzerAskPanel(kind) {
  const type = kind === "apk" ? "apk" : kind === "email" ? "email" : "url";
  if (analyzerAskTitle) analyzerAskTitle.textContent = `Ask AI (${type.toUpperCase()})`;
  if (analyzerAskTag) analyzerAskTag.textContent = `${type.toUpperCase()} Assistant`;
  if (analyzerAskLabel) {
    analyzerAskLabel.textContent = type === "url"
      ? "Ask about this URL analysis"
      : type === "apk"
        ? "Ask about this APK analysis"
        : "Ask about this email analysis";
  }
  if (analyzerAskInput) {
    analyzerAskInput.placeholder = type === "url"
      ? "Is this URL safe? What should I verify before opening it?"
      : type === "apk"
        ? "What checks should I do before installing this APK?"
        : "Is this email phishing? What indicators matter most here?";
  }
}

function setMessage(el, text, type) {
  el.className = "msg " + (type === "ok" ? "ok" : "err");
  el.textContent = text;
}

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatAnalyzerTypeLabel(type) {
  const safeType = String(type || "").toLowerCase();
  if (safeType === "url") return "URL";
  if (safeType === "apk") return "APK";
  if (safeType === "email") return "EMAIL";
  return safeType ? safeType.toUpperCase() : "UNKNOWN";
}

function formatAnalyzerOriginLabel(origin) {
  const value = String(origin || "").trim().toLowerCase();
  if (value === "cursor") return "Cursor Analyzer";
  return "Website Analyzer";
}

function getSortedAnalyzerRows() {
  return Array.isArray(analyzerRowsCache)
    ? [...analyzerRowsCache].sort((a, b) => new Date(b?.timestamp || 0).getTime() - new Date(a?.timestamp || 0).getTime())
    : [];
}

function clampPercent(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function extractPercentFromText(text, label) {
  const source = String(text || "");
  const regex = new RegExp(`${label}\\s*[:=]\\s*(\\d{1,3})%`, "i");
  const match = source.match(regex);
  if (!match || !match[1]) return null;
  return clampPercent(match[1]);
}

function isAnalyzerRowComplete(row) {
  const details = String(row?.details || "");
  const riskValue = clampPercent(
    row?.riskScore ?? row?.risk_score ?? row?.risk
  ) ?? extractPercentFromText(details, "risk");
  const safeValue = clampPercent(
    row?.safeScore ?? row?.safe_score
  ) ?? extractPercentFromText(details, "safe");
  if (riskValue !== null || safeValue !== null) return true;
  if (/status:\s*completed/i.test(details)) return true;
  if (/status:\s*submitted/i.test(details)) return false;
  return Boolean(details.trim());
}

function setAnalyzerLoading(kind, isLoading) {
  const mode = kind === "apk" ? "apk" : kind === "email" ? "email" : "url";
  const graph = mode === "apk" ? apkLoadingGraph : mode === "email" ? emailLoadingGraph : urlLoadingGraph;
  const pane = mode === "apk" ? apkPane : mode === "email" ? mailPane : urlPane;
  if (graph) graph.classList.toggle("hidden", !isLoading);
  if (pane) pane.setAttribute("aria-busy", isLoading ? "true" : "false");
}

function isValidApkInputValue(apkValue) {
  const value = normalizeApkInputValue(apkValue);
  if (!value) return false;
  const isSha256 = /^[a-f0-9]{64}$/i.test(value);
  const isPackage = /^[a-z][a-z0-9_]*(\.[a-z0-9_]+){1,}$/i.test(value);
  const isApkFileName = /^[a-z0-9._ -]+\.apk$/i.test(value) && !/[\\/]/.test(value);
  const isApkPath = /(?:^|[\\/])[^\\/]+\.apk$/i.test(value);
  return isSha256 || isPackage || isApkFileName || isApkPath;
}

function extractPackageFromApkUrl(value) {
  const raw = String(value || "").trim();
  if (!/^https?:\/\//i.test(raw)) return "";
  const packagePattern = /^[a-z][a-z0-9_]*(\.[a-z0-9_]+){1,}$/i;

  try {
    const parsed = new URL(raw);
    const queryKeys = ["id", "package", "pkg", "appId", "bundleId"];
    for (const key of queryKeys) {
      const queryValue = String(parsed.searchParams.get(key) || "").trim();
      if (packagePattern.test(queryValue)) return queryValue;
    }

    const segments = parsed.pathname
      .split("/")
      .map((part) => {
        try {
          return decodeURIComponent(part).trim();
        } catch {
          return String(part || "").trim();
        }
      })
      .filter(Boolean)
      .reverse();

    for (const segment of segments) {
      if (packagePattern.test(segment)) return segment;
    }
  } catch {
    return "";
  }

  return "";
}

function normalizeApkInputValue(apkValue) {
  const value = String(apkValue || "").trim();
  if (!value) return "";

  if (
    /^[a-f0-9]{64}$/i.test(value) ||
    /^[a-z][a-z0-9_]*(\.[a-z0-9_]+){1,}$/i.test(value) ||
    (/^[a-z0-9._ -]+\.apk$/i.test(value) && !/[\\/]/.test(value)) ||
    /(?:^|[\\/])[^\\/]+\.apk$/i.test(value)
  ) {
    return value;
  }

  return extractPackageFromApkUrl(value) || value;
}

function isApkFilename(name) {
  return /\.apk$/i.test(String(name || "").trim());
}

function showErrorPopup(message) {
  const popup = ensureErrorPopup();
  popup.textContent = message || "Something went wrong.";
  popup.classList.add("show");
  clearTimeout(errorPopupTimer);
  errorPopupTimer = setTimeout(() => popup.classList.remove("show"), 3200);
}

function updateThinkBeforeTitle() {
  if (!thinkBeforeTitle) return;
  const urlValue = String(urlInput?.value || "").trim();
  thinkBeforeTitle.textContent = urlValue
    ? `Think Before You Click: ${urlValue}`
    : "Think Before You Click";
}

function setThinkBeforeConnectionStatus(state, label) {
  if (!thinkBeforeConnection) return;
  const text = label || "Extension: not checked";
  thinkBeforeConnection.textContent = text;
  thinkBeforeConnection.classList.remove("ok", "err", "wait");
  if (state) {
    thinkBeforeConnection.classList.add(state);
  }
}

function createThinkBeforeRequestId() {
  return `tbyc_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

function requestThinkBeforeEnable(enabled = true, apiUrl = "") {
  if (typeof window === "undefined" || typeof window.postMessage !== "function") {
    setThinkBeforeConnectionStatus("err", "Extension: unavailable");
    return "";
  }
  const requestId = createThinkBeforeRequestId();
  thinkBeforeEnableRequestId = requestId;
  setThinkBeforeConnectionStatus("wait", enabled ? "Extension: enabling..." : "Extension: disabling...");
  const analyzerApiUrl = apiUrl || "";
  window.postMessage(
    {
      source: TBYC_MESSAGE_SOURCE,
      type: TBYC_MESSAGE_TYPE_ENABLE,
      enabled: Boolean(enabled),
      apiUrl: analyzerApiUrl,
      requestId
    },
    "*"
  );
  return requestId;
}

function disableThinkBeforeExtension() {
  const rawApiUrl = buildApiUrl("/api/analyze-url");
  let apiUrl = rawApiUrl;
  try {
    apiUrl = new URL(rawApiUrl, window.location.origin).toString();
  } catch {
    apiUrl = rawApiUrl;
  }
  const disableRequestId = requestThinkBeforeEnable(false, apiUrl);
  clearTimeout(thinkBeforeEnableTimer);
  thinkBeforeEnableTimer = setTimeout(() => {
    if (disableRequestId && disableRequestId !== thinkBeforeEnableRequestId) return;
    setThinkBeforeConnectionStatus("err", "Extension: not detected");
  }, 1200);
  if (thinkBeforeStatus) {
    thinkBeforeStatus.textContent = "Extension Disabled";
    thinkBeforeStatus.className = "think-before-status";
  }
  if (thinkBeforeExplain) {
    thinkBeforeExplain.textContent = "Hover popups are turned off.";
  }
}

function handleThinkBeforeEnableAck(payload) {
  if (!payload) return;
  if (payload.requestId && payload.requestId !== thinkBeforeEnableRequestId) return;
  clearTimeout(thinkBeforeEnableTimer);
  if (payload.ok === false) {
    setThinkBeforeConnectionStatus("err", "Extension: not detected");
    return;
  }
  const enabled = payload.enabled !== false;
  setThinkBeforeConnectionStatus("ok", enabled ? "Extension: enabled" : "Extension: disabled");
}

function setThinkBeforeLoadingState() {
  if (!thinkBeforeResult) return;
  thinkBeforeResult.classList.remove("hidden");
  if (thinkBeforeStatus) {
    thinkBeforeStatus.textContent = "Analyzing...";
    thinkBeforeStatus.className = "think-before-status";
  }
    if (thinkBeforeScore) thinkBeforeScore.textContent = "...";
    if (thinkBeforeExplain) {
      thinkBeforeExplain.textContent = "Checking API + extension for an accurate result...";
    }
    setThinkBeforeConnectionStatus("wait", "Extension: checking...");
  }

function requestThinkBeforeExtension(urlValue) {
  if (typeof window === "undefined" || typeof window.postMessage !== "function") {
    setThinkBeforeConnectionStatus("err", "Extension: unavailable");
    return "";
  }
  const requestId = createThinkBeforeRequestId();
  thinkBeforePendingRequestId = requestId;
  window.postMessage(
    {
      source: TBYC_MESSAGE_SOURCE,
      type: TBYC_MESSAGE_TYPE_ANALYZE,
      url: urlValue,
      requestId
    },
    "*"
  );
  return requestId;
}

  function handleThinkBeforeExtensionResult(payload) {
    if (!payload) return;
    if (payload.requestId && payload.requestId !== thinkBeforePendingRequestId) return;
    clearTimeout(thinkBeforeFallbackTimer);

    if (payload.ok === false) {
      setThinkBeforeConnectionStatus("err", "Extension: not connected");
      showErrorPopup(payload.error || "Think Before You Click extension not responding.");
      const urlValue = String(urlInput?.value || "").trim();
      if (thinkBeforeApiFailed && urlValue) {
        const localResult = computeThinkBeforeRisk(urlValue);
        renderThinkBeforeResult(localResult);
        if (thinkBeforeExplain) {
          thinkBeforeExplain.textContent = `${localResult.explanation} | Extension and API unavailable, showing local quick check.`;
        }
      } else if (!thinkBeforeApiReady && thinkBeforeExplain) {
        thinkBeforeExplain.textContent = "Extension not connected. Waiting for API result...";
      }
      return;
    }

    if (payload.result) {
      thinkBeforeExtensionReady = true;
      setThinkBeforeConnectionStatus("ok", "Extension: connected");
      if (!thinkBeforeApiReady) {
        renderThinkBeforeResult(payload.result);
      }
      return;
    }

    if (typeof payload.risk !== "undefined") {
      thinkBeforeExtensionReady = true;
      setThinkBeforeConnectionStatus("ok", "Extension: connected");
      if (!thinkBeforeApiReady) {
        renderThinkBeforeResult(payload);
      }
    }
  }

  function normalizeThinkBeforeApiPayload(payload) {
    const data = payload || {};
    const result = data.result || data;
    const clamp = (value) => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
    const riskScore = Number(result?.riskScore ?? result?.risk ?? 0);
    const confidence = Number(result?.confidence ?? 0);
    const accuracy = Number(result?.accuracy ?? 0);
    const riskLevel = String(result?.riskLevel || "").toLowerCase();
    let explanation = "";
    if (result?.summary) explanation = result.summary;
    if (!explanation && result?.explanation) explanation = result.explanation;
    if (!explanation && Array.isArray(result?.evidence) && result.evidence.length) {
      explanation = result.evidence.slice(0, 3).join(" | ");
    }
    if (!explanation && result?.message) explanation = result.message;
    return {
      risk: clamp(riskScore),
      confidence: clamp(confidence),
      accuracy: clamp(accuracy),
      riskLevel,
      explanation: explanation || "URL analysis completed."
    };
  }

  async function fetchThinkBeforeApiResult(urlValue, requestId) {
    const apiUrl = buildApiUrl("/api/analyze-url");
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: urlValue })
    });
    if (!response.ok) {
      throw new Error("Analyzer API not reachable");
    }
    const data = await response.json();
    if (requestId && requestId !== thinkBeforeApiRequestId) {
      throw new Error("Stale API response");
    }
    return normalizeThinkBeforeApiPayload(data);
  }

function computeThinkBeforeRisk(urlValue) {
  const raw = String(urlValue || "").trim();
  if (!raw) {
    return { risk: 0, explanation: "Enter a URL to analyze." };
  }

  const suspiciousWords = ["login", "verify", "secure", "update", "password", "wallet", "banking", "confirm", "account", "signin", "auth"];
  const lureWords = ["free", "bonus", "gift", "claim", "airdrop", "generator", "coin", "coins", "reward", "prize", "cheat", "mod"];
  const suspiciousTlds = ["zip", "mov", "click", "cam", "work", "country", "gq", "tk", "ml", "top", "xyz", "site", "icu", "sbs", "rest", "bar", "cfd"];
  const shorteners = ["bit.ly", "tinyurl.com", "t.co", "cutt.ly", "shorturl.at", "rb.gy", "is.gd", "ow.ly", "buff.ly", "rebrand.ly", "tiny.cc", "goo.gl"];
  const brandRoots = {
    paypal: ["paypal.com"],
    microsoft: ["microsoft.com", "office.com", "live.com", "outlook.com"],
    apple: ["apple.com", "icloud.com", "me.com"],
    google: ["google.com", "gmail.com", "g.co", "googleusercontent.com"],
    amazon: ["amazon.com", "amazon.in", "amazon.co.uk"],
    whatsapp: ["whatsapp.com"],
    instagram: ["instagram.com"],
    facebook: ["facebook.com", "fb.com"],
    netflix: ["netflix.com"],
    bankofamerica: ["bankofamerica.com"],
    chase: ["chase.com"]
  };

  const clamp = (value) => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  const isShortener = (host) => shorteners.some((root) => host === root || host.endsWith(`.${root}`));
  const parseUrl = () => {
    try {
      return new URL(raw);
    } catch {
      try {
        return new URL(`https://${raw}`);
      } catch {
        return null;
      }
    }
  };

  const parsed = parseUrl();
  if (!parsed || !parsed.hostname) {
    return { risk: 95, explanation: "URL format is invalid or malformed." };
  }

  const host = parsed.hostname.toLowerCase();
  const pathText = `${parsed.pathname}?${parsed.search}`.toLowerCase();
  const isHttps = parsed.protocol === "https:";
  const hostParts = host.split(".").filter(Boolean);
  const subdomainCount = Math.max(0, hostParts.length - 2);
  const hasIpHost = /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
  const hasAtSymbol = raw.includes("@");
  const hasPunycode = host.includes("xn--");
  const hasEncodedChars = /%[0-9a-f]{2}/i.test(raw);
  const hasManyHyphens = (host.match(/-/g) || []).length >= 2;
  const hasLongUrl = raw.length > 120;
  const hasRedirectParam = /(redirect|return|continue|next|url|target|dest)=/i.test(parsed.search);
  const hasDownloadExt = /\.(apk|exe|scr|js|zip|rar|7z|iso|dmg)(\?|$)/i.test(parsed.pathname);
  const shortenerHost = isShortener(host);
  const suspiciousTld = hostParts.length ? suspiciousTlds.includes(hostParts[hostParts.length - 1]) : false;
  const hasNonstandardPort = parsed.port && !["80", "443"].includes(parsed.port);
  const hasUnderscore = host.includes("_");
  const digitRatio = host.length ? (host.replace(/[^0-9]/g, "").length / host.length) : 0;
  const hasDigitHeavyHost = host.length >= 6 && digitRatio >= 0.3;
  const hasEmbeddedUrl = pathText.includes("http://") || pathText.includes("https://");

  const pathSuspicious = suspiciousWords.filter((word) => pathText.includes(word));
  const hostSuspicious = suspiciousWords.filter((word) => host.includes(word));
  const hostLure = lureWords.filter((word) => host.includes(word));
  const impersonationHits = Object.entries(brandRoots)
    .filter(([brand, roots]) => host.includes(brand) && !roots.some((root) => host === root || host.endsWith(`.${root}`)))
    .map(([brand]) => brand);

  let risk = 0;
  const reasons = [];

  if (!isHttps) {
    risk += 20;
    reasons.push("No HTTPS.");
  }
  if (pathSuspicious.length) {
    risk += Math.min(30, 8 + (pathSuspicious.length * 6));
    reasons.push(`Suspicious keywords in path/query (${pathSuspicious.slice(0, 3).join(", ")})`);
  }
  if (hostSuspicious.length) {
    risk += Math.min(28, 8 + (hostSuspicious.length * 8));
    reasons.push(`Suspicious keywords in hostname (${hostSuspicious.slice(0, 3).join(", ")})`);
  }
  if (hostLure.length) {
    risk += Math.min(24, 6 + (hostLure.length * 8));
    reasons.push(`Lure keywords in hostname (${hostLure.slice(0, 3).join(", ")})`);
  }
  if (suspiciousTld) {
    risk += 20;
    reasons.push("Suspicious or high-risk domain extension.");
  }
  if (hasIpHost) {
    risk += 25;
    reasons.push("Uses IP address instead of domain.");
  }
  if (hasAtSymbol) {
    risk += 25;
    reasons.push("Contains @ symbol.");
  }
  if (shortenerHost) {
    risk += 18;
    reasons.push("Uses URL shortener.");
  }
  if (hasPunycode) {
    risk += 18;
    reasons.push("Punycode hostname detected.");
  }
  if (hasManyHyphens) {
    risk += 10;
    reasons.push("Multiple hyphens in hostname.");
  }
  if (subdomainCount >= 3) {
    risk += 10;
    reasons.push("Excessive subdomain depth.");
  }
  if (hasEncodedChars) {
    risk += 10;
    reasons.push("Encoded characters in URL.");
  }
  if (hasRedirectParam) {
    risk += 10;
    reasons.push("Redirect parameter present.");
  }
  if (hasDownloadExt) {
    risk += 12;
    reasons.push("Direct download file extension in URL.");
  }
  if (hasLongUrl) {
    risk += 8;
    reasons.push("Unusually long URL.");
  }
  if (impersonationHits.length) {
    risk += 18;
    reasons.push(`Brand impersonation keywords (${impersonationHits.join(", ")})`);
  }
  if (hasNonstandardPort) {
    risk += 8;
    reasons.push("Non-standard port in URL.");
  }
  if (hasUnderscore) {
    risk += 8;
    reasons.push("Underscore in hostname.");
  }
  if (hasDigitHeavyHost) {
    risk += 8;
    reasons.push("Digit-heavy hostname.");
  }
  if (hasEmbeddedUrl) {
    risk += 10;
    reasons.push("Embedded URL in path or query.");
  }

  if (reasons.length === 0) {
    reasons.push("No high-risk signals detected.");
  }

  return {
    risk: clamp(risk),
    explanation: reasons.join(" | ")
  };
}

  function renderThinkBeforeResult(result) {
    if (!thinkBeforeResult) return;
    const riskValue = Math.max(0, Math.min(100, Number(result?.risk || 0)));
    const risky = riskValue > 60;
    const confidence = Math.max(0, Math.min(100, Number(result?.confidence || 0)));
    const accuracy = Math.max(0, Math.min(100, Number(result?.accuracy || 0)));
    thinkBeforeResult.classList.remove("hidden");
    if (thinkBeforeStatus) {
      thinkBeforeStatus.textContent = risky ? "Risky Website" : "Safe Website";
      thinkBeforeStatus.className = `think-before-status ${risky ? "risky" : "safe"}`;
    }
    if (thinkBeforeScore) thinkBeforeScore.textContent = String(riskValue);
    if (thinkBeforeExplain) {
      const explanation = String(result?.explanation || "").trim();
      const details = [];
      if (accuracy) details.push(`Accuracy: ${accuracy}%`);
      if (confidence) details.push(`Confidence: ${confidence}%`);
      if (explanation) details.push(explanation);
      thinkBeforeExplain.textContent = details.join(" | ") || "Analysis complete.";
    }
    if (!thinkBeforeLogged) {
      const urlValue = String(thinkBeforeLogUrl || urlInput?.value || "").trim();
      if (urlValue) {
        const logParts = [`${urlValue}`, "status:cursor", `risk:${riskValue}%`];
        const safeScore = Math.max(0, Math.min(100, 100 - riskValue));
        logAnalyzerActivity(
          "url",
          logParts.join(" | "),
          "cursor",
          { riskScore: riskValue, safeScore, confidence }
        );
      }
      thinkBeforeLogged = true;
    }
  }

  function runThinkBeforeCheck() {
    if (!thinkBeforePanel || !thinkBeforeBtn) return;
    const urlValue = String(urlInput?.value || "").trim();
    updateThinkBeforeTitle();
    thinkBeforeLogged = false;
    thinkBeforeLogUrl = urlValue;
  if (thinkBeforePanel.classList.contains("hidden")) {
    thinkBeforePanel.classList.remove("hidden");
  }
  thinkBeforeBtn.setAttribute("aria-expanded", "true");
  const rawApiUrl = buildApiUrl("/api/analyze-url");
  let apiUrl = rawApiUrl;
  try {
    apiUrl = new URL(rawApiUrl, window.location.origin).toString();
  } catch {
    apiUrl = rawApiUrl;
  }
  const enableRequestId = requestThinkBeforeEnable(true, apiUrl);
  clearTimeout(thinkBeforeEnableTimer);
  thinkBeforeEnableTimer = setTimeout(() => {
    if (enableRequestId && enableRequestId !== thinkBeforeEnableRequestId) return;
    setThinkBeforeConnectionStatus("err", "Extension: not detected");
  }, 1200);

    if (!urlValue) {
      if (thinkBeforeResult) {
        thinkBeforeResult.classList.remove("hidden");
      }
    if (thinkBeforeStatus) {
      thinkBeforeStatus.textContent = "Extension Enabled";
      thinkBeforeStatus.className = "think-before-status safe";
    }
    if (thinkBeforeScore) thinkBeforeScore.textContent = "N/A";
    if (thinkBeforeExplain) {
      thinkBeforeExplain.textContent = "Open any site and hover over links to see the risk popup.";
    }
      thinkBeforePanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }
    setThinkBeforeLoadingState();
    thinkBeforeApiReady = false;
    thinkBeforeApiFailed = false;
    thinkBeforeExtensionReady = false;
    const apiRequestId = createThinkBeforeRequestId();
    thinkBeforeApiRequestId = apiRequestId;
    fetchThinkBeforeApiResult(urlValue, apiRequestId)
      .then((apiResult) => {
        if (apiRequestId !== thinkBeforeApiRequestId) return;
        thinkBeforeApiReady = true;
        thinkBeforeApiFailed = false;
        renderThinkBeforeResult(apiResult);
      })
      .catch(() => {
        if (apiRequestId !== thinkBeforeApiRequestId) return;
        thinkBeforeApiFailed = true;
        if (!thinkBeforeExtensionReady) {
          const localResult = computeThinkBeforeRisk(urlValue);
          renderThinkBeforeResult(localResult);
          if (thinkBeforeExplain) {
            thinkBeforeExplain.textContent = `${localResult.explanation} | API unavailable, showing local quick check.`;
          }
        }
      });
    const requestId = requestThinkBeforeExtension(urlValue);
    clearTimeout(thinkBeforeFallbackTimer);
    thinkBeforeFallbackTimer = setTimeout(() => {
      if (requestId && requestId !== thinkBeforePendingRequestId) return;
      setThinkBeforeConnectionStatus("err", "Extension: no response");
      if (thinkBeforeApiReady) return;
      if (thinkBeforeApiFailed) {
        const localResult = computeThinkBeforeRisk(urlValue);
        renderThinkBeforeResult(localResult);
        if (thinkBeforeExplain) {
          thinkBeforeExplain.textContent = `${localResult.explanation} | Extension not detected, showing local quick check.`;
        }
      } else if (thinkBeforeExplain) {
        thinkBeforeExplain.textContent = "Extension not detected. Waiting for API result...";
      }
    }, 1800);
    thinkBeforePanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

function showView(view) {
  landingView.classList.toggle("hidden", view !== "landing");
  authView.classList.toggle("hidden", view !== "auth");
  dashView.classList.toggle("hidden", view !== "dashboard");

  const activeView = {
    landing: landingView,
    auth: authView,
    dashboard: dashView
  }[view];

  if (activeView) {
    activeView.classList.remove("view-enter");
    void activeView.offsetWidth;
    activeView.classList.add("view-enter");
  }

  currentView = view;
}

function navigateToView(view) {
  if (currentView !== view) {
    viewHistory.push(currentView);
  }
  showView(view);
}

function goToPreviousView() {
  if (viewHistory.length === 0) {
    return;
  }
  const previous = viewHistory.pop();
  showView(previous);
  if (previous === "auth") {
    setAuthMode("login");
  }
}

function setDashboardMenu(key) {
  if (menuDashboard) menuDashboard.classList.toggle("active", key === "dashboard");
  if (menuAbout) menuAbout.classList.toggle("active", key === "about");
  if (menuServices) menuServices.classList.toggle("active", key === "services");
  if (menuContact) menuContact.classList.toggle("active", key === "contact");
  if (menuScores) menuScores.classList.toggle("active", key === "scores");
  if (menuLeaderboard) menuLeaderboard.classList.toggle("active", key === "leaderboard");
  if (menuSettings) menuSettings.classList.toggle("active", key === "settings");
  if (menuSupport) menuSupport.classList.toggle("active", key === "support");
}

function showInfoPage(key) {
  const data = infoContent[key];
  if (!data) return;

  infoTitle.textContent = data.title;
  infoDesc.textContent = data.desc;
  if (key === "support") {
    infoBody.innerHTML = `
      <div class="support-chat">
        <div id="supportChatLog" class="support-chat-log"></div>
        <form id="supportChatForm" class="support-chat-form">
          <textarea id="supportChatInput" rows="3" maxlength="1600" placeholder="Ask anything about cybersecurity..."></textarea>
          <button id="supportChatSend" class="an-btn" type="submit">Ask AI</button>
        </form>
      </div>
    `;
    initializeSupportChat();
  } else {
    infoBody.innerHTML = data.body.map((text) => `<p>${text}</p>`).join("");
  }

  learnSection.classList.remove("active");
  anSection.classList.remove("active");
  if (anAskSection) anAskSection.classList.remove("active");
  resetAnalyzerSearchState();
  adminSection.classList.remove("active");
  scoreSection.classList.remove("active");
  leaderSection.classList.remove("active");
  settingsSection.classList.remove("active");
  infoSection.classList.add("active");
  setDashboardMenu(key);
}

function appendSupportChat(role, text) {
  const log = document.getElementById("supportChatLog");
  if (!log) return;
  const item = document.createElement("div");
  item.className = `support-chat-item ${role === "user" ? "user" : "assistant"}`;
  item.innerHTML = `
    <div class="support-chat-role">${role === "user" ? "You" : "Cyber-Shield AI"}</div>
    <div class="support-chat-text">${escapeHtml(text || "")}</div>
  `;
  log.appendChild(item);
  log.scrollTop = log.scrollHeight;
}

function setSupportChatBusy(isBusy) {
  supportChatBusy = Boolean(isBusy);
  const input = document.getElementById("supportChatInput");
  const send = document.getElementById("supportChatSend");
  if (input) input.disabled = supportChatBusy;
  if (send) send.disabled = supportChatBusy;
}

function initializeSupportChat() {
  const form = document.getElementById("supportChatForm");
  const input = document.getElementById("supportChatInput");
  const log = document.getElementById("supportChatLog");
  if (!form || !input || !log) return;
  if (!log.children.length) {
    appendSupportChat("assistant", "Hi, I am Cyber-Shield AI. Ask me about suspicious links, emails, APKs, or account security.");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (supportChatBusy) return;
    const message = String(input.value || "").trim();
    if (!message) return;

    appendSupportChat("user", message);
    input.value = "";
    setSupportChatBusy(true);

    try {
      const res = await fetch(buildApiUrl("/api/llm-assistant"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });
      const data = await res.json();
      if (!res.ok) {
        appendSupportChat("assistant", data?.detail || data?.error || data?.message || "AI support is currently unavailable.");
      } else {
        appendSupportChat("assistant", data?.reply || data?.answer || "No response received.");
      }
    } catch {
      appendSupportChat("assistant", "Server not reachable. Start backend first.");
    } finally {
      setSupportChatBusy(false);
      input.focus();
    }
  });
}

function appendChatbotMessage(role, text) {
  if (!chatbotLog) return;
  const item = document.createElement("div");
  item.className = `chatbot-item ${role === "user" ? "user" : "assistant"}`;
  const stamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  item.innerHTML = `
    <div class="chatbot-role">${role === "user" ? "You" : "Cyber-Shield AI"}</div>
    <div class="chatbot-bubble">${escapeHtml(text || "")}</div>
    <div class="chatbot-meta">${stamp}</div>
  `;
  chatbotLog.appendChild(item);
  chatbotLog.scrollTop = chatbotLog.scrollHeight;
}

function normalizeAnalyzerKind(kind) {
  const raw = String(kind || "").trim().toLowerCase();
  if (raw === "apk") return "apk";
  if (raw === "mail" || raw === "email") return "email";
  if (raw === "current" || !raw) return currentAnalyzerTab || "url";
  return "url";
}

function getAnalyzerInputContext(kind) {
  if (kind === "apk") {
    return {
      currentInput: String(apkName?.value || "").trim() || "-",
      source: String(apkSource?.value || "Unknown")
    };
  }
  if (kind === "email") {
    return {
      currentInput: String(mailHead?.value || "").trim().slice(0, 600) || "-"
    };
  }
  return {
    currentInput: String(urlInput?.value || "").trim() || "-"
  };
}

function getChatbotAnalyzerContext(kind) {
  const analyzerType = normalizeAnalyzerKind(kind);
  return {
    analyzerType,
    input: getAnalyzerInputContext(analyzerType),
    analysis: latestAnalyzerResultByTab[analyzerType] || null
  };
}

function applyChatbotAnalyzerPreset(kind, announce = false) {
  const analyzerType = normalizeAnalyzerKind(kind);
  activeChatbotAnalyzer = analyzerType;
  const label = analyzerType === "apk" ? "APK" : analyzerType === "email" ? "Email" : "URL";
  if (chatbotTitle) chatbotTitle.textContent = `Cyber-Shield ${label} Copilot`;
  if (chatbotHint) chatbotHint.textContent = `${label} analyzer-focused guidance in real time.`;
  if (openAnalyzerChatBtn && openAnalyzerChatBtn.getAttribute("data-analyzer") === "current") {
    const actionLabel = chatbotModal && chatbotModal.classList.contains("open") ? "Hide" : "Open";
    openAnalyzerChatBtn.textContent = `${actionLabel} ${label} AI Chatbot`;
  }

  if (chatbotQuickActions) {
    const actions = analyzerType === "apk"
      ? [
          { label: "APK Red Flags", prompt: "List key red flags in this APK and what I should verify first." },
          { label: "Install Decision", prompt: "Based on this APK analysis, should I install it? Give a short reason." },
          { label: "Safe Checks", prompt: "Give me a quick APK safety checklist before installing." }
        ]
      : analyzerType === "email"
        ? [
            { label: "Phishing Signs", prompt: "Identify the strongest phishing indicators in this email." },
            { label: "Respond Steps", prompt: "What should I do immediately if I interacted with this email?" },
            { label: "Verification", prompt: "How can I verify this email safely before taking any action?" }
          ]
        : [
            { label: "URL Check", prompt: "Is this URL suspicious? Explain in 3 points." },
            { label: "Open or Block", prompt: "Should I open this URL or block it? Give a short decision." },
            { label: "Domain Verify", prompt: "How do I verify this domain quickly before visiting?" }
          ];

    chatbotQuickActions.innerHTML = actions.map((item) => `
      <button type="button" class="chatbot-chip" data-prompt="${escapeHtml(item.prompt)}">${escapeHtml(item.label)}</button>
    `).join("");
  }

  if (announce && chatbotInitialized) {
    appendChatbotMessage("assistant", `${label} analyzer chat mode enabled.`);
  }
}

function isChatbotOpen() {
  return Boolean(chatbotModal && chatbotModal.classList.contains("open"));
}

function updateChatbotCounter() {
  if (!chatbotInput || !chatbotCounter) return;
  chatbotCounter.textContent = `${chatbotInput.value.length}/1600`;
}

function removeChatbotTyping() {
  if (!chatbotTypingEl) return;
  chatbotTypingEl.remove();
  chatbotTypingEl = null;
}

function appendChatbotTyping() {
  if (!chatbotLog || chatbotTypingEl) return;
  const item = document.createElement("div");
  item.className = "chatbot-item assistant";
  item.innerHTML = `
    <div class="chatbot-role">Cyber-Shield AI</div>
    <div class="chatbot-bubble">
      <span class="chatbot-typing" aria-label="AI is typing">
        <span class="chatbot-typing-dot"></span>
        <span class="chatbot-typing-dot"></span>
        <span class="chatbot-typing-dot"></span>
      </span>
    </div>
    <div class="chatbot-meta">thinking...</div>
  `;
  chatbotTypingEl = item;
  chatbotLog.appendChild(item);
  chatbotLog.scrollTop = chatbotLog.scrollHeight;
}

function setChatbotBusy(isBusy) {
  chatbotBusy = Boolean(isBusy);
  if (chatbotInput) chatbotInput.disabled = chatbotBusy;
  if (chatbotSend) chatbotSend.disabled = chatbotBusy;
  if (chatbotStatusBadge) {
    chatbotStatusBadge.textContent = chatbotBusy ? "Analyzing..." : "Online";
    chatbotStatusBadge.classList.toggle("busy", chatbotBusy);
  }
  if (chatbotBusy) {
    appendChatbotTyping();
  } else {
    removeChatbotTyping();
  }
}

function openChatbotModal(analyzerKind) {
  if (!chatbotModal) return;
  applyChatbotAnalyzerPreset(analyzerKind || currentAnalyzerTab || "url", Boolean(chatbotInitialized));
  chatbotModal.classList.remove("hidden");
  chatbotModal.classList.add("open");
  chatbotModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("chatbot-open");
  if (!chatbotInitialized) {
    const label = activeChatbotAnalyzer === "apk" ? "APK" : activeChatbotAnalyzer === "email" ? "Email" : "URL";
    appendChatbotMessage("assistant", `${label} copilot is live. Ask your question.`);
    chatbotInitialized = true;
  }
  updateChatbotCounter();
  applyChatbotAnalyzerPreset(activeChatbotAnalyzer, false);
  if (chatbotInput) chatbotInput.focus();
}

function closeChatbotModal() {
  if (!chatbotModal) return;
  chatbotModal.classList.remove("open");
  chatbotModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("chatbot-open");
  applyChatbotAnalyzerPreset(activeChatbotAnalyzer, false);
}

function openAnalyzerHistoryModal(row) {
  if (!historyModal) return;
  const safeRow = row || {};
  const typeLabel = formatAnalyzerTypeLabel(safeRow.type);
  const time = new Date(safeRow.timestamp || Date.now());
  const safeTime = Number.isNaN(time.getTime()) ? "-" : time.toLocaleString();
  const sourceLabel = formatAnalyzerOriginLabel(safeRow.origin);
  const userLabel = String(safeRow.username || safeRow.userName || safeRow.userEmail || "Unknown").trim();
  const emailLabel = String(safeRow.userEmail || "").trim();
  const idLabel = String(safeRow.id || "").trim();
  const detailsLabel = String(safeRow.details || "").trim();
  const detailsValue = String(safeRow.details || "");
  const riskValue = clampPercent(
    safeRow.riskScore ?? safeRow.risk_score ?? safeRow.risk
  ) ?? extractPercentFromText(detailsValue, "risk");
  const safeValue = clampPercent(
    safeRow.safeScore ?? safeRow.safe_score
  ) ?? extractPercentFromText(detailsValue, "safe");
  const riskText = riskValue === null ? "-" : `${riskValue}%`;
  const safeText = safeValue === null
    ? (riskValue === null ? "-" : `${Math.max(0, Math.min(100, 100 - riskValue))}%`)
    : `${safeValue}%`;

  if (historyModalType) historyModalType.textContent = typeLabel || "-";
  if (historyModalTime) historyModalTime.textContent = safeTime;
  if (historyModalSource) historyModalSource.textContent = sourceLabel || "-";
  if (historyModalRisk) historyModalRisk.textContent = riskText;
  if (historyModalSafe) historyModalSafe.textContent = safeText;
  if (historyModalUser) historyModalUser.textContent = userLabel || "Unknown";
  if (historyModalEmail) historyModalEmail.textContent = emailLabel || "-";
  if (historyModalId) historyModalId.textContent = idLabel || "-";
  if (historyModalDetails) historyModalDetails.textContent = detailsLabel || "No details available.";

  historyModal.classList.remove("hidden");
  if (historyModalClose) historyModalClose.focus();
}

function closeAnalyzerHistoryModal() {
  if (!historyModal) return;
  historyModal.classList.add("hidden");
}

async function handleChatbotSubmit(e) {
  e.preventDefault();
  if (!chatbotInput || chatbotBusy) return;
  const question = String(chatbotInput.value || "").trim();
  if (!question) return;

  appendChatbotMessage("user", question);
  chatbotInput.value = "";
  updateChatbotCounter();
  setChatbotBusy(true);

  try {
    const res = await fetch(buildApiUrl("/api/llm-assistant"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: question,
        context: getChatbotAnalyzerContext(activeChatbotAnalyzer)
      })
    });
    const data = await res.json();
    if (!res.ok) {
      appendChatbotMessage("assistant", data?.detail || data?.message || data?.error || "AI support is currently unavailable.");
    } else {
      appendChatbotMessage("assistant", data?.reply || data?.answer || "No response received.");
    }
  } catch {
    appendChatbotMessage("assistant", "Server not reachable. Start backend first.");
  } finally {
    setChatbotBusy(false);
    if (chatbotInput) chatbotInput.focus();
  }
}

function renderScoreBoard() {
  if (!myRuns || !myAvgScore || !myBestScore || !myGamesPlayed || !myRecentBody) return;
  const user = getSessionUser();
  const email = String(user?.email || "").trim().toLowerCase();

  if (!email) {
    myRuns.textContent = "0";
    myAvgScore.textContent = "0";
    myBestScore.textContent = "0";
    myGamesPlayed.textContent = "0";
    myRecentBody.innerHTML = '<tr><td colspan="4">Login required.</td></tr>';
    return;
  }

  fetch(buildApiUrl(`/api/game-score/my?email=${encodeURIComponent(email)}`))
    .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
    .then(({ ok, data }) => {
      if (!ok) {
        myRecentBody.innerHTML = `<tr><td colspan="4">${escapeHtml(data?.message || "Unable to load scores.")}</td></tr>`;
        return;
      }
      const summary = data?.summary || {};
      myRuns.textContent = String(summary.runs || 0);
      myAvgScore.textContent = String(summary.avgScore || 0);
      myBestScore.textContent = String(summary.bestScore || 0);
      myGamesPlayed.textContent = String(summary.gamesPlayed || 0);

      const rows = Array.isArray(data?.recent) ? data.recent : [];
      if (rows.length === 0) {
        myRecentBody.innerHTML = '<tr><td colspan="4">No score records yet.</td></tr>';
        return;
      }
      myRecentBody.innerHTML = rows.map((row) => `
        <tr>
          <td>${escapeHtml(String(row.gameKey || "-"))}</td>
          <td>${Number(row.score || 0)}</td>
          <td>${Number(row.accuracy || 0)}%</td>
          <td>${escapeHtml(new Date(row.createdAt).toLocaleString())}</td>
        </tr>
      `).join("");
    })
    .catch(() => {
      myRecentBody.innerHTML = '<tr><td colspan="4">Server unavailable.</td></tr>';
    });
}

function showScoreBoard() {
  if (isAdminSession()) {
    showErrorPopup("Admin should use Leaderboard for all users.");
    return;
  }
  if (learnTab) learnTab.classList.remove("active");
  if (scoreTab) scoreTab.classList.add("active");
  if (leaderboardTab) leaderboardTab.classList.remove("active");
  if (anTab) anTab.classList.remove("active");
  if (adminTab) adminTab.classList.remove("active");
  learnSection.classList.remove("active");
  leaderboardSection.classList.remove("active");
  anSection.classList.remove("active");
  if (anAskSection) anAskSection.classList.remove("active");
  resetAnalyzerSearchState();
  adminSection.classList.remove("active");
  infoSection.classList.remove("active");
  leaderSection.classList.remove("active");
  settingsSection.classList.remove("active");
  scoreSection.classList.add("active");
  setDashboardMenu("scores");
  renderScoreBoard();
}

function loadLeaderboardData() {
  const leaderboardStorageKey = getLeaderboardStorageKey();
  const raw = localStorage.getItem(leaderboardStorageKey);
  if (!raw) {
    localStorage.setItem(leaderboardStorageKey, JSON.stringify(defaultLeaderboardData));
    return [...defaultLeaderboardData];
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    // fallback below
  }
  localStorage.setItem(leaderboardStorageKey, JSON.stringify(defaultLeaderboardData));
  return [...defaultLeaderboardData];
}

function saveLeaderboardData(rows) {
  const leaderboardStorageKey = getLeaderboardStorageKey();
  localStorage.setItem(leaderboardStorageKey, JSON.stringify(rows));
}

function withMetrics(player) {
  const total = player.phishing + player.password + player.links + player.malware + player.email;
  const accuracy = Math.round(total / 5);
  return { ...player, total, accuracy };
}

function renderLeaderboard() {
  const ranked = loadLeaderboardData()
    .map(withMetrics)
    .sort((a, b) => b.total - a.total);

  const topThree = ranked.slice(0, 3);
  leaderPodium.innerHTML = topThree.map((p, idx) => `
    <article class="podium-card podium-${idx + 1}">
      <h4>#${idx + 1} ${p.name}</h4>
      <p>${p.accuracy}% Accuracy</p>
      <span>${p.total} pts</span>
    </article>
  `).join("");

  leaderBars.innerHTML = ranked.map((p) => `
    <div class="leader-bar-row">
      <span class="leader-name">${p.name}</span>
      <div class="leader-track"><span class="leader-fill" style="width:${p.accuracy}%"></span></div>
      <span class="leader-score">${p.accuracy}%</span>
    </div>
  `).join("");

  leaderTableBody.innerHTML = ranked.map((p, idx) => `
    <tr>
      <td>#${idx + 1}</td>
      <td>${p.name}</td>
      <td>${p.total}</td>
      <td>${p.accuracy}%</td>
    </tr>
  `).join("");
}

function showLeaderboard() {
  if (!isAdminSession()) {
    showErrorPopup("Only admin can access Leaderboard.");
    return;
  }
  learnSection.classList.remove("active");
  anSection.classList.remove("active");
  if (anAskSection) anAskSection.classList.remove("active");
  resetAnalyzerSearchState();
  adminSection.classList.remove("active");
  infoSection.classList.remove("active");
  scoreSection.classList.remove("active");
  settingsSection.classList.remove("active");
  leaderSection.classList.add("active");
  setDashboardMenu("leaderboard");
  renderLeaderboard();
}

function applyTheme(theme) {
  const nextTheme = theme === "light" ? "light" : "dark";
  document.body.setAttribute("data-theme", nextTheme);
  localStorage.setItem(themeStorageKey, nextTheme);
  themeDarkBtn.classList.toggle("active", nextTheme === "dark");
  themeLightBtn.classList.toggle("active", nextTheme === "light");
}

function showSettingsPage() {
  learnSection.classList.remove("active");
  anSection.classList.remove("active");
  if (anAskSection) anAskSection.classList.remove("active");
  resetAnalyzerSearchState();
  adminSection.classList.remove("active");
  infoSection.classList.remove("active");
  scoreSection.classList.remove("active");
  leaderSection.classList.remove("active");
  settingsSection.classList.add("active");
  setDashboardMenu("settings");
}

function initializeTheme() {
  const savedTheme = localStorage.getItem(themeStorageKey);
  applyTheme(savedTheme || "dark");
}

function buildApiUrl(pathname) {
  const path = String(pathname || "").startsWith("/") ? String(pathname || "") : `/${String(pathname || "")}`;
  const configuredBase = String(
    window.CYBER_API_BASE_URL
    || document.querySelector('meta[name="cyber-api-base"]')?.getAttribute("content")
    || ""
  ).trim().replace(/\/+$/, "");
  if (configuredBase) {
    return `${configuredBase}${path}`;
  }
  if (window.location.protocol === "file:") {
    return `http://localhost:2906${path}`;
  }
  if (window.location.port && window.location.port !== "2906" && /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname || "")) {
    return `http://localhost:2906${path}`;
  }
  return path;
}

async function analyzeURL() {
  const url = document.getElementById("urlInput")?.value || "";

  const response = await fetch(buildApiUrl("/analyze-url"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ url })
  });

  const data = await response.json();
  const resultEl = document.getElementById("result");
  if (resultEl) {
    resultEl.innerText = data?.aiResult || data?.message || "No AI result.";
  }
}

async function logAnalyzerActivity(type, details, origin = "website", meta = {}) {
  const user = getSessionUser() || {};
  try {
    await fetch(buildApiUrl("/api/analyzer-log"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        details,
        origin,
        userName: user.name || "Unknown",
        userEmail: user.email || "guest@local",
        riskScore: meta?.riskScore,
        safeScore: meta?.safeScore,
        confidence: meta?.confidence,
        riskLevel: meta?.riskLevel
      })
    });
  } catch {
    // ignore logging failure for user flow
  }
}

function renderUrlAnalysis(result) {
  const riskScore = Math.max(0, Math.min(100, Number(result?.riskScore || 0)));
  const confidence = Math.max(0, Math.min(100, Number(result?.confidence || 0)));
  const accuracy = Math.max(0, Math.min(100, Number(result?.accuracy ?? confidence ?? 0)));
  const riskLevel = String(result?.riskLevel || "low").toLowerCase();
  const safeLevel = ["low", "medium", "high"].includes(riskLevel) ? riskLevel : "low";
  const factors = Array.isArray(result?.factors) ? result.factors.slice(0, 6) : [];
  latestAnalyzerResultByTab.url = {
    riskScore,
    confidence,
    accuracy,
    riskLevel: safeLevel,
    summary: String(result?.summary || ""),
    explanation: String(result?.explanation || ""),
    evidence: Array.isArray(result?.evidence) ? result.evidence.slice(0, 6).map((item) => String(item || "")) : [],
    factors: factors.map((item) => ({
      name: String(item?.name || "Signal"),
      score: Math.max(0, Math.min(100, Number(item?.score || 0)))
    }))
  };

  riskLevelBadge.textContent = safeLevel.toUpperCase();
  riskLevelBadge.className = `risk-badge ${safeLevel}`;
  riskMeterFill.style.width = `${riskScore}%`;
  riskSummary.textContent = result?.summary || "No summary provided.";
  riskScoreValue.textContent = `${riskScore}%`;
  riskConfidenceValue.textContent = `${confidence}%`;
  if (riskAccuracyValue) riskAccuracyValue.textContent = `${accuracy}%`;

  riskFactors.innerHTML = factors.map((item) => {
    const name = escapeHtml(item.name || "Signal");
    const score = Math.max(0, Math.min(100, Number(item.score || 0)));
    return `
      <div class="risk-factor">
        <div class="risk-factor-top">
          <span>${name}</span>
          <span>${score}%</span>
        </div>
        <div class="risk-factor-track">
          <div class="risk-factor-fill" style="width:${score}%"></div>
        </div>
      </div>
    `;
  }).join("");

  urlResult.classList.remove("hidden");
}

function renderApkAnalysis(result) {
  const riskScore = Math.max(0, Math.min(100, Number(result?.riskScore || 0)));
  const confidence = Math.max(0, Math.min(100, Number(result?.confidence || 0)));
  const accuracy = Math.max(0, Math.min(100, Number(result?.accuracy ?? confidence ?? 0)));
  const riskLevel = String(result?.riskLevel || "low").toLowerCase();
  const safeLevel = ["low", "medium", "high"].includes(riskLevel) ? riskLevel : "low";
  const factors = Array.isArray(result?.factors) ? result.factors.slice(0, 6) : [];
  latestAnalyzerResultByTab.apk = {
    riskScore,
    confidence,
    accuracy,
    riskLevel: safeLevel,
    summary: String(result?.summary || ""),
    explanation: String(result?.explanation || ""),
    evidence: Array.isArray(result?.evidence) ? result.evidence.slice(0, 6).map((item) => String(item || "")) : [],
    factors: factors.map((item) => ({
      name: String(item?.name || "Signal"),
      score: Math.max(0, Math.min(100, Number(item?.score || 0)))
    }))
  };

  apkRiskLevelBadge.textContent = safeLevel.toUpperCase();
  apkRiskLevelBadge.className = `risk-badge ${safeLevel}`;
  apkRiskMeterFill.style.width = `${riskScore}%`;
  apkRiskSummary.textContent = result?.summary || "No summary provided.";
  apkRiskScoreValue.textContent = `${riskScore}%`;
  apkRiskConfidenceValue.textContent = `${confidence}%`;
  if (apkRiskAccuracyValue) apkRiskAccuracyValue.textContent = `${accuracy}%`;

  apkRiskFactors.innerHTML = factors.map((item) => {
    const name = escapeHtml(item.name || "Signal");
    const score = Math.max(0, Math.min(100, Number(item.score || 0)));
    return `
      <div class="risk-factor">
        <div class="risk-factor-top">
          <span>${name}</span>
          <span>${score}%</span>
        </div>
        <div class="risk-factor-track">
          <div class="risk-factor-fill" style="width:${score}%"></div>
        </div>
      </div>
    `;
  }).join("");

  apkResult.classList.remove("hidden");
}

function renderEmailAnalysis(result) {
  const riskScore = Math.max(0, Math.min(100, Number(result?.riskScore || 0)));
  const confidence = Math.max(0, Math.min(100, Number(result?.confidence || 0)));
  const accuracy = Math.max(0, Math.min(100, Number(result?.accuracy ?? confidence ?? 0)));
  const riskLevel = String(result?.riskLevel || "low").toLowerCase();
  const safeLevel = ["low", "medium", "high"].includes(riskLevel) ? riskLevel : "low";
  const factors = Array.isArray(result?.factors) ? result.factors.slice(0, 6) : [];
  latestAnalyzerResultByTab.email = {
    riskScore,
    confidence,
    accuracy,
    riskLevel: safeLevel,
    summary: String(result?.summary || ""),
    explanation: String(result?.explanation || ""),
    evidence: Array.isArray(result?.evidence) ? result.evidence.slice(0, 6).map((item) => String(item || "")) : [],
    factors: factors.map((item) => ({
      name: String(item?.name || "Signal"),
      score: Math.max(0, Math.min(100, Number(item?.score || 0)))
    }))
  };

  emailRiskLevelBadge.textContent = safeLevel.toUpperCase();
  emailRiskLevelBadge.className = `risk-badge ${safeLevel}`;
  emailRiskMeterFill.style.width = `${riskScore}%`;
  emailRiskSummary.textContent = result?.summary || "No summary provided.";
  emailRiskScoreValue.textContent = `${riskScore}%`;
  emailRiskConfidenceValue.textContent = `${confidence}%`;
  if (emailRiskAccuracyValue) emailRiskAccuracyValue.textContent = `${accuracy}%`;

  emailRiskFactors.innerHTML = factors.map((item) => {
    const name = escapeHtml(item.name || "Signal");
    const score = Math.max(0, Math.min(100, Number(item.score || 0)));
    return `
      <div class="risk-factor">
        <div class="risk-factor-top">
          <span>${name}</span>
          <span>${score}%</span>
        </div>
        <div class="risk-factor-track">
          <div class="risk-factor-fill" style="width:${score}%"></div>
        </div>
      </div>
    `;
  }).join("");

  emailResult.classList.remove("hidden");
}

async function loadMyAnalyzerData() {
  const user = getSessionUser() || {};
  const email = (user.email || "").trim().toLowerCase();
  if (!email) {
    analyzerRowsCache = [];
    renderAnalyzerDesktopHistory();
    dataTableBody.innerHTML = "<tr><td colspan=\"6\">Login to view your analyzer data.</td></tr>";
    return;
  }

  try {
    const res = await fetch(buildApiUrl(`/api/analyzer-log/mine?email=${encodeURIComponent(email)}`));
    const data = await res.json();
    if (!res.ok) {
      analyzerRowsCache = [];
      renderAnalyzerDesktopHistory();
      dataTableBody.innerHTML = "<tr><td colspan=\"6\">Unable to load data.</td></tr>";
      return;
    }
    const hiddenIds = loadHiddenAnalyzerIds();
    analyzerRowsCache = (Array.isArray(data.rows) ? data.rows : [])
      .filter((row) => !hiddenIds.has(String(row?.id || "")));
    renderAnalyzerDesktopHistory();
    if (analyzerRowsCache.length === 0) {
      dataTableBody.innerHTML = "<tr><td colspan=\"6\">No analyzer data yet.</td></tr>";
      return;
    }
    renderFilteredAnalyzerRows();
  } catch {
    analyzerRowsCache = [];
    renderAnalyzerDesktopHistory();
    dataTableBody.innerHTML = "<tr><td colspan=\"6\">Server unavailable.</td></tr>";
  }
}

function renderAnalyzerDesktopHistory() {
  if (!analyzerDesktopList || !anHistoryCount) return;

  const user = getSessionUser() || {};
  const email = (user.email || "").trim().toLowerCase();
  if (!email) {
    anHistoryCount.textContent = "0 records";
    analyzerDesktopList.innerHTML = "<p class=\"an-history-empty\">Login to view your analyzed data.</p>";
    return;
  }

  const rows = getSortedAnalyzerRows().filter(isAnalyzerRowComplete);
  const canDelete = isAdminSession();

  anHistoryCount.textContent = `${rows.length} records`;
  if (rows.length === 0) {
    analyzerDesktopList.innerHTML = "<p class=\"an-history-empty\">No analyzer data yet.</p>";
    return;
  }

  analyzerDesktopList.innerHTML = rows.slice(0, 30).map((row, index) => {
    const type = String(row?.type || "").toLowerCase();
    const details = String(row?.details || "").trim();
    const time = new Date(row?.timestamp || Date.now());
    const safeTime = Number.isNaN(time.getTime()) ? "-" : time.toLocaleString();
    const rowId = String(row?.id || "");
    const deleteChip = canDelete && rowId
      ? `<span class="an-history-delete" data-history-delete="${escapeHtml(rowId)}">Delete</span>`
      : "";
    return `
      <button class="an-history-item" type="button" data-history-type="${escapeHtml(type)}" data-history-id="${escapeHtml(rowId)}" data-history-index="${index}">
        <div class="an-history-item-top">
          <span class="an-history-type">${escapeHtml(formatAnalyzerTypeLabel(type))}</span>
          <div class="an-history-meta">
            <span class="an-history-time">${escapeHtml(safeTime)}</span>
            ${deleteChip}
          </div>
        </div>
        <div class="an-history-details">${escapeHtml(details || "No details available.")}</div>
      </button>
    `;
  }).join("");
}

function renderFilteredAnalyzerRows() {
  const filterType = String(dataTypeFilter.value || "all").toLowerCase();
  const rows = filterType === "all"
    ? analyzerRowsCache
    : analyzerRowsCache.filter((row) => String(row.type || "").toLowerCase() === filterType);

  if (rows.length === 0) {
    dataTableBody.innerHTML = "<tr><td colspan=\"6\">No records for selected filter.</td></tr>";
    return;
  }

  const canDeleteAll = isAdminSession();
  dataTableBody.innerHTML = rows.map((row) => `
    <tr>
      <td>${escapeHtml(new Date(row.timestamp).toLocaleString())}</td>
      <td>${escapeHtml(String(row.username || row.userName || row.userEmail || "Unknown"))}</td>
      <td>${escapeHtml(String(row.type || "").toUpperCase())}</td>
      <td>${escapeHtml(formatAnalyzerOriginLabel(row.origin))}</td>
      <td>${escapeHtml(row.details || "")}</td>
      <td>${
        canDeleteAll
          ? `<button class="table-delete-btn" type="button" data-log-id="${escapeHtml(row.id || "")}">Delete</button>`
          : "-"
      }</td>
    </tr>
  `).join("");
}

async function deleteAnalyzerRow(logId) {
  if (!isAdminSession()) {
    showErrorPopup("Only admin can delete records.");
    return;
  }
  const user = getSessionUser() || {};
  const email = (user.email || "").trim().toLowerCase();
  if (!email || !logId) {
    showErrorPopup("Unable to delete this data row.");
    return;
  }
  if (!confirm("Delete this analyzer record?")) {
    return;
  }

  try {
    const url = buildApiUrl(`/api/analyzer-log/${encodeURIComponent(logId)}?email=${encodeURIComponent(email)}`);
    const res = await fetch(url, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showErrorPopup(data.message || "Failed to delete this record.");
      return;
    }
    analyzerRowsCache = analyzerRowsCache.filter((row) => String(row?.id || "") !== String(logId));
    renderAnalyzerDesktopHistory();
    renderFilteredAnalyzerRows();
    showErrorPopup("Record deleted.");
  } catch {
    showErrorPopup("Server unavailable. Could not delete record.");
  }
}

async function clearFilteredAnalyzerData() {
  if (!isAdminSession()) {
    showErrorPopup("Only admin can delete records.");
    return;
  }
  const filterType = String(dataTypeFilter.value || "all").toLowerCase();
  const rows = filterType === "all"
    ? analyzerRowsCache
    : analyzerRowsCache.filter((row) => String(row.type || "").toLowerCase() === filterType);

  if (rows.length === 0) {
    showErrorPopup("No data to delete for this filter.");
    return;
  }
  if (!confirm(`Delete ${rows.length} ${filterType === "all" ? "records" : filterType + " records"}?`)) {
    return;
  }

  const user = getSessionUser() || {};
  const email = (user.email || "").trim().toLowerCase();
  if (!email) {
    showErrorPopup("Login required.");
    return;
  }

  const ids = rows.map((row) => String(row.id || "")).filter(Boolean);
  try {
    const res = await fetch(buildApiUrl("/api/analyzer-log/delete-many"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, ids })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showErrorPopup(data.message || "Failed to delete records.");
      return;
    }
    const idSet = new Set(ids);
    analyzerRowsCache = analyzerRowsCache.filter((row) => !idSet.has(String(row?.id || "")));
    renderAnalyzerDesktopHistory();
    renderFilteredAnalyzerRows();
    showErrorPopup(`Deleted ${data.deleted ?? ids.length} records.`);
  } catch {
    showErrorPopup("Server unavailable. Could not delete records.");
  }
}

function renderAgentSteps(rows) {
  if (!agentSteps) return;
  const list = Array.isArray(rows) ? rows : [];
  if (list.length === 0) {
    agentSteps.innerHTML = "<div class=\"agent-step\"><div class=\"agent-step-note\">No investigation yet for this analyzer.</div></div>";
    return;
  }

  agentSteps.innerHTML = list.map((row, index) => {
    const step = Number(row?.step || (index + 1));
    const action = String(row?.action || "tool");
    const status = String(row?.status || "completed");
    const note = String(row?.note || row?.observation || "");
    const observation = String(row?.observation || "");
    return `
      <div class="agent-step">
        <div class="agent-step-top">
          <span class="agent-step-title">Step ${step}: ${escapeHtml(action)}</span>
          <span class="agent-step-status">${escapeHtml(status)}</span>
        </div>
        <div class="agent-step-note">${escapeHtml(note || "-")}</div>
        ${observation ? `<div class="agent-step-note">${escapeHtml(observation)}</div>` : ""}
      </div>
    `;
  }).join("");
}

function renderAgentReport(report) {
  if (!agentReport) return;
  const riskScore = Number(report?.riskScore || 0);
  const confidence = Number(report?.confidence || 0);
  const riskLevel = String(report?.riskLevel || "low").toUpperCase();
  const summary = String(report?.summary || "No summary available.");
  const evidence = Array.isArray(report?.evidence) ? report.evidence : [];
  const recommendations = Array.isArray(report?.recommendations) ? report.recommendations : [];

  agentReport.innerHTML = `
    <h5>Final Report</h5>
    <p><strong>Risk:</strong> ${escapeHtml(String(riskScore))}% (${escapeHtml(riskLevel)})</p>
    <p><strong>Confidence:</strong> ${escapeHtml(String(confidence))}%</p>
    <p><strong>Summary:</strong> ${escapeHtml(summary)}</p>
    <p><strong>Evidence:</strong> ${escapeHtml(evidence.join(" | ") || "-")}</p>
    <p><strong>Recommendations:</strong> ${escapeHtml(recommendations.join(" | ") || "-")}</p>
  `;
  agentReport.classList.remove("hidden");
}

function renderAgentStateForTab(tab) {
  const key = tab === "apk" ? "apk" : tab === "email" ? "email" : "url";
  const state = agentStateByTab[key] || { status: "Idle.", steps: [], report: null, caseId: "" };
  if (agentStatus) {
    agentStatus.textContent = state.caseId
      ? `Case ${state.caseId} completed.`
      : (state.status || "Idle.");
  }
  renderAgentSteps(state.steps || []);
  if (state.report) {
    renderAgentReport(state.report);
  } else if (agentReport) {
    agentReport.innerHTML = "";
    agentReport.classList.add("hidden");
  }
}

function applyAgentFallbackTrace(mode, analysis, note) {
  const stateKey = mode === "apk" ? "apk" : mode === "email" ? "email" : "url";
  const riskScore = Math.max(0, Math.min(100, Number(analysis?.riskScore || 0)));
  const confidence = Math.max(0, Math.min(100, Number(analysis?.confidence || 0)));
  const riskLevel = String(analysis?.riskLevel || "low").toLowerCase();
  const summary = String(analysis?.summary || analysis?.explanation || "Direct analyzer completed.");
  const evidence = Array.isArray(analysis?.factors)
    ? analysis.factors.slice(0, 6).map((item) => `${item?.name || "Signal"}: ${item?.score || 0}%`)
    : [];
  const recommendations = riskScore >= 70
    ? ["Do not open/click/install yet.", "Isolate item and escalate to security.", "Preserve indicators and timeline evidence."]
    : riskScore >= 40
      ? ["Run additional verification and sandbox checks.", "Confirm sender/domain/signature via trusted source.", "Proceed only after manual review."]
      : ["No strong high-risk signal found.", "Continue with normal caution and verify authenticity.", "Monitor for behavior changes or new intel."];

  agentStateByTab[stateKey] = {
    status: "Completed (Direct Analyzer)",
    steps: [
      {
        step: 1,
        action: "directAnalysis",
        status: "completed",
        note: String(note || "AI Investigator unavailable. Used direct analyzer instead.").slice(0, 220),
        observation: summary.slice(0, 220)
      }
    ],
    report: {
      summary,
      riskScore,
      riskLevel,
      confidence,
      evidence,
      recommendations
    },
    caseId: ""
  };
  renderAgentStateForTab(currentAnalyzerTab);
}

function getAgentInputForMode(mode) {
  if (mode === "url") {
    return String(urlInput?.value || "").trim();
  }
  if (mode === "apk") {
    const typed = String(apkName?.value || "").trim();
    const selectedFile = apkFile?.files?.[0];
    if (typed) return typed;
    if (selectedFile && isApkFilename(selectedFile.name)) return selectedFile.name;
    return "";
  }
  if (mode === "email") {
    return String(mailHead?.value || "").trim();
  }
  return "";
}

async function runIntegratedAgent(mode) {
  const stateKey = mode === "apk" ? "apk" : mode === "email" ? "email" : "url";
  const inputValue = getAgentInputForMode(mode);
  if (!inputValue) {
    showErrorPopup(`Enter ${mode === "url" ? "URL" : mode === "apk" ? "APK input" : "email content"} before running AI Investigator.`);
    return null;
  }

  const objective = `Investigate suspicious ${mode.toUpperCase()} and produce triage report with evidence for this input: ${inputValue.slice(0, 220)}`;
  const user = getSessionUser() || {};
  const email = String(user.email || "").trim().toLowerCase();
  const payload = {
    objective,
    email: email || "guest@local",
    mode,
    input: inputValue,
    source: mode === "apk" ? String(apkSource?.value || "Unknown").trim() : "Unknown"
  };

  if (urlAnalyzeBtn) urlAnalyzeBtn.disabled = true;
  if (apkAnalyzeBtn) apkAnalyzeBtn.disabled = true;
  if (mailAnalyzeBtn) mailAnalyzeBtn.disabled = true;
  agentStateByTab[stateKey] = { status: "Running AI Investigator...", steps: [], report: null, caseId: "" };
  if (agentStatus) agentStatus.textContent = "Running AI Investigator...";
  if (agentSteps) agentSteps.innerHTML = "";
  if (agentReport) {
    agentReport.innerHTML = "";
    agentReport.classList.add("hidden");
  }

  const liveStatuses = [
    "Step 1: planning investigation...",
    "Step 2: executing tool actions...",
    "Step 3: collecting evidence...",
    "Step 4: building final report..."
  ];
  let statusIdx = 0;
  const statusTimer = setInterval(() => {
    if (!agentStatus) return;
    agentStatus.textContent = liveStatuses[statusIdx % liveStatuses.length];
    statusIdx += 1;
  }, 900);

  try {
    const res = await fetch(buildApiUrl("/api/agent/investigate"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      showErrorPopup(data?.message || "AI Investigator failed.");
      agentStateByTab[stateKey] = {
        status: data?.message || "Investigation failed.",
        steps: data?.steps || [],
        report: null,
        caseId: ""
      };
      renderAgentStateForTab(currentAnalyzerTab);
      return null;
    }

    agentStateByTab[stateKey] = {
      status: "Completed",
      steps: data?.steps || [],
      report: data?.report || null,
      caseId: data?.caseId || ""
    };
    renderAgentStateForTab(currentAnalyzerTab);
    return data;
  } catch {
    agentStateByTab[stateKey] = { status: "Server unavailable.", steps: [], report: null, caseId: "" };
    renderAgentStateForTab(currentAnalyzerTab);
    showErrorPopup("Server not reachable. Start backend first.");
    return null;
  } finally {
    clearInterval(statusTimer);
    if (urlAnalyzeBtn) urlAnalyzeBtn.disabled = false;
    if (apkAnalyzeBtn) apkAnalyzeBtn.disabled = false;
    if (mailAnalyzeBtn) mailAnalyzeBtn.disabled = false;
  }
}

async function askAnalyzerAssistant(question, outputEl, buttonEl, context) {
  if (!question) {
    showErrorPopup("Please enter a question for AI.");
    return;
  }

  if (buttonEl) buttonEl.disabled = true;
  if (outputEl) {
    outputEl.classList.remove("hidden");
    outputEl.textContent = "Thinking...";
  }

  try {
    const res = await fetch(buildApiUrl("/api/llm-assistant"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: question,
        context
      })
    });
    const data = await res.json();
    if (!res.ok) {
      const msg = data?.error || data?.message || "AI assistant is unavailable.";
      if (outputEl) outputEl.textContent = msg;
      showErrorPopup(msg);
      return;
    }
    if (outputEl) {
      outputEl.textContent = String(data?.reply || data?.answer || "No response received.");
    }
  } catch {
    if (outputEl) outputEl.textContent = "Server not reachable. Start backend first.";
    showErrorPopup("Server not reachable. Start backend first.");
  } finally {
    if (buttonEl) buttonEl.disabled = false;
  }
}

async function handleAnalyzerAskSubmit(e) {
  e.preventDefault();
  const question = String(analyzerAskInput?.value || "").trim();
  const mode = currentAnalyzerTab || "url";
  const tabKey = mode === "apk" ? "apk" : mode === "email" ? "email" : "url";
  const latest = latestAnalyzerResultByTab[tabKey];
  const inputContext = mode === "url"
    ? { currentInput: String(urlInput?.value || "").trim() || "-" }
    : mode === "apk"
      ? {
          currentInput: String(apkName?.value || "").trim() || "-",
          source: String(apkSource?.value || "Unknown")
        }
      : { currentInput: String(mailHead?.value || "").trim().slice(0, 280) || "-" };

  const context = {
    analyzerType: tabKey,
    input: inputContext,
    analysis: latest || null
  };
  await askAnalyzerAssistant(question, analyzerAskOutput, analyzerAskBtn, context);
}

async function handleAnalyzeUrl() {
  const value = (urlInput.value || "").trim();
  if (!value) {
    showErrorPopup("Please enter a URL to analyze.");
    return;
  }

  setAnalyzerLoading("url", true);
  try {
    const data = await runIntegratedAgent("url");
    if (!data) return;
    const analysis = data?.analysis || null;
    if (!analysis) {
      showErrorPopup("AI Investigator returned no analysis.");
      return;
    }
    renderUrlAnalysis(analysis);
    const riskScore = Math.max(0, Math.min(100, Number(analysis?.riskScore || 0)));
    const confidence = Math.max(0, Math.min(100, Number(analysis?.confidence || 0)));
    const riskLevel = String(analysis?.riskLevel || "low").toLowerCase();
    const safeScore = Math.max(0, Math.min(100, 100 - riskScore));
    await logAnalyzerActivity(
      "url",
      `${value} | status:completed | risk:${riskScore}% | safe:${safeScore}%`,
      "website",
      { riskScore, safeScore, confidence, riskLevel }
    );
    loadMyAnalyzerData();
  } catch {
    showErrorPopup("Server not reachable. Start backend first.");
  } finally {
    setAnalyzerLoading("url", false);
  }
}

async function handleAnalyzeApk() {
  const typedValue = (apkName.value || "").trim();
  const selectedFile = apkFile?.files?.[0] || null;
  let apkPayload = typedValue;
  let logValue = typedValue;

  if (!apkPayload && selectedFile) {
    if (!isApkFilename(selectedFile.name)) {
      showErrorPopup("Only .apk files are allowed.");
      return;
    }
    if (!window.crypto?.subtle) {
      apkPayload = selectedFile.name;
      logValue = `file:${selectedFile.name}`;
    } else {
      try {
        const digestBuffer = await window.crypto.subtle.digest("SHA-256", await selectedFile.arrayBuffer());
        const digestBytes = new Uint8Array(digestBuffer);
        const digestHex = Array.from(digestBytes).map((byte) => byte.toString(16).padStart(2, "0")).join("");
        apkPayload = digestHex;
        logValue = `file:${selectedFile.name} | sha256:${digestHex}`;
        apkName.value = digestHex;
      } catch {
        apkPayload = selectedFile.name;
        logValue = `file:${selectedFile.name}`;
      }
    }
  }

  if (!apkPayload) {
    showErrorPopup("Paste APK package/hash or select an APK file.");
    return;
  }

  const normalizedApkPayload = normalizeApkInputValue(apkPayload);
  if (normalizedApkPayload && normalizedApkPayload !== apkPayload) {
    logValue = `${logValue} | normalized:${normalizedApkPayload}`;
    apkPayload = normalizedApkPayload;
    apkName.value = normalizedApkPayload;
  }

  if (!isValidApkInputValue(apkPayload)) {
    showErrorPopup("Enter a valid package name, SHA-256 hash, APK file name (*.apk), or APK URL.");
    return;
  }

  const runDirectApkAnalysis = async () => {
    try {
      const res = await fetch(buildApiUrl("/api/analyze-apk"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apk: apkPayload,
          source: String(apkSource?.value || "Unknown").trim(),
          permissions: []
        })
      });
      const data = await res.json();
      if (!res.ok) {
        showErrorPopup(data?.detail || data?.message || "APK analysis failed.");
        return false;
      }
      const analysis = data?.result || null;
      if (!analysis) {
        showErrorPopup("APK analyzer returned no analysis.");
        return false;
      }
      renderApkAnalysis(analysis);
      applyAgentFallbackTrace("apk", analysis, "AI Investigator unavailable. Direct APK analyzer used.");
      const riskScore = Math.max(0, Math.min(100, Number(analysis?.riskScore || 0)));
      const confidence = Math.max(0, Math.min(100, Number(analysis?.confidence || 0)));
      const riskLevel = String(analysis?.riskLevel || "low").toLowerCase();
      const safeScore = Math.max(0, Math.min(100, 100 - riskScore));
      await logAnalyzerActivity(
        "apk",
        `${logValue} | source:${apkSource.value} | status:completed | risk:${riskScore}% | safe:${safeScore}%`,
        "website",
        { riskScore, safeScore, confidence, riskLevel }
      );
      loadMyAnalyzerData();
      return true;
    } catch {
      showErrorPopup("Server not reachable. Start backend first.");
      return false;
    }
  };

  setAnalyzerLoading("apk", true);
  try {
    const data = await runIntegratedAgent("apk");
    if (!data) {
      const ok = await runDirectApkAnalysis();
      if (!ok) showErrorPopup("AI Investigator unavailable and direct APK analysis failed.");
      return;
    }
    const analysis = data?.analysis || null;
    if (!analysis) {
      const ok = await runDirectApkAnalysis();
      if (!ok) showErrorPopup("AI Investigator returned no analysis.");
      return;
    }
    renderApkAnalysis(analysis);
    const riskScore = Math.max(0, Math.min(100, Number(analysis?.riskScore || 0)));
    const confidence = Math.max(0, Math.min(100, Number(analysis?.confidence || 0)));
    const riskLevel = String(analysis?.riskLevel || "low").toLowerCase();
    const safeScore = Math.max(0, Math.min(100, 100 - riskScore));
    await logAnalyzerActivity(
      "apk",
      `${logValue} | source:${apkSource.value} | status:completed | risk:${riskScore}% | safe:${safeScore}%`,
      "website",
      { riskScore, safeScore, confidence, riskLevel }
    );
    loadMyAnalyzerData();
  } catch {
    const ok = await runDirectApkAnalysis();
    if (!ok) showErrorPopup("Server not reachable. Start backend first.");
  } finally {
    setAnalyzerLoading("apk", false);
  }
}

async function handleAnalyzeEmail() {
  const value = (mailHead.value || "").trim();
  if (!value) {
    showErrorPopup("Please paste email headers/content.");
    return;
  }

  const runDirectEmailAnalysis = async () => {
    try {
      const res = await fetch(buildApiUrl("/api/analyze-email"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailText: value })
      });
      const data = await res.json();
      if (!res.ok) {
        showErrorPopup(data?.detail || data?.message || "Email analysis failed.");
        return false;
      }
      const analysis = data?.result || null;
      if (!analysis) {
        showErrorPopup("Email analyzer returned no analysis.");
        return false;
      }
      renderEmailAnalysis(analysis);
      applyAgentFallbackTrace("email", analysis, "AI Investigator unavailable. Direct email analyzer used.");
      const riskScore = Math.max(0, Math.min(100, Number(analysis?.riskScore || 0)));
      const confidence = Math.max(0, Math.min(100, Number(analysis?.confidence || 0)));
      const riskLevel = String(analysis?.riskLevel || "low").toLowerCase();
      const safeScore = Math.max(0, Math.min(100, 100 - riskScore));
      await logAnalyzerActivity(
        "email",
        `status:completed | risk:${riskScore}% | safe:${safeScore}% | ${value.slice(0, 240)}`,
        "website",
        { riskScore, safeScore, confidence, riskLevel }
      );
      loadMyAnalyzerData();
      return true;
    } catch {
      showErrorPopup("Server not reachable. Start backend first.");
      return false;
    }
  };

  setAnalyzerLoading("email", true);
  try {
    const data = await runIntegratedAgent("email");
    if (!data) {
      const ok = await runDirectEmailAnalysis();
      if (!ok) showErrorPopup("AI Investigator unavailable and direct email analysis failed.");
      return;
    }
    const analysis = data?.analysis || null;
    if (!analysis) {
      const ok = await runDirectEmailAnalysis();
      if (!ok) showErrorPopup("AI Investigator returned no analysis.");
      return;
    }
    renderEmailAnalysis(analysis);
    const riskScore = Math.max(0, Math.min(100, Number(analysis?.riskScore || 0)));
    const confidence = Math.max(0, Math.min(100, Number(analysis?.confidence || 0)));
    const riskLevel = String(analysis?.riskLevel || "low").toLowerCase();
    const safeScore = Math.max(0, Math.min(100, 100 - riskScore));
    await logAnalyzerActivity(
      "email",
      `status:completed | risk:${riskScore}% | safe:${safeScore}% | ${value.slice(0, 240)}`,
      "website",
      { riskScore, safeScore, confidence, riskLevel }
    );
    loadMyAnalyzerData();
  } catch {
    const ok = await runDirectEmailAnalysis();
    if (!ok) showErrorPopup("Server not reachable. Start backend first.");
  } finally {
    setAnalyzerLoading("email", false);
  }
}

function handleAdminExportSubmit(e) {
  e.preventDefault();
  const key = (adminKeyInput.value || "").trim();
  if (!key) {
    showErrorPopup("Admin key is required.");
    return;
  }
  const url = buildApiUrl(`/api/admin/analyzer-export?key=${encodeURIComponent(key)}`);
  window.open(url, "_blank", "noopener");
}

function handleLeaderboardExport() {
  const key = (adminKeyInput.value || "").trim();
  if (!key) {
    showErrorPopup("Admin key is required.");
    return;
  }
  const url = buildApiUrl(`/api/admin/leaderboard-export?key=${encodeURIComponent(key)}`);
  window.open(url, "_blank", "noopener");
}

async function resetGameData() {
  showErrorPopup("Game module has been removed from this project.");
}

async function deleteAccount() {
  const user = getSessionUser();
  const email = (user?.email || "").trim().toLowerCase();

  if (!email) {
    showErrorPopup("No active account found.");
    return;
  }

  if (!confirm("Delete your account permanently? This cannot be undone.")) {
    return;
  }

  try {
    const res = await fetch(buildApiUrl("/api/delete-account"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const data = await res.json();

    if (!res.ok) {
      showErrorPopup(data.message || "Account deletion failed.");
      return;
    }

    localStorage.removeItem("cyber_theme");
    localStorage.removeItem(getLeaderboardStorageKey());
    showErrorPopup("Account deleted successfully.");
    logout();
  } catch {
    showErrorPopup("Server not reachable. Start backend first.");
  }
}

function showDashboardHome() {
  setMainTab("learn");
  setDashboardMenu("dashboard");
  loadDashboardGameBars();
}

function openChallengePage(pathname) {
  const rawPath = String(pathname || "").trim();
  if (!rawPath) return;
  if (window.location.protocol === "file:" && rawPath.startsWith("/game/")) {
    const localPath = rawPath.replace(/^\/game\//, "../game/");
    window.location.href = localPath;
    return;
  }
  window.location.href = rawPath;
}

function setBarWidth(el, value) {
  if (!el) return;
  const width = Math.max(0, Math.min(100, Number(value) || 0));
  el.style.width = `${width}%`;
}

async function loadDashboardGameBars() {
  const state = loadQuestState();
  const completed = new Set(state.completed);
  setBarWidth(phishMetricBar, completed.has("phishing-hunter") ? 100 : 0);
  setBarWidth(passMetricBar, completed.has("apk-triage") ? 100 : 0);
  setBarWidth(linksMetricBar, completed.has("url-scan") ? 100 : 0);
  setBarWidth(scoreMetricBar, completed.has("score-check") ? 100 : 0);
  renderQuestBoard();
}

function updatePhishStats() {
  if (!phishScore || !phishRound) return;
  phishScore.textContent = `Score: ${phishingScore}`;
  phishRound.textContent = `Round: ${phishingRound}`;
}

function renderPhishQuestion(payload) {
  currentPhishQuestionId = payload.questionId || "";
  phishFrom.textContent = payload.emailPreview?.from || "-";
  phishSubject.textContent = payload.emailPreview?.subject || "-";
  phishSnippet.textContent = payload.emailPreview?.snippet || "-";
  phishLink.textContent = payload.emailPreview?.link || "-";
  phishQuestionText.textContent = payload.question || "What is the safest action?";
  phishResult.textContent = "";

  const options = Array.isArray(payload.options) ? payload.options : [];
  phishOptions.innerHTML = options.map((opt) => `
    <button class="phish-option-btn" type="button" data-opt="${escapeHtml(opt.id || "")}">
      ${escapeHtml(opt.text || "")}
    </button>
  `).join("");

  phishQuestionWrap.classList.remove("hidden");
}

async function loadPhishingQuestion() {
  showErrorPopup("Game module has been removed from this project.");
}

async function openPhishingHunterGame() {
  showErrorPopup("Phishing Hunter was removed from this build.");
}

async function openPasswordFortressGame() {
  setMainTab("an");
  setAnalyzerTab("apk");
  setDashboardMenu("dashboard");
  showErrorPopup("Password Fortress module was removed. Use APK Analyzer mission instead.");
}

async function openSafeLinkSprintGame() {
  setMainTab("an");
  setAnalyzerTab("url");
  setDashboardMenu("dashboard");
  showErrorPopup("Safe Link Sprint module was removed. Use URL Analyzer mission instead.");
}

async function openMalwareDefenseGame() {
  setMainTab("an");
  setAnalyzerTab("mail");
  setDashboardMenu("dashboard");
  showErrorPopup("Malware Defense module was removed. Use Email Analyzer mission instead.");
}

async function openScoreDashboardPage() {
  showScoreBoard();
}

async function submitPhishingAnswer(selectedOption) {
  if (!selectedOption) return;
  showErrorPopup("Game module has been removed from this project.");
}

function openDashboard(user) {
  const safeName = user?.username || user?.name || "User";
  const loginAt = user?.loginAt || new Date().toISOString();
  const loginDateObj = new Date(loginAt);
  const loginDate = Number.isNaN(loginDateObj.getTime()) ? "" : loginDateObj.toLocaleDateString();
  const loginTime = Number.isNaN(loginDateObj.getTime()) ? "" : loginDateObj.toLocaleTimeString();
  navigateToView("dashboard");
  userLabel.textContent = safeName;
  welcome.textContent = "Welcome, " + safeName;
  localStorage.setItem("cyber_logged_in", "1");
  localStorage.setItem("cyber_user", JSON.stringify({
    name: user?.name || safeName,
    username: user?.username || safeName,
    email: user?.email || "",
    loginAt,
    loginDate,
    loginTime
  }));
  applyAdminAccessVisibility();
  if (isAdminSession()) {
    showLeaderboard();
  } else {
    showDashboardHome();
  }
  renderQuestBoard();
  loadDashboardGameBars();
}

function openAuth() {
  navigateToView("auth");
  setAuthMode("login");
}

function openLanding() {
  navigateToView("landing");
}

function restoreDashboardFromSession() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("view") !== "dashboard") return false;
  const loggedIn = localStorage.getItem("cyber_logged_in") === "1";
  const user = getSessionUser();

  let safeName = "Guest";
  let safeEmail = "guest@local";
  if (loggedIn && user) {
    safeName = user?.username || user?.name || "User";
    safeEmail = user?.email || "";
  } else {
    localStorage.removeItem(adminSessionStorageKey);
    localStorage.setItem("cyber_user", JSON.stringify({ name: safeName, username: safeName, email: safeEmail }));
  }

  showView("dashboard");
  userLabel.textContent = safeName;
  welcome.textContent = "Welcome, " + safeName;
  applyAdminAccessVisibility();
  if (isAdminSession()) {
    showLeaderboard();
  } else {
    showDashboardHome();
  }
  renderQuestBoard();
  loadDashboardGameBars();
  return true;
}

function logout() {
  localStorage.removeItem(adminSessionStorageKey);
  localStorage.removeItem("cyber_logged_in");
  localStorage.removeItem("cyber_user");
  openLanding();
  setAuthMode("login");
  loginForm.reset();
  signupForm.reset();
}

showLogin.addEventListener("click", () => setAuthMode("login"));
showSignup.addEventListener("click", () => setAuthMode("signup"));
joinNowBtn.addEventListener("click", openAuth);

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("pass").value;

  if (password.length < 6) {
    const msg = "Password must be at least 6 characters.";
    setMessage(signupMsg, msg, "err");
    showErrorPopup(msg);
    return;
  }

  try {
    const res = await fetch(buildApiUrl("/api/signup"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();

    if (!res.ok) {
      const msg = data.detail ? `${data.message || "Signup failed."} ${data.detail}` : (data.message || "Signup failed.");
      setMessage(signupMsg, msg, "err");
      showErrorPopup(msg);
      return;
    }

    setMessage(signupMsg, data.message || "Sign up successful. Please login.", "ok");
    setTimeout(() => {
      localStorage.removeItem("cyber_logged_in");
      localStorage.removeItem("cyber_user");
      signupForm.reset();
      openAuth();
      const loginEmail = document.getElementById("loginEmail");
      const loginPass = document.getElementById("loginPass");
      loginEmail.value = data?.user?.email || "";
      loginPass.value = "";
      loginPass.focus();
      setMessage(loginMsg, "Account created. Enter password to login.", "ok");
    }, 450);
  } catch {
    const msg = "Server not reachable. Start backend first.";
    setMessage(signupMsg, msg, "err");
    showErrorPopup(msg);
  }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim().toLowerCase();
  const password = document.getElementById("loginPass").value;
  const now = new Date();
  const clientLoginDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const clientLoginTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
  const clientTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";

  try {
    const res = await fetch(buildApiUrl("/api/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, clientLoginDate, clientLoginTime, clientTimeZone })
    });
    const data = await res.json();

    if (!res.ok) {
      const msg = data.message || "Invalid email or password.";
      setMessage(loginMsg, msg, "err");
      showErrorPopup(msg);
      return;
    }

    setAdminSession(Boolean(data?.isAdmin));
    setMessage(loginMsg, "Login successful. Opening dashboard...", "ok");
    setTimeout(() => openDashboard({ ...(data.user || {}), loginAt: data?.loginAt }), 350);
  } catch {
    const msg = "Server not reachable. Start backend first.";
    setMessage(loginMsg, msg, "err");
    showErrorPopup(msg);
  }
});

learnTab.addEventListener("click", () => {
  setMainTab("learn");
  setDashboardMenu("dashboard");
});
if (scoreTab) {
  scoreTab.addEventListener("click", () => {
    showScoreBoard();
    setDashboardMenu("scores");
  });
}
anTab.addEventListener("click", () => {
  setMainTab("an");
  setDashboardMenu("dashboard");
  loadMyAnalyzerData();
});
adminTab.addEventListener("click", () => {
  setMainTab("admin");
  setDashboardMenu("dashboard");
  loadMyAnalyzerData();
});

urlBtn.addEventListener("click", () => setAnalyzerTab("url"));
apkBtn.addEventListener("click", () => setAnalyzerTab("apk"));
mailBtn.addEventListener("click", () => setAnalyzerTab("mail"));

if (menuDashboard) menuDashboard.addEventListener("click", showDashboardHome);
if (menuAbout) menuAbout.addEventListener("click", () => showInfoPage("about"));
if (menuServices) menuServices.addEventListener("click", () => showInfoPage("services"));
if (menuContact) menuContact.addEventListener("click", () => showInfoPage("contact"));
if (menuScores) menuScores.addEventListener("click", showScoreBoard);
if (menuLeaderboard) menuLeaderboard.addEventListener("click", showLeaderboard);
if (menuSettings) menuSettings.addEventListener("click", showSettingsPage);
if (menuSupport) menuSupport.addEventListener("click", () => showInfoPage("support"));
if (themeDarkBtn) themeDarkBtn.addEventListener("click", () => applyTheme("dark"));
if (themeLightBtn) themeLightBtn.addEventListener("click", () => applyTheme("light"));
if (resetGameBtn) resetGameBtn.addEventListener("click", resetGameData);
if (deleteAccountBtn) deleteAccountBtn.addEventListener("click", deleteAccount);
if (urlAnalyzeBtn) urlAnalyzeBtn.addEventListener("click", handleAnalyzeUrl);
if (urlRefreshBtn) urlRefreshBtn.addEventListener("click", () => refreshAnalyzerTab("url"));
if (thinkBeforeBtn) thinkBeforeBtn.addEventListener("click", runThinkBeforeCheck);
if (thinkBeforeRetryBtn) thinkBeforeRetryBtn.addEventListener("click", runThinkBeforeCheck);
if (thinkBeforeDisableBtn) thinkBeforeDisableBtn.addEventListener("click", disableThinkBeforeExtension);
window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  const data = event.data || {};
  if (data.source !== TBYC_EXTENSION_SOURCE) return;
  if (data.type === TBYC_MESSAGE_TYPE_RESULT) {
    handleThinkBeforeExtensionResult(data);
    return;
  }
  if (data.type === TBYC_MESSAGE_TYPE_ENABLE_ACK) {
    handleThinkBeforeEnableAck(data);
  }
});
if (thinkBeforeBtn) {
  const rawApiUrl = buildApiUrl("/api/analyze-url");
  let apiUrl = rawApiUrl;
  try {
    apiUrl = new URL(rawApiUrl, window.location.origin).toString();
  } catch {
    apiUrl = rawApiUrl;
  }
  const initRequestId = requestThinkBeforeEnable(false, apiUrl);
  clearTimeout(thinkBeforeEnableTimer);
  thinkBeforeEnableTimer = setTimeout(() => {
    if (initRequestId && initRequestId !== thinkBeforeEnableRequestId) return;
    setThinkBeforeConnectionStatus("err", "Extension: not detected");
  }, 1200);
}
if (apkAnalyzeBtn) apkAnalyzeBtn.addEventListener("click", handleAnalyzeApk);
if (apkRefreshBtn) apkRefreshBtn.addEventListener("click", () => refreshAnalyzerTab("apk"));
if (urlAnalyzeForm) {
  urlAnalyzeForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleAnalyzeUrl();
  });
}
if (urlInput) {
  urlInput.addEventListener("change", async function () {
    const url = String(this.value || "").trim();
    if (!url) return;

    const response = await fetch(buildApiUrl("/analyze"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });

    const data = await response.json();
    console.log(data);
  });
}
if (apkAnalyzeForm) {
  apkAnalyzeForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleAnalyzeApk();
  });
}
if (mailAnalyzeForm) {
  mailAnalyzeForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleAnalyzeEmail();
  });
}
if (mailHead) {
  mailHead.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAnalyzeEmail();
    }
  });
}
if (apkFile) {
  apkFile.addEventListener("change", () => {
    const selectedFile = apkFile.files?.[0];
    if (!selectedFile) {
      apkFileMeta.textContent = "You can paste package/hash above or choose an APK file.";
      return;
    }
    if (!isApkFilename(selectedFile.name)) {
      apkFile.value = "";
      apkFileMeta.textContent = "Only .apk files are allowed.";
      showErrorPopup("Please select an APK file (.apk) only.");
      return;
    }
    apkFileMeta.textContent = `Selected file: ${selectedFile.name}`;
  });
}
if (mailAnalyzeBtn) mailAnalyzeBtn.addEventListener("click", handleAnalyzeEmail);
if (mailRefreshBtn) mailRefreshBtn.addEventListener("click", () => refreshAnalyzerTab("email"));
if (analyzerAskForm) analyzerAskForm.addEventListener("submit", handleAnalyzerAskSubmit);
if (analyzerChatLaunchButtons && analyzerChatLaunchButtons.length > 0) {
  analyzerChatLaunchButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const analyzer = button.getAttribute("data-analyzer") || "current";
      if (isChatbotOpen()) {
        closeChatbotModal();
      } else {
        openChatbotModal(analyzer);
      }
    });
  });
}
if (chatbotCloseBtn) chatbotCloseBtn.addEventListener("click", closeChatbotModal);
if (chatbotForm) chatbotForm.addEventListener("submit", handleChatbotSubmit);
if (chatbotInput) {
  chatbotInput.addEventListener("input", updateChatbotCounter);
  chatbotInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (chatbotForm) chatbotForm.requestSubmit();
    }
  });
}
if (chatbotQuickActions) {
  chatbotQuickActions.addEventListener("click", (e) => {
    const button = e.target.closest(".chatbot-chip");
    if (!button || !chatbotInput) return;
    const prompt = String(button.getAttribute("data-prompt") || "").trim();
    if (!prompt) return;
    chatbotInput.value = prompt;
    updateChatbotCounter();
    chatbotInput.focus();
    if (chatbotForm) chatbotForm.requestSubmit();
  });
}
if (chatbotModal) {
  chatbotModal.addEventListener("click", (e) => {
    if (e.target === chatbotModal && isChatbotOpen()) closeChatbotModal();
  });
}
if (historyModalClose) historyModalClose.addEventListener("click", closeAnalyzerHistoryModal);
if (historyModal) {
  historyModal.addEventListener("click", (e) => {
    if (e.target === historyModal) closeAnalyzerHistoryModal();
  });
}
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (historyModal && !historyModal.classList.contains("hidden")) {
    closeAnalyzerHistoryModal();
    return;
  }
  if (chatbotModal && isChatbotOpen()) {
    closeChatbotModal();
  }
});
if (adminExportForm) adminExportForm.addEventListener("submit", handleAdminExportSubmit);
if (exportLeaderboardBtn) exportLeaderboardBtn.addEventListener("click", handleLeaderboardExport);
if (dataTypeFilter) dataTypeFilter.addEventListener("change", renderFilteredAnalyzerRows);
if (dataRefreshBtn) dataRefreshBtn.addEventListener("click", loadMyAnalyzerData);
if (dataClearBtn) dataClearBtn.addEventListener("click", clearFilteredAnalyzerData);
if (phishNewBtn) phishNewBtn.addEventListener("click", loadPhishingQuestion);
if (phishHunterCard) phishHunterCard.addEventListener("click", openPhishingHunterGame);
if (passwordFortressCard) passwordFortressCard.addEventListener("click", openPasswordFortressGame);
if (safeLinkSprintCard) safeLinkSprintCard.addEventListener("click", openSafeLinkSprintGame);
if (malwareDefenseCard) malwareDefenseCard.addEventListener("click", openMalwareDefenseGame);
if (scoreDashboardCard) scoreDashboardCard.addEventListener("click", openScoreDashboardPage);
if (learnGameUrlCard) learnGameUrlCard.addEventListener("click", () => openChallengePage("/game/cybear-challenge.html?game=url"));
if (learnGameApkCard) learnGameApkCard.addEventListener("click", () => openChallengePage("/game/cybear-challenge.html?game=apk"));
if (learnGameEmailCard) learnGameEmailCard.addEventListener("click", () => openChallengePage("/game/cybear-challenge.html?game=email"));
if (learnGamePasswordCard) learnGamePasswordCard.addEventListener("click", () => openChallengePage("/game/cybear-challenge.html?game=password"));
if (learnGameSocialCard) learnGameSocialCard.addEventListener("click", () => openChallengePage("/game/cybear-challenge.html?game=social-engineering"));
if (learnGameIncidentCard) learnGameIncidentCard.addEventListener("click", () => openChallengePage("/game/cybear-challenge.html?game=incident-response"));
document.querySelectorAll(".learn-link").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    openChallengePage(link.getAttribute("href") || "");
  });
});
if (questGrid) {
  questGrid.addEventListener("click", (e) => {
    const button = e.target.closest("button[data-quest-id][data-quest-action]");
    if (!button) return;
    const questId = button.getAttribute("data-quest-id");
    const action = button.getAttribute("data-quest-action");
    if (!questId || !action) return;
    completeQuest(questId);
    renderQuestBoard();
    loadDashboardGameBars();
    handleQuestAction(action);
  });
}
if (dataTableBody) {
  dataTableBody.addEventListener("click", (e) => {
    const button = e.target.closest("button[data-log-id]");
    if (!button) return;
    deleteAnalyzerRow(button.getAttribute("data-log-id"));
  });
}
if (analyzerDesktopList) {
  analyzerDesktopList.addEventListener("click", (e) => {
    const deleteChip = e.target.closest("[data-history-delete]");
    if (deleteChip) {
      e.stopPropagation();
      const logId = deleteChip.getAttribute("data-history-delete");
      if (logId) deleteAnalyzerRow(logId);
      return;
    }
    const button = e.target.closest("button[data-history-type]");
    if (!button) return;
    const historyType = String(button.getAttribute("data-history-type") || "").toLowerCase();
    const historyId = String(button.getAttribute("data-history-id") || "").trim();
    let row = null;
    if (historyId) {
      row = analyzerRowsCache.find((entry) => String(entry?.id || "") === historyId) || null;
    }
    if (!row) {
      const historyIndex = Number(button.getAttribute("data-history-index"));
      const rows = getSortedAnalyzerRows();
      if (Number.isFinite(historyIndex) && historyIndex >= 0 && historyIndex < rows.length) {
        row = rows[historyIndex] || null;
      }
    }
    if (row) {
      openAnalyzerHistoryModal(row);
    } else {
      showErrorPopup("Unable to load analyzer details for this record.");
    }
    if (historyType === "url" || historyType === "apk" || historyType === "email") {
      setAnalyzerTab(historyType === "email" ? "mail" : historyType);
    }
  });
}
if (phishOptions) {
  phishOptions.addEventListener("click", (e) => {
    const button = e.target.closest("button[data-opt]");
    if (!button) return;
    submitPhishingAnswer(button.getAttribute("data-opt"));
  });
}

if (leaderForm) {
  leaderForm.addEventListener("submit", (e) => {
    e.preventDefault();

  const entry = {
    name: leaderName.value.trim(),
    phishing: Number(leaderPhishing.value),
    password: Number(leaderPassword.value),
    links: Number(leaderLinks.value),
    malware: Number(leaderMalware.value),
    email: Number(leaderEmail.value)
  };

  if (!entry.name) {
    showErrorPopup("Player name is required.");
    return;
  }

  const values = [entry.phishing, entry.password, entry.links, entry.malware, entry.email];
  if (values.some((v) => Number.isNaN(v) || v < 0 || v > 100)) {
    showErrorPopup("All game scores must be between 0 and 100.");
    return;
  }

  const rows = loadLeaderboardData();
  const idx = rows.findIndex((r) => r.name.toLowerCase() === entry.name.toLowerCase());
  if (idx >= 0) {
    rows[idx] = entry;
  } else {
    rows.push(entry);
  }

    saveLeaderboardData(rows);
    leaderForm.reset();
    renderLeaderboard();
  });
}

logoutBtn.addEventListener("click", logout);

logoLinks.forEach((logo) => {
  const handleLogoBack = () => goToPreviousView();
  logo.addEventListener("click", handleLogoBack);
  logo.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleLogoBack();
    }
  });
});

initializeTheme();
updateAnalyzerAskPanel(currentAnalyzerTab);
applyChatbotAnalyzerPreset(currentAnalyzerTab, false);
renderAgentStateForTab(currentAnalyzerTab);
updatePhishStats();
if (!restoreDashboardFromSession()) {
  showView("landing");
}
