(function () {
  const leaderboardTab = document.getElementById("leaderboardTab");
  const leaderboardSection = document.getElementById("leaderboardSection");
  const gameFilter = document.getElementById("lbGameFilter");
  const runsEl = document.getElementById("lbRuns");
  const avgEl = document.getElementById("lbAvgScore");
  const bestEl = document.getElementById("lbBestScore");
  const gamesEl = document.getElementById("lbGamesPlayed");
  const chartHintEl = document.getElementById("lbChartHint");
  const chartEl = document.getElementById("leaderboardChart");
  const tableBody = document.getElementById("lbTableBody");
  const recentBody = document.getElementById("lbRecentBody");
  const adminSessionStorageKey = "cyber_admin_session";

  if (!leaderboardTab || !leaderboardSection) return;

  const topTabs = [
    document.getElementById("learnTab"),
    document.getElementById("scoreTab"),
    document.getElementById("anTab"),
    document.getElementById("adminTab"),
    leaderboardTab
  ].filter(Boolean);

  const panelSections = [
    document.getElementById("learnSection"),
    document.getElementById("anSection"),
    document.getElementById("adminSection"),
    document.getElementById("infoSection"),
    document.getElementById("scoreSection"),
    document.getElementById("leaderSection"),
    document.getElementById("settingsSection"),
    leaderboardSection
  ].filter(Boolean);

  let lastHistory = [];
  let lastPlayers = [];

  const gameNames = {
    all: "All Games",
    url: "URL Challenge",
    apk: "APK Challenge",
    email: "Email Challenge",
    password: "Password Challenge",
    "social-engineering": "Social Engineering",
    "incident-response": "Incident Response"
  };

  function getSessionUserSafe() {
    try {
      const raw = localStorage.getItem("cyber_user");
      if (!raw) return null;
      const user = JSON.parse(raw);
      if (!user || !user.email) return null;
      return user;
    } catch {
      return null;
    }
  }

  function hasAdminAccess() {
    try {
      const raw = localStorage.getItem("cyber_user");
      const user = raw ? JSON.parse(raw) : null;
      const email = String(user?.email || "").trim().toLowerCase();
      return localStorage.getItem(adminSessionStorageKey) === "1" && email === "darshana@gmail.com";
    } catch {
      return false;
    }
  }

  function formatGameName(key) {
    return gameNames[String(key || "").toLowerCase()] || String(key || "Unknown");
  }

  function formatTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString();
  }

  function clearBoard(message) {
    runsEl.textContent = "0";
    avgEl.textContent = "0";
    bestEl.textContent = "0";
    gamesEl.textContent = "0";
    chartHintEl.textContent = message || "Latest 60 runs";
    tableBody.innerHTML = '<tr><td colspan="5">No leaderboard data yet.</td></tr>';
    recentBody.innerHTML = '<tr><td colspan="4">No recent runs yet.</td></tr>';
    drawChart([]);
  }

  function drawChart(rows, players = []) {
    if (!chartEl) return;
    const ctx = chartEl.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = chartEl.getBoundingClientRect();
    const width = Math.max(320, Math.floor(rect.width || 640));
    const height = Math.max(220, Math.floor(rect.height || 220));
    chartEl.width = Math.floor(width * dpr);
    chartEl.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    const pad = { top: 20, right: 18, bottom: 28, left: 36 };
    const chartW = width - pad.left - pad.right;
    const chartH = height - pad.top - pad.bottom;

    ctx.strokeStyle = "#e3ecff";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i += 1) {
      const y = pad.top + (chartH * i) / 5;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(width - pad.right, y);
      ctx.stroke();
    }

    const showPlayersChart = hasAdminAccess() && Array.isArray(players) && players.length > 0;
    if (showPlayersChart) {
      const trimmed = players.slice(0, 12);
      const values = trimmed.map((p) => Math.max(0, Math.min(100, Number(p.avgScore || 0))));
      const axisMax = 100;
      const slotW = chartW / Math.max(trimmed.length, 1);
      const barW = Math.max(12, Math.min(28, slotW * 0.55));

      ctx.fillStyle = "#60739a";
      ctx.font = "11px JetBrains Mono, monospace";
      for (let i = 0; i <= 5; i += 1) {
        const value = String(Math.round(axisMax - ((axisMax * i) / 5)));
        const y = pad.top + (chartH * i) / 5 + 4;
        ctx.fillText(value, 6, y);
      }

      values.forEach((score, idx) => {
        const xCenter = pad.left + (slotW * idx) + (slotW / 2);
        const h = (score / axisMax) * chartH;
        const y = pad.top + chartH - h;
        const x = xCenter - (barW / 2);

        const gradient = ctx.createLinearGradient(0, y, 0, y + h);
        gradient.addColorStop(0, "#2f7cf6");
        gradient.addColorStop(1, "#6aa7ff");
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barW, h);

        ctx.fillStyle = "#2a3d63";
        ctx.font = "10px JetBrains Mono, monospace";
        ctx.fillText(String(Math.round(score)), x + 2, Math.max(12, y - 4));

        const name = String(trimmed[idx]?.username || trimmed[idx]?.userName || "User");
        const shortName = name.length > 8 ? `${name.slice(0, 8)}…` : name;
        ctx.fillStyle = "#51678f";
        ctx.font = "10px JetBrains Mono, monospace";
        ctx.fillText(shortName, x, pad.top + chartH + 14);
      });
      return;
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      ctx.fillStyle = "#60739a";
      ctx.font = "11px JetBrains Mono, monospace";
      for (let i = 0; i <= 5; i += 1) {
        const value = String(100 - i * 20);
        const y = pad.top + (chartH * i) / 5 + 4;
        ctx.fillText(value, 6, y);
      }
      ctx.fillStyle = "#7a8eb8";
      ctx.font = "600 14px Orbitron, sans-serif";
      ctx.fillText("Play games to populate your score timeline", pad.left + 10, pad.top + chartH / 2);
      return;
    }

    const rawScores = rows.map((row) => Math.max(0, Number(row.score || 0)));
    const observedMax = rawScores.reduce((max, score) => Math.max(max, score), 0);
    const axisMax = Math.max(100, Math.ceil(observedMax / 20) * 20);

    ctx.fillStyle = "#60739a";
    ctx.font = "11px JetBrains Mono, monospace";
    for (let i = 0; i <= 5; i += 1) {
      const value = String(Math.round(axisMax - ((axisMax * i) / 5)));
      const y = pad.top + (chartH * i) / 5 + 4;
      ctx.fillText(value, 6, y);
    }

    const points = rows.map((row, idx) => {
      const x = pad.left + (idx / Math.max(rows.length - 1, 1)) * chartW;
      const score = Math.max(0, Number(row.score || 0));
      const y = pad.top + chartH - (Math.min(score, axisMax) / axisMax) * chartH;
      return { x, y, score };
    });

    const gradient = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
    gradient.addColorStop(0, "rgba(45,122,247,0.35)");
    gradient.addColorStop(1, "rgba(45,122,247,0.02)");

    ctx.beginPath();
    ctx.moveTo(points[0].x, pad.top + chartH);
    points.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, pad.top + chartH);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.strokeStyle = "#2f7cf6";
    ctx.lineWidth = 2;
    ctx.stroke();

    points.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#2f7cf6";
      ctx.fill();
    });
  }

  async function loadBoard() {
    const user = getSessionUserSafe();
    const gameKey = String(gameFilter?.value || "all");
    if (!user?.email) {
      clearBoard("Login required for leaderboard");
      return;
    }

    try {
      const qs = new URLSearchParams({ email: user.email, gameKey });
      const res = await fetch(`/api/game-score/board?${qs.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        clearBoard(data.message || "Failed to load leaderboard");
        return;
      }

      const summary = data.summary || {};
      runsEl.textContent = String(summary.runs || 0);
      avgEl.textContent = String(summary.avgScore || 0);
      bestEl.textContent = String(summary.bestScore || 0);
      gamesEl.textContent = String(summary.gamesPlayed || 0);
      chartHintEl.textContent = `${formatGameName(gameKey)} | Latest ${Array.isArray(data.history) ? data.history.length : 0} runs`;

      lastHistory = Array.isArray(data.history) ? data.history : [];
      const leaderboardRows = Array.isArray(data.leaderboard) ? data.leaderboard : [];
      lastPlayers = leaderboardRows;
      drawChart(lastHistory, leaderboardRows);

      if (leaderboardRows.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5">No leaderboard records yet.</td></tr>';
      } else {
        tableBody.innerHTML = leaderboardRows.map((row, idx) => `
          <tr>
            <td>#${idx + 1}</td>
            <td>${String(row.username || row.userName || "Unknown")}</td>
            <td>${Number(row.avgScore || 0)}</td>
            <td>${Number(row.bestScore || 0)}</td>
            <td>${Number(row.runs || 0)}</td>
          </tr>
        `).join("");
      }

      const recentRows = Array.isArray(data.recent) ? data.recent : [];
      if (recentRows.length === 0) {
        recentBody.innerHTML = '<tr><td colspan="5">No runs logged yet.</td></tr>';
      } else {
        recentBody.innerHTML = recentRows.map((row) => `
          <tr>
            <td>${String(row.username || row.userName || "Unknown")}</td>
            <td>${formatGameName(row.gameKey)}</td>
            <td>${Number(row.score || 0)}</td>
            <td>${Number(row.accuracy || 0)}%</td>
            <td>${formatTime(row.createdAt)}</td>
          </tr>
        `).join("");
      }
    } catch {
      clearBoard("Server not reachable for leaderboard");
    }
  }

  function showLeaderboardTab() {
    if (!hasAdminAccess()) {
      leaderboardSection.classList.remove("active");
      return;
    }
    topTabs.forEach((btn) => btn.classList.remove("active"));
    leaderboardTab.classList.add("active");
    panelSections.forEach((section) => section.classList.remove("active"));
    leaderboardSection.classList.add("active");
    loadBoard();
  }

  if (!hasAdminAccess()) {
    leaderboardTab.style.display = "none";
    leaderboardTab.hidden = true;
    leaderboardSection.classList.remove("active");
    return;
  }

  const originalSetMainTab = window.setMainTab;
  if (typeof originalSetMainTab === "function") {
    window.setMainTab = function patchedSetMainTab(tab) {
      originalSetMainTab(tab);
      if (tab === "leaderboard") {
        showLeaderboardTab();
      } else {
        leaderboardTab.classList.toggle("active", false);
        leaderboardSection.classList.remove("active");
      }
    };
  }

  const originalShowScoreBoard = window.showScoreBoard;
  const originalShowLeaderboard = window.showLeaderboard;
  window.showScoreBoard = function patchedShowScoreBoard() {
    showLeaderboardTab();
    return typeof originalShowScoreBoard === "function" ? undefined : undefined;
  };
  window.showLeaderboard = function patchedShowLeaderboard() {
    showLeaderboardTab();
    return typeof originalShowLeaderboard === "function" ? undefined : undefined;
  };

  leaderboardTab.addEventListener("click", showLeaderboardTab);
  if (gameFilter) gameFilter.addEventListener("change", loadBoard);
  window.addEventListener("resize", () => drawChart(lastHistory, lastPlayers));

  setTimeout(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("view") === "dashboard" && params.get("tab") === "leaderboard") {
      const target = params.get("game") || "all";
      if (gameFilter) gameFilter.value = gameNames[target] ? target : "all";
      showLeaderboardTab();
    }
  }, 120);
})();




