require("dotenv").config();
const axios = require("axios");
const path = require("path");
const fs = require("fs/promises");
const crypto = require("crypto");
const dns = require("dns/promises");
const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const analyzeUrlWithRules = require("./analyzer");
const analyzeRouter = require("./routes/analyze");
const whois = require("whois");

function extractCreationDateFromWhois(raw) {
  const text = String(raw || "");
  if (!text) return "";
  const patterns = [
    /^Creation Date:\s*(.+)$/im,
    /^Created On:\s*(.+)$/im,
    /^Created:\s*(.+)$/im,
    /^Domain Registration Date:\s*(.+)$/im,
    /^Registered On:\s*(.+)$/im,
    /^Reg Date:\s*(.+)$/im
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  return "";
}

function extractRegistrarFromWhois(raw) {
  const text = String(raw || "");
  if (!text) return "";
  const patterns = [
    /^Registrar:\s*(.+)$/im,
    /^Registrar Name:\s*(.+)$/im,
    /^Sponsoring Registrar:\s*(.+)$/im
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  return "";
}

function parseMysqlConnectionUrl(rawValue) {
  const raw = String(rawValue || "").trim();
  if (!raw) return {};
  try {
    const parsed = new URL(raw);
    return {
      host: parsed.hostname || "",
      port: parsed.port ? Number(parsed.port) : undefined,
      user: parsed.username ? decodeURIComponent(parsed.username) : "",
      password: parsed.password ? decodeURIComponent(parsed.password) : "",
      database: parsed.pathname ? decodeURIComponent(parsed.pathname.replace(/^\/+/, "")) : ""
    };
  } catch {
    return {};
  }
}

const app = express();
const staticDataDir = path.join(__dirname, "data");
const runtimeDataDir = path.resolve(process.env.APP_DATA_DIR || staticDataDir);
const analyzerCsvPath = path.join(runtimeDataDir, "analyzer_logs.csv");
const analyzerJsonPath = path.join(runtimeDataDir, "analyzer_logs.json");
const analyzerCsvHeader = "timestamp,type,origin,user_name,user_email,details,risk_score,safe_score,confidence,risk_level\n";
const agentCasesJsonPath = path.join(runtimeDataDir, "agent_cases.json");
const adminExportKey = String(process.env.ADMIN_EXPORT_KEY || "").trim();
const appAdminEmail = String(process.env.APP_ADMIN_EMAIL || "").trim().toLowerCase();
const appAdminPassword = String(process.env.APP_ADMIN_PASSWORD || "").trim();
const hasConfiguredAdminCredentials = Boolean(appAdminEmail && appAdminPassword);
const hasAdminExportKey = Boolean(adminExportKey);
const askAiProvider = String(process.env.ASKAI_PROVIDER || "ollama").trim().toLowerCase();
const analyzerAiProvider = String(process.env.ANALYZER_AI_PROVIDER || "ollama").trim().toLowerCase();
const googleSafeBrowsingApiKey = (process.env.GOOGLE_SAFE_BROWSING_API_KEY || "").trim();
const googleSafeBrowsingApiUrl = (process.env.GOOGLE_SAFE_BROWSING_API_URL || "https://safebrowsing.googleapis.com/v4/threatMatches:find").trim();
const abuseIpdbApiKey = (process.env.ABUSEIPDB_API_KEY || "").trim();
const threatApiTimeoutMs = Math.max(2000, Number(process.env.THREAT_API_TIMEOUT_MS || 7000));
const analyzerFastMode = /^(1|true|yes)$/i.test(String(process.env.ANALYZER_FAST_MODE || "").trim());
const analyzerSourceTimeoutMs = Math.max(1200, Number(process.env.ANALYZER_SOURCE_TIMEOUT_MS || 4500));
const analyzerLlmTimeoutMs = Math.max(1200, Number(process.env.ANALYZER_LLM_TIMEOUT_MS || 4500));
const analyzerWhoisTimeoutMs = Math.max(1200, Number(process.env.ANALYZER_WHOIS_TIMEOUT_MS || 3000));
const threatIntelRealtime = /^(1|true|yes)$/i.test(String(process.env.THREAT_INTEL_REALTIME || "").trim());
const threatIntelStrictMode = /^(1|true|yes)$/i.test(String(process.env.THREAT_INTEL_STRICT_MODE || "").trim());
const agentMaxSteps = Math.max(3, Math.min(8, Number(process.env.AGENT_MAX_STEPS || 6)));
const agentToolTimeoutMs = Math.max(3000, Number(process.env.AGENT_TOOL_TIMEOUT_MS || 12000));
const agentRateWindowMs = 60 * 1000;
const agentRateLimitPerWindow = Math.max(2, Number(process.env.AGENT_RATE_LIMIT || 8));
const phishingQuestions = new Map();
const phishingTimelineRuns = new Map();
const passwordQuestions = new Map();
const safeLinkQuestions = new Map();
const malwareQuestions = new Map();
const malwareChainRuns = new Map();
const PHISHING_TTL_MS = 20 * 60 * 1000;
const agentRateWindowByEmail = new Map();

const agentAnalysisTimeoutMs = Math.max(
  agentToolTimeoutMs,
  analyzerLlmTimeoutMs + 2000,
  analyzerSourceTimeoutMs + 2000
);


const allowedGameKeys = new Set([
  "url",
  "apk",
  "email",
  "password",
  "social-engineering",
  "incident-response"
]);
const usersTable = "users";
const loginAuditTable = "login_audit";
const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
const disposableEmailDomains = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "10minutemail.com",
  "tempmail.com",
  "yopmail.com",
  "trashmail.com"
]);
const dbConnectionConfig = parseMysqlConnectionUrl(process.env.MYSQL_URL || process.env.DATABASE_URL || "");
const dbHost = process.env.DB_HOST || process.env.MYSQLHOST || dbConnectionConfig.host || "localhost";
const dbPort = Number(process.env.DB_PORT || process.env.MYSQLPORT || dbConnectionConfig.port || 3306);
const dbUser = process.env.DB_USER || process.env.MYSQLUSER || dbConnectionConfig.user || "root";
const dbPassword = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || dbConnectionConfig.password || "";
const dbName = process.env.DB_NAME || process.env.MYSQLDATABASE || dbConnectionConfig.database || "indexdb";
const dbAutoCreate = !/^(0|false|no)$/i.test(String(process.env.DB_AUTO_CREATE || "").trim());

function isAdminEmail(email) {
  return hasConfiguredAdminCredentials && String(email || "").trim().toLowerCase() === appAdminEmail;
}

function isAdminLogin(email, password) {
  return isAdminEmail(email) && String(password || "") === appAdminPassword;
}

function hasValidAdminExportKey(key) {
  return hasAdminExportKey && String(key || "").trim() === adminExportKey;
}

const bootstrapPool = mysql.createPool({
  host: dbHost,
  port: dbPort,
  user: dbUser,
  password: dbPassword,
  waitForConnections: true,
  connectionLimit: 2,
  queueLimit: 0
});

const pool = mysql.createPool({
  host: dbHost,
  port: dbPort,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function ensureDatabaseExists() {
  try {
    if (dbAutoCreate && dbName) {
      await bootstrapPool.query("CREATE DATABASE IF NOT EXISTS ??", [dbName]);
    }
  } finally {
    await bootstrapPool.end();
  }
}

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/assets", express.static(path.join(__dirname, "assets")));
app.use("/css", express.static(path.join(__dirname, "css")));
app.use("/js", express.static(path.join(__dirname, "js")));
app.use("/game", express.static(path.join(__dirname, "game")));
app.use("/html", express.static(path.join(__dirname, "html")));
app.use("/", analyzeRouter);

app.use((req, res, next) => {
  if (req.path === "/phishing-hunter" || req.path.startsWith("/api/game/")) {
    return res.status(404).json({ message: "Game module has been removed from this project." });
  }
  return next();
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "html", "index1.html"));
});
app.get("/index.html", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
app.get("/index1.html", (_req, res) => {
  res.sendFile(path.join(__dirname, "index1.html"));
});
app.get("/url-challenge", (_req, res) => {
  res.sendFile(path.join(__dirname, "game", "url-challenge-cybear.html"));
});
app.get("/apk-challenge", (_req, res) => {
  res.sendFile(path.join(__dirname, "game", "apk.html"));
});
app.get("/email-challenge", (_req, res) => {
  res.sendFile(path.join(__dirname, "game", "email.html"));
});
app.get("/password-challenge", (_req, res) => {
  res.sendFile(path.join(__dirname, "game", "password.html"));
});
app.get("/social-engineering-challenge", (_req, res) => {
  res.sendFile(path.join(__dirname, "game", "social-engineering.html"));
});
app.get("/incident-response-challenge", (_req, res) => {
  res.sendFile(path.join(__dirname, "game", "incident-response.html"));
});
async function ensureUsersTable() {
  const createSql = `
    CREATE TABLE IF NOT EXISTS \`${usersTable}\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(120),
      name VARCHAR(120),
      email VARCHAR(190),
      password VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await pool.query(createSql);

  const [existingColumns] = await pool.query(`SHOW COLUMNS FROM \`${usersTable}\``);
  const existing = new Set(existingColumns.map((c) => c.Field.toLowerCase()));
  if (!existing.has("username")) {
    await pool.query(`ALTER TABLE \`${usersTable}\` ADD COLUMN username VARCHAR(120)`);
  }
  if (!existing.has("name")) {
    await pool.query(`ALTER TABLE \`${usersTable}\` ADD COLUMN name VARCHAR(120)`);
  }
  if (!existing.has("email")) {
    await pool.query(`ALTER TABLE \`${usersTable}\` ADD COLUMN email VARCHAR(190)`);
  }
  if (!existing.has("password")) {
    await pool.query(`ALTER TABLE \`${usersTable}\` ADD COLUMN password VARCHAR(255)`);
  }
  if (!existing.has("created_at")) {
    await pool.query(`ALTER TABLE \`${usersTable}\` ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
  }

  const [indexes] = await pool.query(`SHOW INDEX FROM \`${usersTable}\` WHERE Key_name = 'ux_users_email'`);
  if (indexes.length === 0) {
    try {
      await pool.query(`CREATE UNIQUE INDEX ux_users_email ON \`${usersTable}\` (email)`);
    } catch (err) {
      // If duplicate emails already exist in old data, app-level checks still prevent new duplicates.
      if (err.code !== "ER_DUP_ENTRY") {
        throw err;
      }
    }
  }
}

async function ensureLoginAuditTable() {
  const createSql = `
    CREATE TABLE IF NOT EXISTS \`${loginAuditTable}\` (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      user_email VARCHAR(190) NOT NULL,
      user_name VARCHAR(120),
      ip_address VARCHAR(64),
      forwarded_for VARCHAR(255),
      request_origin VARCHAR(255),
      user_agent VARCHAR(255),
      login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      user_login_date DATE NULL,
      user_login_time TIME NULL,
      user_timezone VARCHAR(80) NULL,
      INDEX idx_login_audit_user_email (user_email),
      INDEX idx_login_audit_login_at (login_at)
    )
  `;
  await pool.query(createSql);

  const [existingColumns] = await pool.query(`SHOW COLUMNS FROM \`${loginAuditTable}\``);
  const existingSet = new Set(existingColumns.map((c) => String(c.Field || "").toLowerCase()));

  if (!existingSet.has("user_login_date")) {
    await pool.query(`ALTER TABLE \`${loginAuditTable}\` ADD COLUMN user_login_date DATE NULL`);
  }
  if (!existingSet.has("user_login_time")) {
    await pool.query(`ALTER TABLE \`${loginAuditTable}\` ADD COLUMN user_login_time TIME NULL`);
  }
  if (!existingSet.has("user_timezone")) {
    await pool.query(`ALTER TABLE \`${loginAuditTable}\` ADD COLUMN user_timezone VARCHAR(80) NULL`);
  }
}

function getRequestIp(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "").trim();
  const firstForwardedIp = forwarded.split(",")[0].trim();
  const rawIp = firstForwardedIp || req.socket?.remoteAddress || "";
  if (rawIp.startsWith("::ffff:")) {
    return rawIp.slice(7);
  }
  return rawIp;
}

function parseUserLoginMeta(loginMeta) {
  const rawDate = String(loginMeta?.clientLoginDate || "").trim();
  const rawTime = String(loginMeta?.clientLoginTime || "").trim();
  const rawTz = String(loginMeta?.clientTimeZone || "").trim();

  const isDateValid = /^\d{4}-\d{2}-\d{2}$/.test(rawDate);
  const isTimeValid = /^\d{2}:\d{2}:\d{2}$/.test(rawTime);

  return {
    userLoginDate: isDateValid ? rawDate : null,
    userLoginTime: isTimeValid ? rawTime : null,
    userTimezone: rawTz ? rawTz.slice(0, 80) : null
  };
}

async function recordLoginAudit(req, user, loginMeta = {}) {
  const forwardedFor = String(req.headers["x-forwarded-for"] || "").slice(0, 255);
  const requestOrigin = String(req.headers.origin || req.headers.referer || "").slice(0, 255);
  const userAgent = String(req.headers["user-agent"] || "").slice(0, 255);
  const ipAddress = getRequestIp(req).slice(0, 64);
  const userName = String(user.name || user.username || "").slice(0, 120);
  const { userLoginDate, userLoginTime, userTimezone } = parseUserLoginMeta(loginMeta);

  await pool.query(
    `INSERT INTO \`${loginAuditTable}\`
      (user_id, user_email, user_name, ip_address, forwarded_for, request_origin, user_agent, user_login_date, user_login_time, user_timezone)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user.id ?? null,
      String(user.email || "").toLowerCase(),
      userName,
      ipAddress,
      forwardedFor,
      requestOrigin,
      userAgent,
      userLoginDate,
      userLoginTime,
      userTimezone
    ]
  );
}

async function recordLoginAuditSafe(req, user, loginMeta = {}) {
  try {
    await recordLoginAudit(req, user, loginMeta);
  } catch (err) {
    if (err?.code === "ER_NO_SUCH_TABLE") {
      try {
        await ensureLoginAuditTable();
        await recordLoginAudit(req, user, loginMeta);
        return;
      } catch (retryErr) {
        console.error("Login audit retry failed:", retryErr.code || "UNKNOWN", retryErr.message || "");
        return;
      }
    }
    console.error("Login audit failed:", err.code || "UNKNOWN", err.message || "");
  }
}

function isEmailFormatValid(email) {
  return emailRegex.test(String(email || "").trim());
}

function isDisposableEmailDomain(email) {
  const domain = String(email || "").split("@")[1] || "";
  return disposableEmailDomains.has(domain.toLowerCase());
}

async function hasMxRecords(email) {
  const domain = String(email || "").split("@")[1] || "";
  if (!domain) return false;
  try {
    const records = await dns.resolveMx(domain);
    return Array.isArray(records) && records.length > 0;
  } catch (err) {
    const code = String(err?.code || "").toUpperCase();
    const hardInvalidCodes = new Set(["ENOTFOUND", "ENODATA", "EAI_NONAME", "EBADNAME"]);
    if (hardInvalidCodes.has(code)) {
      return false;
    }
  }

  // Fallback: some valid domains rely on A/AAAA routing instead of explicit MX.
  try {
    const [aResult, aaaaResult] = await Promise.allSettled([
      dns.resolve4(domain),
      dns.resolve6(domain)
    ]);
    const hasA = aResult.status === "fulfilled" && Array.isArray(aResult.value) && aResult.value.length > 0;
    const hasAAAA = aaaaResult.status === "fulfilled" && Array.isArray(aaaaResult.value) && aaaaResult.value.length > 0;
    if (hasA || hasAAAA) {
      return true;
    }
  } catch {
    // no-op
  }

  return false;
}

async function ensureGameScoresTable() {
  const createSql = `
    CREATE TABLE IF NOT EXISTS game_scores (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_name VARCHAR(120) NOT NULL,
      user_email VARCHAR(190) NOT NULL,
      game_key VARCHAR(64) NOT NULL,
      score INT NOT NULL,
      accuracy DECIMAL(5,2) NOT NULL DEFAULT 0,
      correct_count INT NOT NULL DEFAULT 0,
      total_questions INT NOT NULL DEFAULT 0,
      duration_seconds INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_game_scores_game_key (game_key),
      INDEX idx_game_scores_user_email (user_email),
      INDEX idx_game_scores_created_at (created_at)
    )
  `;
  await pool.query(createSql);
}

async function ensureLeaderboardTable() {
  const createSql = `
    CREATE TABLE IF NOT EXISTS leaderboard (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) NOT NULL,
      email VARCHAR(150),
      score INT DEFAULT 0,
      scans_completed INT DEFAULT 0,
      threats_detected INT DEFAULT 0,
      source_game_score_id BIGINT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await pool.query(createSql);

  const [existingColumns] = await pool.query("SHOW COLUMNS FROM leaderboard");
  const columnSet = new Set((existingColumns || []).map((c) => String(c.Field || "").toLowerCase()));
  if (!columnSet.has("source_game_score_id")) {
    await pool.query("ALTER TABLE leaderboard ADD COLUMN source_game_score_id BIGINT NULL");
  }

  const [emailIndexes] = await pool.query("SHOW INDEX FROM leaderboard WHERE Key_name = 'ux_leaderboard_email'");
  if ((emailIndexes || []).length > 0) {
    try {
      await pool.query("DROP INDEX ux_leaderboard_email ON leaderboard");
    } catch (err) {
      if (err?.code !== "ER_CANT_DROP_FIELD_OR_KEY" && err?.code !== "ER_DROP_INDEX_FK") {
        throw err;
      }
    }
  }

  const [sourceIndexes] = await pool.query("SHOW INDEX FROM leaderboard WHERE Key_name = 'ux_leaderboard_source_game_score_id'");
  if ((sourceIndexes || []).length === 0) {
    await pool.query("CREATE UNIQUE INDEX ux_leaderboard_source_game_score_id ON leaderboard (source_game_score_id)");
  }
}

async function backfillLeaderboardFromGameScores() {
  try {
    await pool.query(
      `INSERT INTO leaderboard (username, email, score, scans_completed, threats_detected, source_game_score_id, created_at)
       SELECT
         COALESCE(NULLIF(u.username, ""), NULLIF(gs.user_name, ""), "User") AS username,
         gs.user_email AS email,
         COALESCE(gs.score, 0) AS score,
         COALESCE(gs.total_questions, 0) AS scans_completed,
         COALESCE(gs.correct_count, 0) AS threats_detected,
         gs.id AS source_game_score_id,
         gs.created_at AS created_at
       FROM game_scores gs
       LEFT JOIN \`${usersTable}\` u ON LOWER(COALESCE(u.email, "")) = gs.user_email
       LEFT JOIN leaderboard lb ON lb.source_game_score_id = gs.id
       WHERE gs.user_email IS NOT NULL AND gs.user_email <> ""
         AND lb.id IS NULL
       ORDER BY gs.created_at ASC`
    );
  } catch (err) {
    console.error("leaderboard backfill failed:", err.code || "UNKNOWN", err.message || "");
  }
}

async function ensureAnalysisHistoryTable() {
  const createSql = `
    CREATE TABLE IF NOT EXISTS analysis_history (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      type VARCHAR(32) NOT NULL,
      input_data LONGTEXT NOT NULL,
      result LONGTEXT NOT NULL,
      risk_score INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_analysis_history_type (type),
      INDEX idx_analysis_history_created_at (created_at)
    )
  `;
  await pool.query(createSql);
}

async function saveAnalysisHistory(type, inputData, result, riskScore) {
  await pool.query(
    `INSERT INTO analysis_history (type, input_data, result, risk_score)
     VALUES (?, ?, ?, ?)`,
    [
      String(type || "").trim().toLowerCase(),
      JSON.stringify(inputData ?? {}),
      JSON.stringify(result ?? {}),
      Number(riskScore || 0)
    ]
  );
}

async function saveAnalysisHistorySafe(type, inputData, result, riskScore) {
  try {
    await saveAnalysisHistory(type, inputData, result, riskScore);
  } catch (err) {
    if (err?.code === "ER_NO_SUCH_TABLE") {
      try {
        await ensureAnalysisHistoryTable();
        await saveAnalysisHistory(type, inputData, result, riskScore);
        return;
      } catch (retryErr) {
        console.error("analysis_history retry failed:", retryErr.code || "UNKNOWN", retryErr.message || "");
        return;
      }
    }
    console.error("analysis_history save failed:", err.code || "UNKNOWN", err.message || "");
  }
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function generateLogId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

async function readAnalyzerLogs() {
  const raw = await fs.readFile(analyzerJsonPath, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed;
}

async function writeAnalyzerLogs(logs) {
  await fs.writeFile(analyzerJsonPath, JSON.stringify(logs), "utf8");
  const lines = logs.map((entry) => [
    entry.timestamp,
    entry.type,
    normalizeAnalyzerOrigin(entry.origin),
    entry.user_name,
    entry.user_email,
    entry.details,
    entry.risk_score ?? entry.riskScore ?? "",
    entry.safe_score ?? entry.safeScore ?? "",
    entry.confidence ?? "",
    entry.risk_level ?? entry.riskLevel ?? ""
  ].map(csvEscape).join(","));
  const content = analyzerCsvHeader + (lines.length ? `${lines.join("\n")}\n` : "");
  await fs.writeFile(analyzerCsvPath, content, "utf8");
}

function normalizeUserEmail(email) {
  const value = String(email || "").trim().toLowerCase();
  return value || "guest@local";
}

function normalizeAnalyzerOrigin(origin) {
  const value = String(origin || "").trim().toLowerCase();
  if (!value) return "website";
  if (["cursor", "hover", "tbyc", "think-before", "thinkbefore", "extension"].includes(value)) return "cursor";
  if (["website", "web", "site", "dashboard", "app"].includes(value)) return "website";
  return value === "cursor" ? "cursor" : "website";
}

function normalizePercent(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function normalizeUrl(raw) {
  const input = String(raw || "").trim();
  if (!input) return null;
  try {
    return new URL(input);
  } catch {
    try {
      return new URL(`https://${input}`);
    } catch {
      return null;
    }
  }
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function normalizeRiskShape(input, fallback) {
  const riskScore = clampPercent(input?.riskScore);
  const confidence = clampPercent(input?.confidence);
  const riskLevelRaw = String(input?.riskLevel || "").toLowerCase();
  const riskLevel = ["low", "medium", "high"].includes(riskLevelRaw)
    ? riskLevelRaw
    : (riskScore >= 70 ? "high" : riskScore >= 40 ? "medium" : "low");
  const summary = String(input?.summary || fallback.summary || "").slice(0, 280);
  const factors = Array.isArray(input?.factors) && input.factors.length > 0
    ? input.factors.slice(0, 6).map((f) => ({
      name: String(f?.name || "Signal").slice(0, 60),
      score: clampPercent(f?.score)
    }))
    : (fallback.factors || []);

  return {
    riskScore: riskScore || fallback.riskScore || 0,
    confidence: confidence || fallback.confidence || 0,
    riskLevel,
    summary,
    factors
  };
}

function extractFirstJsonObject(text) {
  const raw = String(text || "").trim();
  if (!raw) return null;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end < 0 || end <= start) return null;
  const candidate = raw.slice(start, end + 1);
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

async function tryOllamaJson(prompt, systemMessage) {
  const ollamaModel = (process.env.OLLAMA_MODEL || "mistral").trim();
  try {
    const raw = await runOllamaChatReply(
      prompt,
      ollamaModel,
      systemMessage || "Return strict JSON only."
    );
    return extractFirstJsonObject(raw || "");
  } catch {
    return null;
  }
}

async function tryOllamaRiskAssessment(prompt, fallback) {
  const ollamaModel = (process.env.OLLAMA_MODEL || "mistral").trim();
  const jsonPredict = Math.max(30, Number(process.env.OLLAMA_JSON_PREDICT || 120));
  const jsonTimeoutMs = Math.max(
    4000,
    Math.min(analyzerLlmTimeoutMs, Number(process.env.OLLAMA_JSON_TIMEOUT_MS || 15000))
  );
  const quickTimeoutMs = Math.max(
    3000,
    Math.min(analyzerLlmTimeoutMs, Number(process.env.OLLAMA_QUICK_TIMEOUT_MS || 8000))
  );
  try {
    const raw = await withToolTimeout(
      runOllamaChatReply(
        prompt,
        ollamaModel,
        "You are a cybersecurity risk analyzer. Return strict JSON only with keys: riskScore, confidence, riskLevel, summary, factors.",
        { format: "json", numPredict: jsonPredict, temperature: 0.1, timeoutMs: jsonTimeoutMs + 2000 }
      ),
      jsonTimeoutMs,
      "ollama-json"
    );
    const parsed = extractFirstJsonObject(raw || "");
    if (parsed) return normalizeRiskShape(parsed, fallback);
  } catch {
    // fall through to quick fallback
  }

  try {
    const shortPrompt = `
Return only a single number from 0 to 100 for riskScore.
Input:
${String(prompt || "").slice(0, 600)}
    `.trim();
    const quickRaw = await runOllamaChatReply(
      shortPrompt,
      ollamaModel,
      "Return only a number between 0 and 100.",
      { numPredict: 16, numCtx: 512, temperature: 0.1, maxInputChars: 700, timeoutMs: quickTimeoutMs }
    );
    const match = String(quickRaw || "").match(/\d{1,3}/);
    if (!match) return null;
    const score = clampPercent(Number(match[0]));
    return normalizeRiskShape({
      riskScore: score,
      confidence: 55,
      riskLevel: score >= 70 ? "high" : score >= 40 ? "medium" : "low",
      summary: "LLM quick risk estimate.",
      factors: []
    }, fallback);
  } catch {
    return null;
  }
}

async function callLlmRiskAssessment(prompt, fallback) {
  const ollamaResult = await tryOllamaRiskAssessment(prompt, fallback);
  return ollamaResult || fallback;
}

function adjustBlendWeight(primary, secondary, baseWeight) {
  const primaryConf = clampPercent(primary?.confidence);
  const secondaryConf = clampPercent(secondary?.confidence);
  if (!primaryConf && !secondaryConf) return baseWeight;
  const delta = (primaryConf - secondaryConf) / 100;
  const adjusted = baseWeight + (delta * 0.2);
  return Math.max(0.45, Math.min(0.85, adjusted));
}

function blendRisk(primary, secondary, primaryWeight = 0.65) {
  const weight = adjustBlendWeight(primary, secondary, primaryWeight);
  const secondaryWeight = 1 - weight;
  const riskScore = clampPercent((primary.riskScore * weight) + (secondary.riskScore * secondaryWeight));
  const confidence = clampPercent((primary.confidence * weight) + (secondary.confidence * secondaryWeight));
  const riskLevel = riskScore >= 70 ? "high" : riskScore >= 40 ? "medium" : "low";

  const primaryFactors = Array.isArray(primary.factors) ? primary.factors : [];
  const secondaryFactors = Array.isArray(secondary.factors) ? secondary.factors : [];
  const secondaryMap = new Map(secondaryFactors.map((f) => [String(f.name).toLowerCase(), f]));
  const merged = primaryFactors.map((f) => {
    const match = secondaryMap.get(String(f.name).toLowerCase());
    return {
      name: f.name,
      score: clampPercent((f.score * weight) + ((match?.score || 0) * secondaryWeight))
    };
  });
  for (const s of secondaryFactors) {
    if (!primaryFactors.some((p) => String(p.name).toLowerCase() === String(s.name).toLowerCase())) {
      merged.push({
        name: s.name,
        score: clampPercent(s.score)
      });
    }
  }

  return {
    riskScore,
    confidence,
    riskLevel,
    summary: primary.summary || secondary.summary || "Risk analysis completed.",
    factors: merged.length ? merged.slice(0, 6) : (primary.factors || secondary.factors || [])
  };
}

async function fetchWithTimeout(url, options = {}, timeoutMs = threatApiTimeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function googleCheck(url) {
  const response = await axios.post(
    `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${process.env.GOOGLE_SAFE_BROWSING_API_KEY}`,
    {
      client: {
        clientId: "cyber-shield",
        clientVersion: "1.0"
      },
      threatInfo: {
        threatTypes: ["MALWARE", "SOCIAL_ENGINEERING"],
        platformTypes: ["ANY_PLATFORM"],
        threatEntryTypes: ["URL"],
        threatEntries: [{ url }]
      }
    }
  );

  return response.data;
}
async function aiAnalysis(scanData) {
  const prompt = `
You are a cybersecurity expert.

Analyze the following scan results and return:

1. Risk Score (0-100)
2. Threat Type
3. Short Explanation

Scan Data:
${JSON.stringify(scanData)}
`;
  const ollamaModel = (process.env.OLLAMA_MODEL || "mistral").trim();
  return runOllamaChatReply(prompt, ollamaModel, "You are a cybersecurity expert.");
}

async function checkPhishTank(url) {
  const axios = require("axios");

  const response = await axios.post(
    "https://checkurl.phishtank.com/checkurl/",
    `url=${encodeURIComponent(url)}&format=json`,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    }
  );

  return response.data;
}

async function checkURLHaus(url) {
  const axios = require("axios");

  const response = await axios.post(
    "https://urlhaus-api.abuse.ch/v1/url/",
    { url: url }
  );

  return response.data;
}

async function aiDecision(data) {
  const ollamaModel = (process.env.OLLAMA_MODEL || "mistral").trim();
  const prompt = `Analyze this security scan and return a risk score 0-100:\n\n${JSON.stringify(data)}`;
  return runOllamaChatReply(prompt, ollamaModel, "You are a cybersecurity analyst. Give a short answer.");
}

async function explainDangerousUrl(url) {
  const ollamaModel = (process.env.OLLAMA_MODEL || "mistral").trim();
  const prompt = `Explain why this URL is dangerous:\n\n${url}`;
  return runOllamaChatReply(prompt, ollamaModel, "You are a cybersecurity assistant. Explain simply.");
}

async function checkIP(ip) {
  const axios = require("axios");

  const response = await axios.get(
    `https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}`,
    {
      headers: {
        Key: process.env.ABUSEIPDB_API_KEY,
        Accept: "application/json"
      }
    }
  );

  return response.data;
}

async function checkOpenPhish(url) {
  const axios = require("axios");

  const response = await axios.get(
    "https://openphish.com/feed.txt"
  );

  const phishingList = response.data.split("\n");

  return phishingList.includes(url);
}

async function threatAnalyzer(url) {
  const [phishTank, urlHaus, google] = await Promise.all([
    checkPhishTank(url),
    checkURLHaus(url),
    googleCheck(url)
  ]);

  return {
    phishTank,
    urlHaus,
    google
  };
}

function urlPatternAgent(url) {
  const input = String(url || "").trim();
  const parsed = normalizeUrl(input);
  const value = parsed ? `${parsed.hostname}${parsed.pathname}${parsed.search}`.toLowerCase() : input.toLowerCase();
  let score = 0;
  const reasons = [];

  const suspiciousWords = [
    "login",
    "verify",
    "secure",
    "update",
    "account",
    "bank",
    "paypal",
    "wallet",
    "coin",
    "generator",
    "bonus",
    "reward"
  ];

  suspiciousWords.forEach((word) => {
    if (value.includes(word)) {
      score += 8;
      reasons.push(`Contains suspicious token: ${word}`);
    }
  });

  if (input.includes("@")) {
    score += 20;
    reasons.push("Contains @ character in URL.");
  }
  if (input.includes("-")) {
    score += 5;
    reasons.push("Contains hyphen pattern often used in lookalike domains.");
  }

  if (parsed) {
    const host = String(parsed.hostname || "").toLowerCase();
    const labels = host.split(".").filter(Boolean);
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
      score += 20;
      reasons.push("Uses raw IP address host.");
    }
    if (labels.length > 3) {
      score += 12;
      reasons.push("Excessive subdomain depth.");
    }
    if (host.length > 40) {
      score += 8;
      reasons.push("Unusually long hostname.");
    }
    if (host.includes("xn--")) {
      score += 15;
      reasons.push("Punycode hostname detected.");
    }
    const tld = labels[labels.length - 1] || "";
    if (["zip", "click", "top", "gq", "tk", "rest"].includes(tld)) {
      score += 10;
      reasons.push(`Higher-risk TLD: .${tld}`);
    }
  }

  return { patternScore: clampPercent(score), reasons };
}

async function domainAgent(url) {
  const parsed = normalizeUrl(url);
  if (!parsed) {
    return { domainRisk: 0, reasons: ["Invalid URL format for WHOIS lookup."], domain: "", available: false, ageDays: null };
  }
  const domain = parsed.hostname;

  let risk = 0;
  const reasons = [];
  let ageDays = null;

  if (!whois || typeof whois.lookup !== "function") {
    return {
      domainRisk: 0,
      reasons: ["WHOIS lookup unavailable: dependency could not be loaded."],
      domain,
      available: false,
      ageDays: null
    };
  }

  try {
    const rawData = await new Promise((resolve, reject) => {
      whois.lookup(domain, (err, data) => (err ? reject(err) : resolve(data)));
    });
    const creationRaw = extractCreationDateFromWhois(rawData);
    const registrar = extractRegistrarFromWhois(rawData);

    if (creationRaw) {
      const created = new Date(creationRaw);
      if (!Number.isNaN(created.getTime())) {
        ageDays = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
        if (ageDays < 14) {
          risk += 35;
          reasons.push("Domain is very new (<14 days).");
        } else if (ageDays < 30) {
          risk += 25;
          reasons.push("Domain is new (<30 days).");
        } else if (ageDays < 90) {
          risk += 12;
          reasons.push("Domain age is relatively low (<90 days).");
        }
      }
    }

    if (!registrar) {
      risk += 6;
      reasons.push("Registrar metadata missing in WHOIS.");
    }
  } catch (err) {
    reasons.push(`WHOIS lookup unavailable: ${String(err?.message || err || "lookup failed")}`);
    return {
      domainRisk: 0,
      reasons,
      domain,
      available: false,
      ageDays
    };
  }

  return { domainRisk: clampPercent(risk), reasons, domain, available: true, ageDays };
}

async function threatFeedAgent(url) {
  const [googleRes] = await Promise.allSettled([
    googleCheck(url)
  ]);

  const google = googleRes.status === "fulfilled" ? googleRes.value : null;

  let score = 0;
  const reasons = [];
  const sources = {
    googleSafeBrowsing: { available: googleRes.status === "fulfilled", matches: 0 }
  };

  if (google?.matches?.length) {
    const count = google.matches.length;
    score += Math.min(45, 20 + (count * 8));
    reasons.push(`Google Safe Browsing matched ${count} threat entry(s).`);
    sources.googleSafeBrowsing.matches = count;
  }

  if (googleRes.status === "rejected") {
    reasons.push(`Google Safe Browsing unavailable: ${String(googleRes.reason?.message || googleRes.reason || "request failed")}`);
  }

  return { threatScore: clampPercent(score), reasons, sources };
}

  async function aiReasoner(data) {
    const prompt = `
  You are a cybersecurity AI analyst.
  Use only the provided evidence and output strict JSON.

Return:
{
  "riskScore": 0-100,
  "confidence": 0-100,
  "threatType": "phishing|malware|scam|benign|unknown",
  "explanation": "short explanation",
  "signals": ["signal 1", "signal 2", "signal 3"]
}

Evidence:
${JSON.stringify(data)}
`;
    try {
      const ollamaModel = (process.env.OLLAMA_MODEL || "mistral").trim();
      const jsonPredict = Math.max(30, Number(process.env.OLLAMA_JSON_PREDICT || 120));
      const raw = await runOllamaChatReply(
        prompt,
        ollamaModel,
        "You are a cybersecurity analyst. Return strict JSON only with keys: riskScore, confidence, threatType, explanation, signals.",
        { format: "json", numPredict: jsonPredict, temperature: 0.1 }
      );
    const parsed = extractFirstJsonObject(raw);
    if (!parsed) {
      return {
        available: false,
        riskScore: 0,
        confidence: 0,
        threatType: "unknown",
        explanation: "AI response was not structured JSON.",
        signals: []
      };
    }
    return {
      available: true,
      riskScore: clampPercent(Number(parsed.riskScore || 0)),
      confidence: clampPercent(Number(parsed.confidence || 0)),
      threatType: String(parsed.threatType || "unknown"),
      explanation: String(parsed.explanation || "No explanation"),
      signals: Array.isArray(parsed.signals) ? parsed.signals.map((s) => String(s)).slice(0, 6) : []
    };
  } catch (err) {
    return {
      available: false,
      riskScore: 0,
      confidence: 0,
      threatType: "unknown",
      explanation: `AI analysis unavailable: ${String(err?.message || "Ollama request failed")}`,
      signals: []
    };
  }
}

async function autoAnalyze(url) {
  const results = {};

  results.urlPatterns = urlPatternAgent(url);
  const [domainIntel, threatFeeds] = await Promise.all([
    domainAgent(url),
    threatFeedAgent(url)
  ]);
  results.domainIntel = domainIntel;
  results.threatFeeds = threatFeeds;

  // First-pass deterministic fusion from rule/intel sources.
  const deterministicScore = clampPercent(
    Math.round(
      (results.urlPatterns.patternScore * 0.28) +
      (results.domainIntel.domainRisk * 0.22) +
      (results.threatFeeds.threatScore * 0.50)
    )
  );

  const ai = await aiReasoner({
    url,
    urlPatterns: results.urlPatterns,
    domainIntel: results.domainIntel,
    threatFeeds: results.threatFeeds,
    deterministicScore
  });
  results.aiDecision = ai;

  const aiWeight = ai.available ? 0.35 : 0;
  const finalRiskScore = clampPercent(
    Math.round((deterministicScore * (1 - aiWeight)) + (Number(ai.riskScore || 0) * aiWeight))
  );
  const finalConfidence = clampPercent(
    Math.round(
      55 +
      (results.threatFeeds.sources?.googleSafeBrowsing?.available ? 10 : 0) +
      (ai.available ? Math.min(20, Number(ai.confidence || 0) * 0.2) : 0)
    )
  );

  return {
    ...results,
    deterministicScore,
    finalRiskScore,
    riskLevel: riskLevelFromScore(finalRiskScore),
    confidence: finalConfidence,
    explanation: ai.explanation || "Multi-source analysis completed.",
    threatType: ai.threatType || "unknown",
    evidence: [
      ...(results.urlPatterns.reasons || []),
      ...(results.domainIntel.reasons || []),
      ...(results.threatFeeds.reasons || []),
      ...((ai.signals || []).map((s) => `AI: ${s}`))
    ].slice(0, 12)
  };
}

function detectPhishingPatterns(url) {
  let score = 0;

  if (url.includes("@")) score += 20;
  if (url.includes("-")) score += 10;
  if (url.includes("login")) score += 15;
  if (url.includes("verify")) score += 15;
  if (url.includes("secure")) score += 10;

  const suspiciousDomains = [
    "paypal",
    "bank",
    "amazon",
    "apple",
    "microsoft"
  ];

  suspiciousDomains.forEach((word) => {
    if (url.includes(word) && !url.includes(`${word}.com`)) {
      score += 20;
    }
  });

  return score;
}

async function checkDomainAge(domain) {
  if (!whois || typeof whois.lookup !== "function") return 0;
  const rawData = await new Promise((resolve, reject) => {
    whois.lookup(domain, (err, data) => (err ? reject(err) : resolve(data)));
  });
  const creationRaw = extractCreationDateFromWhois(rawData);

  if (creationRaw) {
    const created = new Date(creationRaw);
    const today = new Date();

    const ageDays = (today - created) / (1000 * 60 * 60 * 24);

    if (ageDays < 30) return 30;
  }

  return 0;
}

function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

async function analyzeURL(url) {
  let score = 0;

  score += detectPhishingPatterns(url);

  const domain = getDomain(url);

  const [domainAgeScore, google] = await Promise.all([
    domain ? checkDomainAge(domain) : Promise.resolve(0),
    googleCheck(url)
  ]);

  score += domainAgeScore;

  if (google.matches) {
    score += 40;
  }

  if (score > 100) score = 100;

  return score;
}

function toBase64UrlNoPadding(input) {
  return Buffer.from(String(input || ""))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function riskLevelFromScore(score) {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

function computeAnalyzerAccuracy(finalRiskLevel, sources) {
  // Repurpose accuracy as a stability metric that improves with reliable sources,
  // agreement between sources, and breadth of coverage.
  if (!sources || typeof sources !== "object") return 0;

  const reliabilityWeights = {
    safeBrowsing: 0.28,
    abuseIpdb: 0.18,
    whois: 0.14,
    ollama: 0.22,
    heuristic: 0.18
  };

  const active = Object.entries(sources)
    .map(([key, src]) => ({ key, src }))
    .filter(({ src }) => src && src.available !== false && Number.isFinite(Number(src.confidence)));

  if (!active.length) return 0;

  let totalWeight = 0;
  let weightedConfidence = 0;
  let weightedRisk = 0;
  let weightedRiskSquares = 0;
  let availableCount = 0;

  for (const { key, src } of active) {
    const weight = reliabilityWeights[key] ?? 0.16;
    const confidence = clampPercent(src.confidence);
    const riskScore = clampPercent(src.riskScore ?? src.risk ?? 0);
    totalWeight += weight;
    weightedConfidence += confidence * weight;
    weightedRisk += riskScore * weight;
    weightedRiskSquares += (riskScore * riskScore) * weight;
    availableCount += 1;
  }

  if (!totalWeight) return 0;

  const avgConfidence = weightedConfidence / totalWeight;
  const avgRisk = weightedRisk / totalWeight;
  const variance = Math.max(0, (weightedRiskSquares / totalWeight) - (avgRisk * avgRisk));
  const stdDev = Math.sqrt(variance);
  const agreementScore = clampPercent(100 - (stdDev * 1.25));

  let coverageScore = 55 + Math.min(32, availableCount * 8);
  if (sources.safeBrowsing?.available) coverageScore += 6;
  if (sources.ollama?.available) coverageScore += 5;
  if (sources.abuseIpdb?.available) coverageScore += 4;
  if (sources.whois?.available) coverageScore += 3;
  coverageScore = clampPercent(coverageScore);

  let accuracy = (avgConfidence * 0.55) + (agreementScore * 0.25) + (coverageScore * 0.20);
  if (agreementScore < 60) accuracy -= 8;
  if (agreementScore < 45) accuracy -= 12;

  const level = String(finalRiskLevel || "").toLowerCase();
  const levelBoost = level === "high" ? 4 : level === "medium" ? 2 : 0;
  return clampPercent(Math.round(accuracy + levelBoost));
}

function buildLlmEvidenceBlock(evidence) {
  if (!evidence || typeof evidence !== "object") return "none";
  const lines = [];
  const urls = Array.isArray(evidence.urls) ? evidence.urls.filter(Boolean).slice(0, 3) : [];
  if (urls.length) {
    lines.push(`URLs: ${urls.join(" | ")}`);
  }
  if (evidence.senderDomain) {
    lines.push(`Sender domain: ${String(evidence.senderDomain).slice(0, 160)}`);
  }
  if (evidence.apkSource) {
    lines.push(`APK source: ${String(evidence.apkSource).slice(0, 160)}`);
  }
  if (evidence.threatUrl) {
    lines.push(`Threat URL: ${String(evidence.threatUrl).slice(0, 200)}`);
  }
  if (evidence.safeBrowsing) {
    const sb = evidence.safeBrowsing;
    const status = sb.available === false ? "unavailable" : (sb.matched ? "match" : "no match");
    lines.push(`Safe Browsing: ${status}. ${String(sb.summary || "").slice(0, 200)}`);
    if (Array.isArray(sb.evidence) && sb.evidence.length) {
      lines.push(`Safe Browsing evidence: ${sb.evidence.slice(0, 2).join(" | ")}`);
    }
  }
  if (evidence.abuseIpdb) {
    const abuse = evidence.abuseIpdb;
    const abuseStatus = abuse.available === false ? "unavailable" : (abuse.matched ? "match" : "no match");
    lines.push(`AbuseIPDB: ${abuseStatus}. ${String(abuse.summary || "").slice(0, 200)}`);
    if (Array.isArray(abuse.evidence) && abuse.evidence.length) {
      lines.push(`AbuseIPDB evidence: ${abuse.evidence.slice(0, 2).join(" | ")}`);
    }
  }
  if (evidence.whois) {
    const whois = evidence.whois;
    const whoisStatus = whois.available === false ? "unavailable" : "available";
    lines.push(`WHOIS: ${whoisStatus}. ${String(whois.summary || "").slice(0, 200)}`);
    if (Array.isArray(whois.evidence) && whois.evidence.length) {
      lines.push(`WHOIS evidence: ${whois.evidence.slice(0, 2).join(" | ")}`);
    }
  }
  if (Array.isArray(evidence.notes) && evidence.notes.length) {
    lines.push(`Notes: ${evidence.notes.slice(0, 3).join(" | ")}`);
  }
  return lines.length ? lines.join("\n") : "none";
}

async function runOllamaUrlAssessment(urlValue, heuristic, evidence = null) {
  const evidenceBlock = buildLlmEvidenceBlock(evidence);
  const prompt = `
  Return strict JSON only:
  {"riskScore":0-100,"confidence":0-100,"riskLevel":"low|medium|high","summary":"<=20 words","factors":[{"name":"factor","score":0-100}]}
  Use only the evidence below. Keep 3-5 factors.
URL: ${urlValue}
Heuristic riskScore: ${heuristic.riskScore}
Heuristic summary: ${heuristic.summary}
Signals: ${Array.isArray(heuristic.signals) ? heuristic.signals.slice(0, 5).join(" | ") : "none"}
Safe signals: ${Array.isArray(heuristic.safeSignals) ? heuristic.safeSignals.slice(0, 3).join(" | ") : "none"}
EVIDENCE:
${evidenceBlock}
    `.trim();

  const labelFor = () => "Ollama URL model";
  const buildSource = (result, label, errorMessage) => {
    if (!result) {
      return {
        source: label,
        available: false,
        matched: false,
        error: errorMessage || "AI source unavailable.",
        riskScore: heuristic.riskScore,
        confidence: 0,
        summary: "AI source unavailable."
      };
    }
    const normalized = normalizeRiskShape(result, heuristic);
    return {
      source: label,
      available: true,
      matched: normalized.riskScore >= 55,
      error: "",
      riskScore: normalized.riskScore,
      confidence: clampPercent(Math.max(normalized.confidence, 55)),
      summary: normalized.summary || "AI phishing risk assessment completed."
    };
  };

  const ollamaResult = await tryOllamaRiskAssessment(prompt, heuristic);
  return buildSource(ollamaResult, labelFor(), "Ollama unavailable.");
}

async function runOllamaApkAssessment(apkValue, sourceValue, heuristic, evidence = null) {
  const apkInput = String(apkValue || "").trim();
  const sourceInput = String(sourceValue || "").trim();
  const evidenceBlock = buildLlmEvidenceBlock(evidence);
  const prompt = `
  Return strict JSON only:
  {"riskScore":0-100,"confidence":0-100,"riskLevel":"low|medium|high","summary":"<=20 words","factors":[{"name":"factor","score":0-100}]}
  Use only the evidence below. Keep 3-5 factors. If evidence is limited, keep confidence modest.
  APK_INPUT: ${apkInput}
  SOURCE: ${sourceInput}
  HEURISTIC_SCORE: ${heuristic.riskScore}
  HEURISTIC_SUMMARY: ${heuristic.summary}
  HEURISTIC_SIGNALS: ${Array.isArray(heuristic.signals) ? heuristic.signals.slice(0, 5).join(" | ") : "none"}
  HEURISTIC_SAFE_SIGNALS: ${Array.isArray(heuristic.safeSignals) ? heuristic.safeSignals.slice(0, 3).join(" | ") : "none"}
  EVIDENCE:
  ${evidenceBlock}
    `.trim();

  const labelFor = () => "Ollama APK model";
  const buildSource = (result, label, errorMessage) => {
    if (!result) {
      return {
        source: label,
        available: false,
        matched: false,
        error: errorMessage || "AI source unavailable.",
        riskScore: heuristic.riskScore,
        confidence: 0,
        summary: "AI source unavailable.",
        factors: []
      };
    }
    const normalized = normalizeRiskShape(result, heuristic);
    return {
      source: label,
      available: true,
      matched: normalized.riskScore >= 55,
      error: "",
      riskScore: normalized.riskScore,
      confidence: clampPercent(Math.max(normalized.confidence, 55)),
      summary: normalized.summary || "AI APK risk assessment completed.",
      factors: Array.isArray(normalized.factors) ? normalized.factors : []
    };
  };

  const ollamaResult = await tryOllamaRiskAssessment(prompt, heuristic);
  return buildSource(ollamaResult, labelFor(), "Ollama unavailable.");
}

async function runOllamaEmailAssessment(emailTextValue, heuristic, evidence = null) {
  const safeText = String(emailTextValue || "");
  const evidenceBlock = buildLlmEvidenceBlock(evidence);
  const prompt = `
  Return strict JSON only:
  {"riskScore":0-100,"confidence":0-100,"riskLevel":"low|medium|high","summary":"<=20 words","factors":[{"name":"factor","score":0-100}]}
  Use only the evidence below. Keep 3-5 factors. If evidence is limited, keep confidence modest.
  EMAIL_TEXT:
  ${safeText.slice(0, 2000)}
  HEURISTIC_SCORE: ${heuristic.riskScore}
  HEURISTIC_SUMMARY: ${heuristic.summary}
  HEURISTIC_SIGNALS: ${Array.isArray(heuristic.signals) ? heuristic.signals.slice(0, 5).join(" | ") : "none"}
  HEURISTIC_SAFE_SIGNALS: ${Array.isArray(heuristic.safeSignals) ? heuristic.safeSignals.slice(0, 3).join(" | ") : "none"}
  EVIDENCE:
  ${evidenceBlock}
    `.trim();

  const labelFor = () => "Ollama email model";
  const buildSource = (result, label, errorMessage) => {
    if (!result) {
      return {
        source: label,
        available: false,
        matched: false,
        error: errorMessage || "AI source unavailable.",
        riskScore: heuristic.riskScore,
        confidence: 0,
        summary: "AI source unavailable.",
        factors: []
      };
    }
    const normalized = normalizeRiskShape(result, heuristic);
    return {
      source: label,
      available: true,
      matched: normalized.riskScore >= 55,
      error: "",
      riskScore: normalized.riskScore,
      confidence: clampPercent(Math.max(normalized.confidence, 55)),
      summary: normalized.summary || "AI email risk assessment completed.",
      factors: Array.isArray(normalized.factors) ? normalized.factors : []
    };
  };

  const ollamaResult = await tryOllamaRiskAssessment(prompt, heuristic);
  return buildSource(ollamaResult, labelFor(), "Ollama unavailable.");
}

async function evaluateGoogleSafeBrowsing(urlValue) {
  const parsed = normalizeUrl(urlValue);
  if (!parsed) {
    return {
      source: "Google Safe Browsing",
      available: false,
      matched: false,
      error: "Invalid URL format",
      riskScore: 0,
      confidence: 0,
      summary: "Safe Browsing skipped."
    };
  }

  if (!googleSafeBrowsingApiKey) {
    return {
      source: "Google Safe Browsing",
      available: false,
      matched: false,
      error: "GOOGLE_SAFE_BROWSING_API_KEY is not configured",
      riskScore: 0,
      confidence: 0,
      summary: "Safe Browsing source unavailable."
    };
  }

  try {
    const endpoint = `${googleSafeBrowsingApiUrl}?key=${encodeURIComponent(googleSafeBrowsingApiKey)}`;
    const response = await fetchWithTimeout(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        client: {
          clientId: "cyber-shield",
          clientVersion: "1.0.0"
        },
        threatInfo: {
          threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
          platformTypes: ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries: [{ url: parsed.href }]
        }
      })
    });

    if (!response.ok) {
      return {
        source: "Google Safe Browsing",
        available: false,
        matched: false,
        error: `Google Safe Browsing status ${response.status}`,
        riskScore: 0,
        confidence: 0,
        summary: "Safe Browsing source unavailable."
      };
    }

    const body = await response.json();
    const matches = Array.isArray(body?.matches) ? body.matches : [];
    if (matches.length === 0) {
      return {
        source: "Google Safe Browsing",
        available: true,
        matched: false,
        error: "",
        riskScore: 8,
        confidence: 80,
        summary: "Google Safe Browsing found no threat match for this URL."
      };
    }

    const threatTypes = matches.map((m) => String(m.threatType || "")).filter(Boolean);
    const hasSocial = threatTypes.includes("SOCIAL_ENGINEERING");
    const hasMalware = threatTypes.includes("MALWARE");
    let riskScore = 88;
    if (hasSocial || hasMalware) riskScore = 95;

    return {
      source: "Google Safe Browsing",
      available: true,
      matched: true,
      error: "",
      riskScore,
      confidence: 94,
      summary: `Google Safe Browsing matched threat types: ${threatTypes.join(", ")}.`
    };
  } catch (err) {
    return {
      source: "Google Safe Browsing",
      available: false,
      matched: false,
      error: String(err?.message || err || "Google Safe Browsing request failed"),
      riskScore: 0,
      confidence: 0,
      summary: "Safe Browsing source unavailable."
    };
  }
}

async function resolveHostToIp(host) {
  const value = String(host || "").trim();
  if (!value) return "";
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(value)) {
    return value;
  }
  try {
    const [v4, v6] = await Promise.allSettled([
      dns.resolve4(value),
      dns.resolve6(value)
    ]);
    if (v4.status === "fulfilled" && Array.isArray(v4.value) && v4.value.length) {
      return v4.value[0];
    }
    if (v6.status === "fulfilled" && Array.isArray(v6.value) && v6.value.length) {
      return v6.value[0];
    }
  } catch {
    // Ignore DNS resolution errors.
  }
  return "";
}

async function evaluateAbuseIpdb(urlValue) {
  const parsed = normalizeUrl(urlValue);
  if (!parsed) {
    return {
      source: "AbuseIPDB IP reputation",
      available: false,
      matched: false,
      error: "Invalid URL format",
      riskScore: 0,
      confidence: 0,
      summary: "AbuseIPDB skipped."
    };
  }

  if (!abuseIpdbApiKey) {
    return {
      source: "AbuseIPDB IP reputation",
      available: false,
      matched: false,
      error: "ABUSEIPDB_API_KEY is not configured",
      riskScore: 0,
      confidence: 0,
      summary: "AbuseIPDB source unavailable."
    };
  }

  const host = parsed.hostname || "";
  const ip = await resolveHostToIp(host);
  if (!ip) {
    return {
      source: "AbuseIPDB IP reputation",
      available: false,
      matched: false,
      error: "Unable to resolve IP for host",
      riskScore: 0,
      confidence: 0,
      summary: "AbuseIPDB skipped."
    };
  }
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(ip) && isPrivateIpv4(ip)) {
    return {
      source: "AbuseIPDB IP reputation",
      available: false,
      matched: false,
      error: "Private IP address skipped",
      riskScore: 0,
      confidence: 0,
      summary: "AbuseIPDB skipped for private IP."
    };
  }

  try {
    const endpoint = `https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(ip)}&maxAgeInDays=90`;
    const response = await fetchWithTimeout(endpoint, {
      headers: {
        Key: abuseIpdbApiKey,
        Accept: "application/json"
      }
    }, analyzerSourceTimeoutMs);
    if (!response.ok) {
      return {
        source: "AbuseIPDB IP reputation",
        available: false,
        matched: false,
        error: `AbuseIPDB status ${response.status}`,
        riskScore: 0,
        confidence: 0,
        summary: "AbuseIPDB source unavailable."
      };
    }
    const body = await response.json();
    const data = body?.data || {};
    const abuseScore = clampPercent(Number(data.abuseConfidenceScore || 0));
    const reports = Number(data.totalReports || 0);
    const isWhitelisted = Boolean(data.isWhitelisted);
    let riskScore = abuseScore > 0 ? abuseScore : 8;
    if (isWhitelisted && riskScore > 12) riskScore = 12;
    const matched = !isWhitelisted && abuseScore >= 40;
    let confidence = 65;
    if (reports >= 5) confidence = 75;
    if (reports >= 20) confidence = 85;
    if (abuseScore >= 80) confidence = 92;
    if (isWhitelisted) confidence = Math.min(confidence, 70);
    const summaryParts = [];
    if (isWhitelisted) {
      summaryParts.push("AbuseIPDB lists this IP as whitelisted.");
    }
    summaryParts.push(`AbuseIPDB score ${abuseScore} based on ${reports} report(s).`);
    const evidence = [];
    if (data.countryCode) evidence.push(`Country: ${data.countryCode}`);
    if (data.lastReportedAt) evidence.push(`Last reported: ${data.lastReportedAt}`);

    return {
      source: "AbuseIPDB IP reputation",
      available: true,
      matched,
      error: "",
      riskScore,
      confidence,
      summary: summaryParts.join(" ").trim() || "AbuseIPDB response received.",
      evidence
    };
  } catch (err) {
    return {
      source: "AbuseIPDB IP reputation",
      available: false,
      matched: false,
      error: String(err?.message || err || "AbuseIPDB request failed"),
      riskScore: 0,
      confidence: 0,
      summary: "AbuseIPDB source unavailable."
    };
  }
}

function extractUrlsFromText(text, maxItems = 3) {
  const input = String(text || "");
  if (!input) return [];
  const urls = [];
  const seen = new Set();
  const pushUrl = (value) => {
    const raw = String(value || "").trim();
    if (!raw) return;
    const normalized = raw.replace(/[),.]+$/, "");
    const key = normalized.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    urls.push(normalized);
  };

  const httpRegex = /https?:\/\/[^\s<>"')]+/gi;
  let match = null;
  while ((match = httpRegex.exec(input)) !== null && urls.length < maxItems) {
    pushUrl(match[0]);
  }

  if (urls.length < maxItems) {
    const wwwRegex = /(?:^|[\s"(])((?:www\.)[^\s<>"')]+)/gi;
    while ((match = wwwRegex.exec(input)) !== null && urls.length < maxItems) {
      pushUrl(`https://${match[1]}`);
    }
  }

  return urls;
}

function extractEmailDomainForWhois(emailTextValue) {
  const text = String(emailTextValue || "");
  const candidates = [
    (text.match(/^from:\s*(.+)$/im) || [])[1] || "",
    (text.match(/^reply-to:\s*(.+)$/im) || [])[1] || "",
    (text.match(/^return-path:\s*(.+)$/im) || [])[1] || ""
  ];
  for (const candidate of candidates) {
    const match = String(candidate || "").match(/@([a-z0-9.-]+\.[a-z]{2,})/i);
    if (match && match[1]) {
      return String(match[1]).toLowerCase();
    }
  }
  return "";
}

function summarizeSafeBrowsingResults(results, totalTargets, label = "Google Safe Browsing") {
  const scans = Array.isArray(results) ? results : [];
  if (!totalTargets) {
    return {
      source: label,
      available: false,
      matched: false,
      error: "",
      riskScore: 0,
      confidence: 0,
      summary: "Safe Browsing skipped (no URLs to scan).",
      evidence: []
    };
  }

  const availableScans = scans.filter((item) => item && item.available);
  const matchedScans = availableScans.filter((item) => item.matched);
  if (matchedScans.length) {
    const evidence = matchedScans.map((item) => item.summary).filter(Boolean).slice(0, 3);
    return {
      source: label,
      available: true,
      matched: true,
      error: "",
      riskScore: 95,
      confidence: 94,
      summary: `Google Safe Browsing flagged ${matchedScans.length} of ${totalTargets} URL(s).`,
      evidence
    };
  }

  if (availableScans.length === totalTargets) {
    return {
      source: label,
      available: true,
      matched: false,
      error: "",
      riskScore: 8,
      confidence: 82,
      summary: `Google Safe Browsing found no threats in ${totalTargets} URL(s).`,
      evidence: []
    };
  }

  if (availableScans.length > 0) {
    return {
      source: label,
      available: true,
      matched: false,
      error: "",
      riskScore: 12,
      confidence: 65,
      summary: `Google Safe Browsing scanned ${availableScans.length} of ${totalTargets} URL(s); no matches found.`,
      evidence: []
    };
  }

  const firstError = scans.find((item) => item && item.error)?.error;
  return {
    source: label,
    available: false,
    matched: false,
    error: firstError || "Google Safe Browsing unavailable.",
    riskScore: 0,
    confidence: 0,
    summary: "Safe Browsing source unavailable.",
    evidence: []
  };
}

function buildDomainAgeSource(domainIntel) {
  const fallbackError = domainIntel?.reasons?.[0] || "WHOIS lookup unavailable";
  if (!domainIntel || domainIntel.available === false) {
    return {
      source: "WHOIS domain age",
      available: false,
      matched: false,
      error: fallbackError,
      riskScore: 0,
      confidence: 0,
      summary: "WHOIS source unavailable.",
      evidence: Array.isArray(domainIntel?.reasons) ? domainIntel.reasons.slice(0, 4) : []
    };
  }

  const riskScore = clampPercent(domainIntel.domainRisk);
  const matched = riskScore >= 55;
  const confidence = clampPercent(60 + (matched ? 18 : 6) + (domainIntel.ageDays !== null ? 4 : 0));
  let summary = "WHOIS data reviewed; no recent-registration signals detected.";
  if (Array.isArray(domainIntel.reasons) && domainIntel.reasons.length) {
    summary = domainIntel.reasons.join(" ");
  } else if (domainIntel.ageDays !== null) {
    if (domainIntel.ageDays >= 365) {
      summary = "Domain age appears older than one year.";
    } else if (domainIntel.ageDays >= 180) {
      summary = "Domain age appears older than six months.";
    } else if (domainIntel.ageDays >= 90) {
      summary = "Domain age appears older than three months.";
    }
  }

  return {
    source: "WHOIS domain age",
    available: true,
    matched,
    error: "",
    riskScore,
    confidence,
    summary: String(summary || "").slice(0, 280),
    evidence: Array.isArray(domainIntel.reasons) ? domainIntel.reasons.slice(0, 4) : []
  };
}

function buildWeightedAssessments(assessments) {
  return assessments
    .filter((item) => item.available && item.weight > 0)
    .map((item) => {
      const conf = clampPercent(item.confidence);
      const confidenceFactor = conf ? Math.max(0.6, Math.min(1.1, (conf + 20) / 100)) : 0.7;
      const effectiveWeight = item.weight * confidenceFactor;
      return { ...item, effectiveWeight };
    })
    .filter((item) => item.effectiveWeight > 0);
}

function mergeAssessmentFactors(assessments, maxItems = 6) {
  const weighted = buildWeightedAssessments(assessments);
  const factorMap = new Map();
  for (const item of weighted) {
    if (!Array.isArray(item.factors) || item.factors.length === 0) continue;
    const weight = item.effectiveWeight || 0;
    if (weight <= 0) continue;
    for (const raw of item.factors) {
      const name = String(raw?.name || "").trim();
      if (!name) continue;
      const score = clampPercent(raw?.score);
      const key = name.toLowerCase();
      const existing = factorMap.get(key) || { name, scoreSum: 0, weightSum: 0 };
      existing.scoreSum += (score * weight);
      existing.weightSum += weight;
      factorMap.set(key, existing);
    }
  }
  if (!factorMap.size) return [];
  return Array.from(factorMap.values())
    .map((item) => ({
      name: item.name,
      score: clampPercent(item.scoreSum / (item.weightSum || 1))
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, maxItems);
}

function aggregateUrlRisk(assessments) {
  const weighted = buildWeightedAssessments(assessments);
  const totalWeight = weighted.reduce((sum, item) => sum + item.effectiveWeight, 0) || 1;
  let riskScore = clampPercent(weighted.reduce((sum, item) => sum + (item.riskScore * item.effectiveWeight), 0) / totalWeight);
  let confidence = clampPercent(weighted.reduce((sum, item) => sum + (item.confidence * item.effectiveWeight), 0) / totalWeight);

  const activeThreatMatches = weighted.filter((item) => item.matched && item.key !== "heuristic");
  const strongMatch = activeThreatMatches.some((item) => item.riskScore >= 90);
  if (strongMatch && riskScore < 80) riskScore = 80;
  if (activeThreatMatches.length >= 2 && riskScore < 72) riskScore = 72;
  if (weighted.some((item) => item.key === "gsb" && item.matched) && riskScore < 85) riskScore = 85;
  const gsbClean = weighted.some((item) => item.key === "gsb" && item.available && !item.matched);
  if (gsbClean && !strongMatch && riskScore < 60) {
    riskScore = Math.max(8, riskScore - 8);
  }
  if (weighted.length >= 4) {
    confidence = clampPercent(confidence + 6);
  } else if (weighted.length >= 3) {
    confidence = clampPercent(confidence + 3);
  }

  const riskLevel = riskLevelFromScore(riskScore);
  const factors = weighted
    .map((item) => ({ name: item.source, score: clampPercent(item.riskScore) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const matchedSourceNames = activeThreatMatches.map((item) => item.source);
  const summary = matchedSourceNames.length
    ? `High-risk detections from ${matchedSourceNames.join(", ")}. Combined multi-source risk scoring applied.`
    : "No direct threat feed hit detected; combined heuristic and AI signals were used for risk scoring.";

  return {
    riskScore,
    confidence,
    riskLevel,
    summary: summary.slice(0, 280),
    factors
  };
}

function normalizeEvidenceItem(text) {
  const cleaned = String(text || "").replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  return /[.!?]$/.test(cleaned) ? cleaned : `${cleaned}.`;
}

function stripTrailingPunctuation(text) {
  return String(text || "").replace(/[.!?]+$/, "").trim();
}

function buildEvidenceList(items, maxItems = 3) {
  const list = [];
  const seen = new Set();
  for (const raw of items || []) {
    const normalized = normalizeEvidenceItem(raw);
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    list.push(normalized);
    if (list.length >= maxItems) break;
  }
  return list;
}

function buildUrlNarrative(result, sources, heuristic) {
  const riskScore = clampPercent(result?.riskScore);
  const confidence = clampPercent(result?.confidence);
  const riskLevelRaw = String(result?.riskLevel || "").toLowerCase();
  const riskLevel = ["low", "medium", "high"].includes(riskLevelRaw)
    ? riskLevelRaw
    : riskLevelFromScore(riskScore);

  const entries = Object.entries(sources || {});
  const threatKeys = new Set(["safeBrowsing", "gsb"]);
  const threatMatches = entries
    .filter(([key, src]) => threatKeys.has(key) && src?.available && src?.matched);
  const supportingMatches = entries
    .filter(([key, src]) => !threatKeys.has(key) && key !== "heuristic" && key !== "ollama" && src?.available && src?.matched);
  const evidencePool = [];

  threatMatches.forEach(([, src]) => {
    if (src.summary) evidencePool.push(src.summary);
    if (Array.isArray(src.evidence)) evidencePool.push(...src.evidence);
  });
  supportingMatches.forEach(([, src]) => {
    if (src.summary) evidencePool.push(src.summary);
    if (Array.isArray(src.evidence)) evidencePool.push(...src.evidence);
  });

  if (threatMatches.length === 0) {
    const heuristicSignals = Array.isArray(heuristic?.signals) ? heuristic.signals : [];
    const safeSignals = Array.isArray(heuristic?.safeSignals) ? heuristic.safeSignals : [];
    if (heuristicSignals.length) {
      evidencePool.push(...heuristicSignals);
    } else if (safeSignals.length) {
      evidencePool.push(...safeSignals);
    }
  }

  const evidence = buildEvidenceList(evidencePool, 3);
  const summarySignals = evidence.map(stripTrailingPunctuation).slice(0, 2);

  let summary = "";
  if (threatMatches.length) {
    const names = threatMatches.map(([, src]) => src.source).filter(Boolean);
    summary = `Threat feeds flagged this URL (${names.join(", ")}).`;
  } else if (summarySignals.length) {
    summary = `No threat-feed match; heuristic signals include ${summarySignals.join("; ")}.`;
  } else {
    summary = "No direct threat-feed match detected; analysis relied on heuristic patterns.";
  }

  const action = riskLevel === "high"
    ? "Avoid opening the link. Use the official site or app and report if unexpected."
    : riskLevel === "medium"
      ? "Proceed with caution. Verify the domain manually before entering any credentials."
      : "Looks low risk, but verify the domain before sharing sensitive information.";

  const evidenceLine = evidence.length
    ? `Key signals: ${evidence.join(" ")}`
    : "Key signals were limited in available sources.";
  const explanation = `Risk ${riskLevel.toUpperCase()} (${riskScore}%, confidence ${confidence}%). ${evidenceLine} Recommended action: ${action}`;

  return {
    summary: summary.slice(0, 280),
    explanation: explanation.slice(0, 600),
    evidence
  };
}

function buildApkNarrative(result, sources, heuristic) {
  const riskScore = clampPercent(result?.riskScore);
  const confidence = clampPercent(result?.confidence);
  const riskLevelRaw = String(result?.riskLevel || "").toLowerCase();
  const riskLevel = ["low", "medium", "high"].includes(riskLevelRaw)
    ? riskLevelRaw
    : riskLevelFromScore(riskScore);

  const entries = Object.entries(sources || {});
  const threatKeys = new Set(["safeBrowsing", "gsb"]);
  const threatMatches = entries
    .filter(([key, src]) => threatKeys.has(key) && src?.available && src?.matched);
  const supportingMatches = entries
    .filter(([key, src]) => !threatKeys.has(key) && key !== "heuristic" && key !== "ollama" && src?.available && src?.matched);
  const evidencePool = [];

  threatMatches.forEach(([, src]) => {
    if (src.summary) evidencePool.push(src.summary);
    if (Array.isArray(src.evidence)) evidencePool.push(...src.evidence);
  });
  supportingMatches.forEach(([, src]) => {
    if (src.summary) evidencePool.push(src.summary);
    if (Array.isArray(src.evidence)) evidencePool.push(...src.evidence);
  });

  if (threatMatches.length === 0) {
    const heuristicSignals = Array.isArray(heuristic?.signals) ? heuristic.signals : [];
    const safeSignals = Array.isArray(heuristic?.safeSignals) ? heuristic.safeSignals : [];
    if (heuristicSignals.length) {
      evidencePool.push(...heuristicSignals);
    } else if (safeSignals.length) {
      evidencePool.push(...safeSignals);
    }
  }

  const evidence = buildEvidenceList(evidencePool, 3);
  const summarySignals = evidence.map(stripTrailingPunctuation).slice(0, 2);

  let summary = "";
  if (threatMatches.length) {
    const names = threatMatches.map(([, src]) => src.source).filter(Boolean);
    summary = `Threat intelligence flagged this APK (${names.join(", ")}).`;
  } else if (summarySignals.length) {
    summary = `No threat-feed match; heuristic signals include ${summarySignals.join("; ")}.`;
  } else {
    summary = "No direct threat-feed match detected; analysis relied on heuristic and LLM signals.";
  }

  const action = riskLevel === "high"
    ? "Do not install. Use an official store or verified source only."
    : riskLevel === "medium"
      ? "Verify the source and scan before installing."
      : "Likely safe, but install only from official stores when possible.";

  const evidenceLine = evidence.length
    ? `Key signals: ${evidence.join(" ")}`
    : "Key signals were limited in available sources.";
  const explanation = `Risk ${riskLevel.toUpperCase()} (${riskScore}%, confidence ${confidence}%). ${evidenceLine} Recommended action: ${action}`;

  return {
    summary: summary.slice(0, 280),
    explanation: explanation.slice(0, 600),
    evidence
  };
}

function buildEmailNarrative(result, sources, heuristic) {
  const riskScore = clampPercent(result?.riskScore);
  const confidence = clampPercent(result?.confidence);
  const riskLevelRaw = String(result?.riskLevel || "").toLowerCase();
  const riskLevel = ["low", "medium", "high"].includes(riskLevelRaw)
    ? riskLevelRaw
    : riskLevelFromScore(riskScore);

  const entries = Object.entries(sources || {});
  const threatKeys = new Set(["safeBrowsing", "gsb"]);
  const threatMatches = entries
    .filter(([key, src]) => threatKeys.has(key) && src?.available && src?.matched);
  const supportingMatches = entries
    .filter(([key, src]) => !threatKeys.has(key) && key !== "heuristic" && key !== "ollama" && src?.available && src?.matched);
  const evidencePool = [];

  threatMatches.forEach(([, src]) => {
    if (src.summary) evidencePool.push(src.summary);
    if (Array.isArray(src.evidence)) evidencePool.push(...src.evidence);
  });
  supportingMatches.forEach(([, src]) => {
    if (src.summary) evidencePool.push(src.summary);
    if (Array.isArray(src.evidence)) evidencePool.push(...src.evidence);
  });

  if (threatMatches.length === 0) {
    const heuristicSignals = Array.isArray(heuristic?.signals) ? heuristic.signals : [];
    const safeSignals = Array.isArray(heuristic?.safeSignals) ? heuristic.safeSignals : [];
    if (heuristicSignals.length) {
      evidencePool.push(...heuristicSignals);
    } else if (safeSignals.length) {
      evidencePool.push(...safeSignals);
    }
  }

  const evidence = buildEvidenceList(evidencePool, 3);
  const summarySignals = evidence.map(stripTrailingPunctuation).slice(0, 2);

  let summary = "";
  if (threatMatches.length) {
    const names = threatMatches.map(([, src]) => src.source).filter(Boolean);
    summary = `Threat intelligence flagged this email (${names.join(", ")}).`;
  } else if (summarySignals.length) {
    summary = `No threat-feed match; heuristic signals include ${summarySignals.join("; ")}.`;
  } else {
    summary = "No direct threat-feed match detected; analysis relied on heuristic and LLM signals.";
  }

  const action = riskLevel === "high"
    ? "Do not click links or open attachments. Report as phishing."
    : riskLevel === "medium"
      ? "Verify the sender via a trusted channel before taking action."
      : "Looks low risk, but stay cautious with links and attachments.";

  const evidenceLine = evidence.length
    ? `Key signals: ${evidence.join(" ")}`
    : "Key signals were limited in available sources.";
  const explanation = `Risk ${riskLevel.toUpperCase()} (${riskScore}%, confidence ${confidence}%). ${evidenceLine} Recommended action: ${action}`;

  return {
    summary: summary.slice(0, 280),
    explanation: explanation.slice(0, 600),
    evidence
  };
}

function randomPick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function createQuestionId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function prunePhishingQuestions() {
  const now = Date.now();
  for (const [id, q] of phishingQuestions.entries()) {
    if (!q || (now - q.createdAt) > PHISHING_TTL_MS) {
      phishingQuestions.delete(id);
    }
  }
}

function prunePhishingTimelineRuns() {
  const now = Date.now();
  for (const [id, run] of phishingTimelineRuns.entries()) {
    if (!run || (now - run.createdAt) > PHISHING_TTL_MS) {
      phishingTimelineRuns.delete(id);
    }
  }
}

function prunePasswordQuestions() {
  const now = Date.now();
  for (const [id, q] of passwordQuestions.entries()) {
    if (!q || (now - q.createdAt) > PHISHING_TTL_MS) {
      passwordQuestions.delete(id);
    }
  }
}

function pruneSafeLinkQuestions() {
  const now = Date.now();
  for (const [id, q] of safeLinkQuestions.entries()) {
    if (!q || (now - q.createdAt) > PHISHING_TTL_MS) {
      safeLinkQuestions.delete(id);
    }
  }
}

function pruneMalwareQuestions() {
  const now = Date.now();
  for (const [id, q] of malwareQuestions.entries()) {
    if (!q || (now - q.createdAt) > PHISHING_TTL_MS) {
      malwareQuestions.delete(id);
    }
  }
}

function pruneMalwareChainRuns() {
  const now = Date.now();
  for (const [id, run] of malwareChainRuns.entries()) {
    if (!run || (now - run.createdAt) > PHISHING_TTL_MS) {
      malwareChainRuns.delete(id);
    }
  }
}

function generateStrongPassword() {
  const words = ["Falcon", "Shield", "Orbit", "Cipher", "Vector", "Atlas"];
  const symbols = ["!", "@", "#", "$", "%", "&"];
  return `${randomPick(words)}${Math.floor(100 + Math.random() * 900)}${randomPick(symbols)}${randomPick(words).toLowerCase()}`;
}

function generateWeakPassword() {
  const weak = ["password123", "qwerty123", "admin2024", "iloveyou1", "welcome123", "12345678"];
  return randomPick(weak);
}

function buildFallbackPasswordQuestion() {
  const strong = Math.random() < 0.45;
  const password = strong ? generateStrongPassword() : generateWeakPassword();
  const context = randomPick([
    "You need a password for your banking app.",
    "Create a password for your primary email account.",
    "Set a password for cloud storage containing personal files.",
    "Create a password for your work account."
  ]);

  const options = [
    { id: "use_now", text: "Use this password as it is" },
    { id: "improve", text: "Make this password stronger before using it" },
    { id: "reuse_old", text: "Reuse your old password from another account" },
    { id: "share", text: "Share this password with a friend for backup" }
  ];

  return {
    question: "What is the safest decision for this password?",
    context,
    password,
    options: shuffle(options),
    correctOption: strong ? "use_now" : "improve",
    explanation: strong
      ? "This password has good length and mixed character types, so it is safer to use."
      : "This password is easy to guess or commonly used. Improve it with length, symbols, and uniqueness.",
    difficulty: "beginner"
  };
}

async function buildLlmPasswordQuestion() {
  const seed = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const prompt = `
You are creating a beginner password-security game challenge.
Return strict JSON only:
{
  "question": "string",
  "context": "string",
  "password": "string",
  "options": [
    {"id":"use_now","text":"..."},
    {"id":"improve","text":"..."},
    {"id":"reuse_old","text":"..."},
    {"id":"share","text":"..."}
  ],
  "correctOption": "use_now|improve|reuse_old|share",
  "explanation": "short explanation",
  "difficulty": "beginner"
}
Rules:
- Use simple English.
- Exactly one best answer.
- Scenario must vary each time.
- Seed: ${seed}
  `.trim();

  const fallback = buildFallbackPasswordQuestion();
  const parsed = await tryOllamaJson(
    prompt,
    "You are a cybersecurity training content generator. Return strict JSON only."
  );
  if (!parsed) return fallback;

  const optionMap = new Map((Array.isArray(parsed.options) ? parsed.options : []).map((o) => [String(o.id || ""), String(o.text || "")]));
  const options = shuffle([
    { id: "use_now", text: optionMap.get("use_now") || "Use this password as it is" },
    { id: "improve", text: optionMap.get("improve") || "Make this password stronger before using it" },
    { id: "reuse_old", text: optionMap.get("reuse_old") || "Reuse your old password from another account" },
    { id: "share", text: optionMap.get("share") || "Share this password with a friend for backup" }
  ]);
  const correctOption = String(parsed.correctOption || "").toLowerCase();
  const safeCorrect = ["use_now", "improve", "reuse_old", "share"].includes(correctOption) ? correctOption : fallback.correctOption;

  return {
    question: String(parsed.question || fallback.question).slice(0, 220),
    context: String(parsed.context || fallback.context).slice(0, 220),
    password: String(parsed.password || fallback.password).slice(0, 120),
    options,
    correctOption: safeCorrect,
    explanation: String(parsed.explanation || fallback.explanation).slice(0, 260),
    difficulty: "beginner"
  };
}

function buildFallbackPhishingQuestion() {
  const brands = ["Microsoft 365", "PayPal", "Google Workspace", "Bank Security", "DocuSign", "AWS Billing"];
  const intents = [
    "unusual sign-in attempt",
    "invoice overdue warning",
    "mailbox quota exceeded",
    "document signature pending",
    "payment failure alert",
    "password expires today"
  ];
  const suspiciousDomains = [
    "microsoft-secure-login.click",
    "secure-docusign-verify.work",
    "paypa1-alerts.zip",
    "google-auth-reset.cam",
    "aws-billing-update.gq"
  ];
  const safeDomains = [
    "microsoft.com",
    "google.com",
    "docusign.com",
    "paypal.com",
    "amazonaws.com"
  ];
  const cta = ["verify now", "confirm account", "reset password", "review bill", "open document"];
  const urgency = ["within 30 minutes", "today", "immediately", "before account suspension"];

  const brand = randomPick(brands);
  const intent = randomPick(intents);
  const badDomain = randomPick(suspiciousDomains);
  const safeDomain = randomPick(safeDomains);
  const action = randomPick(cta);
  const due = randomPick(urgency);

  const isPhish = Math.random() < 0.72;
  const from = isPhish
    ? `${brand} Security <notice@${badDomain}>`
    : `${brand} Security <security@${safeDomain}>`;
  const subject = `${brand}: ${intent}`;
  const link = isPhish ? `https://${badDomain}/${action.replace(/\s+/g, "-")}` : `https://${safeDomain}/${action.replace(/\s+/g, "-")}`;
  const snippet = isPhish
    ? `There is a problem with your account. Please ${action} ${due} or your account may be locked.`
    : `This is a normal security message. Open the official app/site to check activity.`;

  const correctOption = isPhish ? "report" : "review";
  const options = shuffle([
    { id: "report", text: "Mark as phishing and do not click the link" },
    { id: "review", text: "Open the official website/app yourself and check there" },
    { id: "reply", text: "Reply with your password or OTP" },
    { id: "download", text: "Download the file from email and run it" }
  ]);

  const explanation = isPhish
    ? `This is likely phishing. The sender/link (${badDomain}) looks suspicious and the email uses urgency to pressure you.`
    : "This looks safer, but still use the official website/app directly instead of trusting email links.";

  return {
    question: "What should you do with this email?",
    emailPreview: { from, subject, snippet, link },
    options,
    correctOption,
    explanation,
    riskLabel: isPhish ? "Likely Phishing" : "Likely Legitimate"
  };
}

async function buildLlmPhishingQuestion() {
  const scenarioSeed = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const prompt = `
You are generating a phishing-awareness game question.
Create ONE unique scenario (different from common textbook examples) and return strict JSON only:
{
  "question": "string",
  "emailPreview": {
    "from": "string",
    "subject": "string",
    "snippet": "string",
    "link": "string"
  },
  "options": [
    {"id":"report","text":"..."},
    {"id":"review","text":"..."},
    {"id":"reply","text":"..."},
    {"id":"download","text":"..."}
  ],
  "correctOption": "report|review|reply|download",
  "explanation": "short explanation",
  "riskLabel": "Likely Phishing|Likely Legitimate"
}
Rules:
- Use simple English (easy for beginners, age 13+).
- Keep options realistic and safety-focused.
- Ensure exactly one best answer.
- Include subtle clues, not only obvious ones.
- Scenario seed: ${scenarioSeed}
  `.trim();

  const fallback = buildFallbackPhishingQuestion();
  const parsed = await tryOllamaJson(
    prompt,
    "You are a phishing-awareness scenario generator. Return strict JSON only."
  );
  if (!parsed) return fallback;

  const optionsRaw = Array.isArray(parsed.options) ? parsed.options : [];
  const optionMap = new Map(optionsRaw.map((o) => [String(o.id || ""), String(o.text || "")]));
  const options = shuffle([
    { id: "report", text: optionMap.get("report") || "Mark as phishing and do not click the link" },
    { id: "review", text: optionMap.get("review") || "Open the official website/app yourself and check there" },
    { id: "reply", text: optionMap.get("reply") || "Reply with your password or OTP" },
    { id: "download", text: optionMap.get("download") || "Download the file from email and run it" }
  ]);
  const correctOption = String(parsed.correctOption || "").toLowerCase();
  const safeCorrect = ["report", "review", "reply", "download"].includes(correctOption) ? correctOption : fallback.correctOption;

  return {
    question: String(parsed.question || fallback.question).slice(0, 240),
    emailPreview: {
      from: String(parsed.emailPreview?.from || fallback.emailPreview.from).slice(0, 160),
      subject: String(parsed.emailPreview?.subject || fallback.emailPreview.subject).slice(0, 180),
      snippet: String(parsed.emailPreview?.snippet || fallback.emailPreview.snippet).slice(0, 320),
      link: String(parsed.emailPreview?.link || fallback.emailPreview.link).slice(0, 220)
    },
    options,
    correctOption: safeCorrect,
    explanation: String(parsed.explanation || fallback.explanation).slice(0, 260),
    riskLabel: String(parsed.riskLabel || fallback.riskLabel).slice(0, 32)
  };
}

function buildTimelinePhishingEmail(type) {
  const suspiciousDomains = [
    "account-security-check.click",
    "verify-now-login.work",
    "secure-alert-center.cam",
    "team-message-update.zip"
  ];
  const trustedDomains = [
    "microsoft.com",
    "google.com",
    "docusign.com",
    "amazonaws.com"
  ];
  const departments = ["HR", "Finance", "IT Support", "Security Team", "Project Ops"];
  const actions = ["review account activity", "confirm a notification", "check a shared document", "verify a request"];

  if (type === "report") {
    const fakeDomain = randomPick(suspiciousDomains);
    const subject = randomPick([
      "Urgent: Account suspension warning",
      "Action required: Security lock in 30 minutes",
      "Final notice: Verify now to avoid access loss"
    ]);
    const snippet = randomPick([
      "You must confirm password and OTP immediately.",
      "Failure to verify now may disable your account.",
      "Complete verification in 20 minutes to avoid lock."
    ]);
    return {
      id: createQuestionId(),
      emailPreview: {
        from: `Security Alert <notice@${fakeDomain}>`,
        subject,
        snippet,
        link: `https://${fakeDomain}/verify-now`
      },
      triage: "report",
      explanation: "Urgency, suspicious domain, and credential pressure indicate phishing."
    };
  }

  if (type === "safe") {
    const trusted = randomPick(trustedDomains);
    const dept = randomPick(departments);
    const action = randomPick(actions);
    return {
      id: createQuestionId(),
      emailPreview: {
        from: `${dept} <noreply@${trusted}>`,
        subject: `Routine notice: ${action}`,
        snippet: "No password or OTP is requested. You can verify from the official app.",
        link: `https://${trusted}/security`
      },
      triage: "safe",
      explanation: "Looks routine and non-coercive. Still verify via official channel."
    };
  }

  const trusted = randomPick(trustedDomains);
  const dept = randomPick(departments);
  const snippet = randomPick([
    "Unexpected request arrived from a new vendor contact.",
    "The message asks for quick acknowledgement before EOD.",
    "Sender context is incomplete; details are limited."
  ]);
  return {
    id: createQuestionId(),
    emailPreview: {
      from: `${dept} <updates@${trusted}>`,
      subject: "Please review this unusual request",
      snippet,
      link: `https://${trusted}/shared/review`
    },
    triage: "suspicious",
    explanation: "No direct phishing proof, but context is unusual and needs manual verification."
  };
}

function buildPhishingTimelineRound() {
  const types = shuffle(["report", "safe", "suspicious", "report", "safe", "suspicious"]);
  return types.map((type) => buildTimelinePhishingEmail(type));
}

function isPrivateIpv4(host) {
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return false;
  const parts = host.split(".").map((n) => Number(n));
  if (parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return false;
  if (parts[0] === 10) return true;
  if (parts[0] === 127) return true;
  if (parts[0] === 192 && parts[1] === 168) return true;
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  if (parts[0] === 169 && parts[1] === 254) return true;
  return false;
}

function isShortenerHost(host) {
  const shorteners = [
    "bit.ly",
    "tinyurl.com",
    "t.co",
    "cutt.ly",
    "shorturl.at",
    "rb.gy",
    "is.gd",
    "ow.ly",
    "buff.ly",
    "rebrand.ly",
    "tiny.cc",
    "goo.gl"
  ];
  return shorteners.some((root) => host === root || host.endsWith(`.${root}`));
}

function getBrandImpersonationSignals(host) {
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
  const entries = Object.entries(brandRoots);
  const impersonationHits = entries.filter(([brand, roots]) => {
    if (!host.includes(brand)) return false;
    return !roots.some((root) => host === root || host.endsWith(`.${root}`));
  });
  const trustedBrandMatch = entries.some(([, roots]) => roots.some((root) => host === root || host.endsWith(`.${root}`)));
  return {
    impersonationHits: impersonationHits.map(([brand]) => brand),
    trustedBrandMatch
  };
}

function calculateEntropy(text) {
  const value = String(text || "");
  if (!value) return 0;
  const freq = {};
  for (const ch of value) {
    freq[ch] = (freq[ch] || 0) + 1;
  }
  const len = value.length;
  let entropy = 0;
  Object.values(freq).forEach((count) => {
    const p = count / len;
    entropy -= p * Math.log2(p);
  });
  return entropy;
}

function baseUrlHeuristic(urlValue) {
  const parsed = normalizeUrl(urlValue);
  if (!parsed) {
    return {
      riskScore: 95,
      confidence: 85,
      riskLevel: "high",
      summary: "URL format is invalid or malformed, which is often a strong phishing indicator.",
      factors: [
        { name: "URL structure", score: 95 },
        { name: "Destination trust", score: 90 },
        { name: "Technical signals", score: 88 }
      ]
    };
  }

  const host = parsed.hostname.toLowerCase();
  const pathText = `${parsed.pathname}${parsed.search}`.toLowerCase();
  const isHttps = parsed.protocol === "https:";
  const protocol = String(parsed.protocol || "").toLowerCase();
  const isHttpProtocol = protocol === "http:" || protocol === "https:";
  const unusualProtocol = !isHttpProtocol;
  const rawHref = parsed.href;
  const hostParts = host.split(".");
  const subdomainCount = Math.max(0, hostParts.length - 2);
  const hasIpHost = /^[0-9.]+$/.test(host);
  const isPrivateIp = hasIpHost && isPrivateIpv4(host);
  const hasAtSymbol = parsed.href.includes("@");
  const suspiciousWords = ["login", "verify", "secure", "update", "password", "wallet", "banking", "confirm", "account", "signin", "auth"];
  const pathSuspiciousTokens = suspiciousWords.filter((word) => pathText.includes(word));
  const hostSuspiciousTokens = suspiciousWords.filter((word) => host.includes(word));
  const pathSuspiciousHits = pathSuspiciousTokens.length;
  const hostSuspiciousHits = hostSuspiciousTokens.length;
  const brandSensitiveWords = ["bank", "paypal", "apple", "microsoft", "gmail", "telegram", "whatsapp", "amazon"];
  const hostBrandHits = brandSensitiveWords.filter((word) => host.includes(word)).length;
  const hostCredentialCombo = ["bank", "login", "verify", "update", "secure"].filter((word) => host.includes(word)).length;
  const lureWords = ["coin", "coins", "generator", "unlimited", "free", "bonus", "gift", "claim", "airdrop", "hack", "crack", "mod", "cheat", "loot"];
  const hostLureTokens = lureWords.filter((word) => host.includes(word));
  const hostLureHits = hostLureTokens.length;
  const hasComPrefixTrap = /^com\./i.test(host);
  const tld = hostParts[hostParts.length - 1] || "";
  const hasRareTld = tld.length >= 7;
  const generatorScamPattern = host.includes("generator") && /(coin|coins|free|bonus|unlimited)/i.test(host);
  const hasPunycode = host.includes("xn--");
  const hasLongUrl = parsed.href.length > 120;
  const hasLongHost = host.length >= 32;
  const hasManyHyphens = (host.match(/-/g) || []).length >= 2;
  const hasEncodedChars = /%[0-9a-f]{2}/i.test(parsed.href);
  const hasSuspiciousTld = /\.(zip|mov|click|cam|work|country|gq|tk|ml)$/i.test(host);
  const hasWatchTld = /\.(top|xyz|site|icu|sbs|rest|bar|cfd)$/i.test(host);
  const hasUserInfo = !!parsed.username;
  const nonStandardPort = parsed.port && !["80", "443"].includes(parsed.port);
  const queryText = parsed.search.toLowerCase();
  const querySuspiciousTokens = suspiciousWords.filter((word) => queryText.includes(word));
  const queryHits = querySuspiciousTokens.length;
  const pathSegments = parsed.pathname.split("/").filter(Boolean);
  const pathDepth = pathSegments.length;
  const hasDeepPath = pathDepth >= 5;
  const queryParamCount = parsed.searchParams ? Array.from(parsed.searchParams.keys()).length : 0;
  const longQuery = parsed.search.length > 120 || queryParamCount >= 6;
  const hasRedirectParam = /(redirect|return|continue|next|url|target|dest)=/i.test(queryText);
  const hasDownloadExt = /\.(apk|exe|scr|js|zip|rar|7z|iso|dmg)(\?|$)/i.test(parsed.pathname);
  const hasDoubleExt = /\.(pdf|docx|doc|xls|xlsx|ppt|pptx|jpg|jpeg|png|gif|zip|rar|7z|tar|gz)\.(exe|js|scr|bat|cmd|msi|apk|dmg)(\?|$)/i.test(parsed.pathname);
  const shortenerHost = isShortenerHost(host);
  const basicSuspiciousHit = /(login|verify|account)/i.test(rawHref);
  const basicTldHit = /\.(xyz|top|click)(\/|$)/i.test(host);
  const ipInUrl = /http(s)?:\/\/\d+\.\d+\.\d+\.\d+/.test(rawHref);
  const shortenerMatch = /bit\.ly|tinyurl/i.test(host);
  const hasEmbeddedUrl = /https?:\/\//i.test(pathText);
  const typoPatterns = [/paypa1/, /micr0soft/, /g00gle/, /faceb00k/, /instagrarn/, /appl3/, /amaz0n/];
  const typoHit = typoPatterns.some((re) => re.test(host));
  const brandSignals = getBrandImpersonationSignals(host);
  const impersonationCount = brandSignals.impersonationHits.length;
  const subdomainLabel = hostParts.length > 2 ? hostParts.slice(0, -2).join(".") : "";
  const subdomainDigitRatio = subdomainLabel ? (subdomainLabel.match(/\d/g) || []).length / Math.max(1, subdomainLabel.length) : 0;
  const hasRandomizedSubdomain = subdomainLabel.length >= 18 && subdomainDigitRatio >= 0.3;
  const hostDigitRatio = (host.match(/\d/g) || []).length / Math.max(1, host.length);
  const hasDigitHeavyHost = host.length >= 8 && hostDigitRatio >= 0.3;
  const hostEntropy = hostParts
    .map((label) => (label.length >= 6 ? calculateEntropy(label) : 0))
    .reduce((max, value) => Math.max(max, value), 0);
  const hasHighEntropyHost = hostEntropy >= 3.4;
  const pathEntropySample = pathText.replace(/[^a-z0-9]/gi, "");
  const pathEntropy = pathEntropySample.length >= 10 ? calculateEntropy(pathEntropySample.toLowerCase()) : 0;
  const hasHighEntropyPath = pathEntropy >= 3.6;
  const hasUnicodeHost = /[^\x00-\x7F]/.test(host);
  const hasUnicodePath = /[^\x00-\x7F]/.test(parsed.pathname);

  const domainRisk = clampPercent(
    (hasIpHost ? (isPrivateIp ? 18 : 40) : 0) +
    (hasPunycode ? 25 : 0) +
    (subdomainCount >= 3 ? 20 : subdomainCount * 6) +
    (hasManyHyphens ? 10 : 0) +
    (hasSuspiciousTld ? 20 : 0) +
    (hasWatchTld ? 10 : 0) +
    (hostLureHits * 14) +
    (hasComPrefixTrap ? 18 : 0) +
    (hasRareTld ? 10 : 0) +
    (shortenerHost ? 14 : 0) +
    (impersonationCount > 0 ? 22 : 0) +
    (typoHit ? 26 : 0) +
    (hasRandomizedSubdomain ? 12 : 0) +
    (hasDigitHeavyHost ? 12 : 0) +
    (hasHighEntropyHost ? 18 : 0) +
    (hasUnicodeHost ? 18 : 0) +
    (hasLongHost ? 8 : 0)
  );
  const pathRisk = clampPercent(
    (pathSuspiciousHits * 12) +
    (queryHits * 8) +
    (hostSuspiciousHits * 14) +
    (hostBrandHits * 10) +
    (hasLongUrl ? 12 : 0) +
    (hasAtSymbol ? 20 : 0) +
    (hasEncodedChars ? 12 : 0) +
    (hasRedirectParam ? 8 : 0) +
    (hasDownloadExt ? 12 : 0) +
    (hasDoubleExt ? 18 : 0) +
    (hasEmbeddedUrl ? 10 : 0) +
    (hasHighEntropyPath ? 10 : 0) +
    (hasUnicodePath ? 10 : 0) +
    (hasDeepPath ? 6 : 0) +
    (longQuery ? 8 : 0)
  );
  const technicalRisk = clampPercent(
    (isHttps ? 18 : 45) +
    (unusualProtocol ? 12 : 0) +
    (parsed.port ? 8 : 0) +
    (hasUserInfo ? 18 : 0) +
    (nonStandardPort ? 14 : 0)
  );
  let riskScore = clampPercent((domainRisk * 0.42) + (pathRisk * 0.33) + (technicalRisk * 0.25));
  const ruleScore = clampPercent(
    (!isHttps ? 20 : 0) +
    (basicSuspiciousHit ? 15 : 0) +
    (basicTldHit ? 20 : 0) +
    (ipInUrl ? 25 : 0) +
    (hasAtSymbol ? 25 : 0) +
    (shortenerMatch ? 20 : 0) +
    (hasEmbeddedUrl ? 10 : 0) +
    (hasDoubleExt ? 12 : 0)
  );
  if (ruleScore > 0) {
    riskScore = clampPercent(riskScore + ruleScore);
  }
  if (hostSuspiciousHits >= 2 && riskScore < 62) riskScore = 62;
  if (hostSuspiciousHits >= 3 && riskScore < 74) riskScore = 74;
  if (hostBrandHits >= 1 && hostSuspiciousHits >= 2 && riskScore < 78) riskScore = 78;
  if (hostCredentialCombo >= 3 && riskScore < 86) riskScore = 86;
  if (!isHttps && hostCredentialCombo >= 2 && riskScore < 90) riskScore = 90;
  if (!isHttps && hasManyHyphens && hostSuspiciousHits >= 2 && riskScore < 88) riskScore = 88;
  if (hostLureHits >= 2 && riskScore < 72) riskScore = 72;
  if (hostLureHits >= 3 && riskScore < 82) riskScore = 82;
  if (generatorScamPattern && riskScore < 90) riskScore = 90;
  if (impersonationCount >= 1 && riskScore < 74) riskScore = 74;
  if (impersonationCount >= 2 && riskScore < 82) riskScore = 82;
  if (typoHit && riskScore < 86) riskScore = 86;
  if (shortenerHost && riskScore < 58) riskScore = 58;
  if (hasDownloadExt && riskScore < 65) riskScore = 65;

  const isLocalTarget = host === "localhost" || isPrivateIp;
  if (isLocalTarget && pathSuspiciousHits === 0 && hostSuspiciousHits === 0 && riskScore > 35) {
    riskScore = 25;
  }

  if (brandSignals.trustedBrandMatch && isHttps && riskScore < 45 && pathSuspiciousHits === 0 && !hasEncodedChars) {
    riskScore = Math.max(8, riskScore - 12);
  }
  const riskLevel = riskScore >= 70 ? "high" : riskScore >= 40 ? "medium" : "low";
  const redFlagCount = [
    hasIpHost && !isPrivateIp,
    hasPunycode,
    hasSuspiciousTld,
    impersonationCount > 0,
    typoHit,
    hasManyHyphens,
    shortenerHost,
    hasDownloadExt,
    hasDoubleExt,
    hasEmbeddedUrl,
    hasDigitHeavyHost,
    hasHighEntropyHost,
    hasHighEntropyPath,
    hasUnicodeHost,
    hasUnicodePath,
    hasLongHost,
    hasUserInfo,
    nonStandardPort,
    hostCredentialCombo >= 2,
    hostLureHits >= 2,
    basicSuspiciousHit,
    basicTldHit,
    ipInUrl,
    shortenerMatch
  ].filter(Boolean).length;
  const confidence = clampPercent(60 + (redFlagCount * 4) + (domainRisk > 60 ? 8 : 0));

  const signals = [];
  const safeSignals = [];

  if (!isHttps) signals.push("No HTTPS encryption.");
  if (isHttps) safeSignals.push("HTTPS enabled.");
  if (unusualProtocol) signals.push(`Unusual URL protocol (${protocol.replace(":", "")}).`);
  if (hasIpHost && !isPrivateIp) signals.push("Uses raw IP address as host.");
  if (hasPunycode) signals.push("Punycode (xn--) hostname detected.");
  if (impersonationCount > 0) signals.push(`Possible brand impersonation (${brandSignals.impersonationHits.join(", ")}).`);
  if (typoHit) signals.push("Possible typo-squatting pattern in hostname.");
  if (hasSuspiciousTld) {
    signals.push(`High-risk TLD: .${tld}`);
  } else if (hasWatchTld) {
    signals.push(`Higher-risk TLD: .${tld}`);
  }
  if (shortenerHost) signals.push("URL shortener used.");
  if (hasDownloadExt) signals.push("Direct download file extension in URL path.");
  if (hasRedirectParam) signals.push("Redirect/forwarding parameter in query.");
  if (pathSuspiciousTokens.length) signals.push(`Suspicious keywords in path/query (${pathSuspiciousTokens.slice(0, 3).join(", ")}).`);
  if (hostSuspiciousTokens.length) signals.push(`Suspicious keywords in hostname (${hostSuspiciousTokens.slice(0, 3).join(", ")}).`);
  if (hostLureTokens.length) signals.push(`Lure keywords in hostname (${hostLureTokens.slice(0, 3).join(", ")}).`);
  if (hasEncodedChars) signals.push("Encoded characters present in URL.");
  if (hasManyHyphens) signals.push("Multiple hyphens in hostname.");
  if (hasLongHost) signals.push("Unusually long hostname.");
  if (hasDigitHeavyHost) signals.push("Digit-heavy hostname.");
  if (hasHighEntropyHost) signals.push("Randomized-looking hostname pattern.");
  if (hasHighEntropyPath) signals.push("Randomized-looking path pattern.");
  if (hasUnicodeHost) signals.push("Non-ASCII characters in hostname.");
  if (hasUnicodePath) signals.push("Non-ASCII characters in URL path.");
  if (hasEmbeddedUrl) signals.push("Embedded URL detected inside path or query.");
  if (hasDoubleExt) signals.push("Double file extension detected in URL.");
  if (subdomainCount >= 3) signals.push("Excessive subdomain depth.");
  if (hasRandomizedSubdomain) signals.push("Randomized-looking subdomain pattern.");
  if (nonStandardPort) signals.push("Non-standard port in URL.");
  if (hasUserInfo) signals.push("Username/password segment in URL.");
  if (hasLongUrl) signals.push("Unusually long URL.");
  if (longQuery) signals.push("Excessive or long query string.");
  if (hasComPrefixTrap) signals.push("Hostname starts with com. lookalike pattern.");

  if (isLocalTarget) safeSignals.push("Local or private network destination.");
  if (brandSignals.trustedBrandMatch && isHttps && pathSuspiciousHits === 0 && !hasEncodedChars) {
    safeSignals.push("Matches trusted brand domain with clean path.");
  }
  if (!hasDownloadExt && !hasRedirectParam && pathSuspiciousHits === 0 && queryHits === 0) {
    safeSignals.push("No obvious suspicious keywords in path/query.");
  }

  return {
    riskScore,
    confidence,
    riskLevel,
    summary: "Heuristic risk estimate based on URL structure, destination pattern, and suspicious token signals.",
    signals,
    safeSignals,
    factors: [
      { name: "Domain reputation signal", score: domainRisk },
      { name: "Path and keyword signal", score: pathRisk },
      { name: "Technical/security signal", score: technicalRisk },
      { name: "Baseline rule checks", score: ruleScore }
    ]
  };
}

function inferApkSourceFromInput(rawValue) {
  const raw = String(rawValue || "").trim();
  if (!raw) return "";
  const parsed = normalizeUrl(raw);
  const host = parsed?.hostname ? parsed.hostname.toLowerCase() : "";
  if (!host) return "";

  if (host === "play.google.com" || host.endsWith(".play.google.com")) return "Play Store";
  if (host === "apkmirror.com" || host.endsWith(".apkmirror.com")) return "APKMirror";
  if (host === "apkpure.com" || host.endsWith(".apkpure.com")) return "APKPure";
  if (host === "f-droid.org" || host.endsWith(".f-droid.org")) return "F-Droid";

  return "";
}

function baseApkHeuristic(apkValue, sourceValue, permissionsValue) {
  const rawInput = String(apkValue || "").trim();
  const apk = rawInput;
  const rawSource = String(sourceValue || "Unknown").trim();
  const inferredSource = inferApkSourceFromInput(rawInput);
  const source = rawSource && rawSource !== "Unknown" ? rawSource : (inferredSource || "Unknown");
  const isSha256 = /^[a-f0-9]{64}$/i.test(apk);
  const isPackage = /^[a-z][a-z0-9_]*(\.[a-z0-9_]+){1,}$/i.test(apk);
  const isApkFileName = /^[a-z0-9._ -]+\.apk$/i.test(apk) && !/[\\/]/.test(apk);
  const isApkPath = /(?:^|[\\/])[^\\/]+\.apk$/i.test(apk);
  const hasSuspiciousWords = /(mod|crack|hacked|pro|premium|unlock|cheat|free|inject|spy)/i.test(apk);
  const suspiciousWordHits = (apk.match(/(mod|crack|hacked|pro|premium|unlock|cheat|free|inject|spy)/gi) || []).length;
  const hasExecutableMasquerade = /\.(exe|scr|bat|js)$/i.test(apk);
  const hasOddChars = /[^a-z0-9._-]/i.test(apk);
  const longToken = apk.length > 120;
  const looksLikeBrandImpersonation = /(whatsap|faceb0ok|insta|telegram|paytm|gpay|amazon|netflix)/i.test(apk);
  const tooManyNumericSegments = (apk.match(/\d+/g) || []).length >= 3;
  const hasUpdateTrap = /(update|security|support|verify|login|wallet|bank|official)/i.test(apk);
  const rawParsed = normalizeUrl(rawInput);
  const rawHost = rawParsed?.hostname ? rawParsed.hostname.toLowerCase() : "";
  const isUrlInput = /^https?:\/\//i.test(rawInput);
  const isShortener = rawHost ? isShortenerHost(rawHost) : false;
  const unknownHost = isUrlInput && rawHost && !inferredSource && !isShortener;
  const permissions = normalizePermissionsInput(permissionsValue);
  const normalizedPermissions = permissions.map((permission) => String(permission || "").trim().toUpperCase()).filter(Boolean);
  const hasReadSms = normalizedPermissions.some((permission) => permission === "READ_SMS" || permission.endsWith(".READ_SMS"));
  const permissionRisk = hasReadSms ? 30 : 0;

  const sourceRiskMap = {
    "Play Store": 12,
    "F-Droid": 18,
    "APKMirror": 26,
    "APKPure": 32,
    "Direct Download": 60,
    Unknown: 72
  };
  const sourceRisk = clampPercent((sourceRiskMap[source] ?? 72) + (unknownHost ? 12 : 0) + (isShortener ? 16 : 0));

  const identityRisk = clampPercent(
    (isSha256 ? 18 : 0) +
    (isPackage ? 22 : 38) +
    ((isApkFileName || isApkPath) ? 18 : 0) +
    (hasOddChars ? 22 : 0) +
    (longToken ? 12 : 0)
  );
  const behaviorRisk = clampPercent(
    (hasSuspiciousWords ? Math.min(70, 30 + (suspiciousWordHits * 15)) : 18) +
    (hasExecutableMasquerade ? 22 : 0) +
    (looksLikeBrandImpersonation ? 20 : 0) +
    (hasUpdateTrap && looksLikeBrandImpersonation ? 18 : 0) +
    (tooManyNumericSegments ? 10 : 0) +
    (isShortener ? 12 : 0)
  );
  let overall = clampPercent((sourceRisk * 0.35) + (identityRisk * 0.30) + (behaviorRisk * 0.35));
  if (permissionRisk) {
    overall = clampPercent(overall + permissionRisk);
  }
  const riskLevel = overall >= 70 ? "high" : overall >= 40 ? "medium" : "low";

  let summary = "APK risk estimated from source trust, naming integrity, and suspicious behavioral indicators.";
  if (isSha256) {
    summary = "Hash-based submission detected; risk estimated from source trust and suspicious string indicators.";
  }
  if (unknownHost) {
    summary = "APK source URL is untrusted; risk estimated from source trust, naming integrity, and suspicious indicators.";
  }
  const redFlagCount = [
    hasSuspiciousWords,
    looksLikeBrandImpersonation,
    hasExecutableMasquerade,
    isShortener,
    unknownHost,
    tooManyNumericSegments,
    hasOddChars,
    hasReadSms
  ].filter(Boolean).length;

  const signals = [];
  const safeSignals = [];

  if (sourceRisk >= 60) signals.push(`Untrusted or unknown source (${source}).`);
  if (sourceRisk <= 20 && source && source !== "Unknown") safeSignals.push(`Known store source (${source}).`);
  if (unknownHost) signals.push("APK source host is unrecognized.");
  if (isShortener) signals.push("URL shortener used for APK source.");
  if (hasSuspiciousWords) signals.push("APK name includes mod/crack/unlock keywords.");
  if (looksLikeBrandImpersonation) signals.push("APK name appears to impersonate a brand.");
  if (hasExecutableMasquerade) signals.push("Filename suggests a non-APK executable.");
  if (hasOddChars) signals.push("Unusual characters in APK identifier.");
  if (longToken) signals.push("Very long APK identifier.");
  if (tooManyNumericSegments) signals.push("Multiple numeric segments in APK identifier.");
  if (hasUpdateTrap) signals.push("Update/security wording used to create urgency.");
  if (hasReadSms) signals.push("Requests SMS read permission (READ_SMS).");
  if (isPackage) safeSignals.push("Valid package name format detected.");
  if (isSha256) safeSignals.push("SHA-256 hash provided.");

  return {
    riskScore: overall,
    confidence: clampPercent(62 + (redFlagCount * 6) + (sourceRisk >= 60 ? 6 : 0)),
    riskLevel,
    summary,
    signals,
    safeSignals,
    factors: [
      { name: "Source trust", score: sourceRisk },
      { name: "Identity integrity", score: identityRisk },
      { name: "Behavioral indicators", score: behaviorRisk },
      ...(permissionRisk ? [{ name: "Permission risk (READ_SMS)", score: permissionRisk }] : [])
    ]
  };
}

function normalizePermissionsInput(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((value) => String(value || "").trim()).filter(Boolean);
  }
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((value) => String(value || "").trim()).filter(Boolean);
        }
      } catch {
        // Fall back to splitting below.
      }
    }
    return trimmed.split(/[,;\n]+/).map((value) => String(value || "").trim()).filter(Boolean);
  }
  return [];
}

function extractPackageFromApkUrl(rawValue) {
  const value = String(rawValue || "").trim();
  if (!/^https?:\/\//i.test(value)) return "";

  try {
    const parsed = new URL(value);
    const packagePattern = /^[a-z][a-z0-9_]*(\.[a-z0-9_]+){1,}$/i;
    const queryKeys = ["id", "package", "pkg", "appid", "bundleid"];

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

function normalizeApkInput(apkValue) {
  const apk = String(apkValue || "").trim();
  if (!apk) return "";

  const packagePattern = /^[a-z][a-z0-9_]*(\.[a-z0-9_]+){1,}$/i;
  const isSha256 = /^[a-f0-9]{64}$/i.test(apk);
  const isPackage = packagePattern.test(apk);
  const isApkFileName = /^[a-z0-9._ -]+\.apk$/i.test(apk) && !/[\\/]/.test(apk);
  const isApkPath = /(?:^|[\\/])[^\\/]+\.apk$/i.test(apk);

  if (isSha256 || isPackage || isApkFileName || isApkPath) {
    return apk;
  }

  const extractedPackage = extractPackageFromApkUrl(apk);
  return extractedPackage || apk;
}

function isValidApkInput(apkValue) {
  const apk = normalizeApkInput(apkValue);
  if (!apk) return false;
  const isSha256 = /^[a-f0-9]{64}$/i.test(apk);
  const isPackage = /^[a-z][a-z0-9_]*(\.[a-z0-9_]+){1,}$/i.test(apk);
  const isApkFileName = /^[a-z0-9._ -]+\.apk$/i.test(apk) && !/[\\/]/.test(apk);
  const isApkPath = /(?:^|[\\/])[^\\/]+\.apk$/i.test(apk);
  return isSha256 || isPackage || isApkFileName || isApkPath;
}

async function llmApkAnalysis(apkValue, sourceValue, heuristic) {
  const prompt = `
  Return strict JSON only:
  {"riskScore":0-100,"confidence":0-100,"riskLevel":"low|medium|high","summary":"<=20 words","factors":[{"name":"factor","score":0-100}]}
  Use only the evidence below. Keep 3-5 factors. If evidence is limited, keep confidence modest.
  APK_INPUT: ${apkValue}
  SOURCE: ${sourceValue}
  HEURISTIC_SCORE: ${heuristic.riskScore}
  HEURISTIC_SUMMARY: ${heuristic.summary}
  HEURISTIC_SIGNALS: ${Array.isArray(heuristic.signals) ? heuristic.signals.slice(0, 5).join(" | ") : "none"}
  HEURISTIC_SAFE_SIGNALS: ${Array.isArray(heuristic.safeSignals) ? heuristic.safeSignals.slice(0, 3).join(" | ") : "none"}
    `.trim();

  const llm = await callLlmRiskAssessment(prompt, heuristic);
  const blended = blendRisk(llm, heuristic, 0.62);
  if (heuristic.riskScore >= 70 && blended.riskScore < 65) {
    blended.riskScore = 65;
    blended.riskLevel = "high";
  } else if (heuristic.riskScore >= 55 && blended.riskScore < 50) {
    blended.riskScore = 50;
    blended.riskLevel = "medium";
  }
  return blended;
}

function baseEmailHeuristic(emailTextValue) {
  const text = String(emailTextValue || "").trim();
  const lower = text.toLowerCase();

  const hasFrom = /^from:/im.test(text);
  const hasReplyTo = /^reply-to:/im.test(text);
  const hasSpfFail = /(spf=fail|spf:\s*fail|received-spf:\s*fail)/i.test(text);
  const hasDkimFail = /(dkim=fail|dkim:\s*fail)/i.test(text);
  const hasDmarcFail = /(dmarc=fail|dmarc:\s*fail)/i.test(text);
  const phishingWords = ["urgent", "verify", "suspend", "click now"];
  const urgentHits = phishingWords.filter((word) => lower.includes(word)).length;
  const linkMatches = text.match(/https?:\/\/[^\s)>"']+/gi) || [];
  const fromHeader = (text.match(/^from:\s*(.+)$/im) || [])[1] || "";
  const replyHeader = (text.match(/^reply-to:\s*(.+)$/im) || [])[1] || "";
  const returnHeader = (text.match(/^return-path:\s*(.+)$/im) || [])[1] || "";
  const subjectHeader = (text.match(/^subject:\s*(.+)$/im) || [])[1] || "";
  const fromDomain = (fromHeader.match(/@([a-z0-9.-]+\.[a-z]{2,})/i) || [])[1] || "";
  const replyDomain = (replyHeader.match(/@([a-z0-9.-]+\.[a-z]{2,})/i) || [])[1] || "";
  const returnDomain = (returnHeader.match(/@([a-z0-9.-]+\.[a-z]{2,})/i) || [])[1] || "";
  const domainMismatch = !!(fromDomain && replyDomain && fromDomain.toLowerCase() !== replyDomain.toLowerCase());
  const returnMismatch = !!(fromDomain && returnDomain && fromDomain.toLowerCase() !== returnDomain.toLowerCase());
  const shortenerPattern = /(bit\.ly|tinyurl\.com|t\.co|cutt\.ly|shorturl\.at)/i;
  const shortenedCount = linkMatches.filter((u) => shortenerPattern.test(u)).length;
  const mismatchHint = /(display name|spoof|lookalike|impersonat)/i.test(lower);
  const attachmentHint = /(attachment|\.zip|\.exe|\.js|\.scr|macro|enable content|html attachment|password protected)/i.test(lower);
  const credentialHarvestHint = /(password|otp|one[- ]time|verification code|bank|wallet|kyc|account locked|unusual activity)/i.test(lower);
  const moneyPressureHint = /(wire transfer|crypto|bitcoin|usdt|gift card|pay now|overdue|penalty)/i.test(lower);
  const threatWords = /(lawsuit|legal action|terminate|deactivate|breach|compromised)/i.test(lower);
  const suspiciousTldPattern = /\.(zip|mov|click|cam|work|country|gq|tk|ml)(\/|$)/i;
  const suspiciousTldCount = linkMatches.filter((u) => suspiciousTldPattern.test(u)).length;
  const atSymbolLinkCount = linkMatches.filter((u) => /@/.test(u)).length;
  const htmlBody = /<html|<body|<a\s+href=/i.test(text);
  const manyExclamations = (text.match(/!/g) || []).length >= 3;
  const allCapsWords = (text.match(/\b[A-Z]{4,}\b/g) || []).length;
  const highCapsPressure = allCapsWords >= 4;
  const subjectHits = phishingWords.filter((word) => subjectHeader.toLowerCase().includes(word)).length;
  const fromDisplay = (fromHeader.match(/^(?:"?([^"<]+)"?\s*)</) || [])[1] || "";
  const displayLower = fromDisplay.toLowerCase();
  const emailBrandRoots = {
    paypal: ["paypal.com"],
    microsoft: ["microsoft.com", "outlook.com", "live.com", "office.com"],
    apple: ["apple.com", "icloud.com", "me.com"],
    google: ["google.com", "gmail.com", "g.co"],
    amazon: ["amazon.com", "amazon.in", "amazon.co.uk"],
    netflix: ["netflix.com"],
    facebook: ["facebook.com", "fb.com"],
    instagram: ["instagram.com"],
    whatsapp: ["whatsapp.com"]
  };
  const displayBrandMismatch = Object.entries(emailBrandRoots).some(([brand, roots]) => {
    if (!displayLower.includes(brand)) return false;
    if (!fromDomain) return true;
    return !roots.some((root) => fromDomain.toLowerCase() === root || fromDomain.toLowerCase().endsWith(`.${root}`));
  });
  const fromSuspiciousTld = /\.(zip|mov|click|cam|work|country|gq|tk|ml)$/i.test(fromDomain);
  const fromWatchTld = /\.(top|xyz|site|icu|sbs|rest|bar|cfd)$/i.test(fromDomain);
  const fromPunycode = /xn--/.test(fromDomain);
  const fromHyphenHeavy = (fromDomain.match(/-/g) || []).length >= 2;
  let linkTextMismatchCount = 0;
  if (htmlBody) {
    const anchorRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([^<]{3,})<\/a>/gi;
    let match = null;
    while ((match = anchorRegex.exec(text)) !== null) {
      const hrefValue = String(match[1] || "");
      const visibleText = String(match[2] || "");
      const hrefParsed = normalizeUrl(hrefValue);
      const visibleUrlMatch = visibleText.match(/https?:\/\/[^\s<]+/i) || visibleText.match(/[a-z0-9.-]+\.[a-z]{2,}/i);
      if (!hrefParsed || !visibleUrlMatch) continue;
      const visibleParsed = normalizeUrl(visibleUrlMatch[0]);
      if (!visibleParsed) continue;
      if (hrefParsed.hostname.toLowerCase() !== visibleParsed.hostname.toLowerCase()) {
        linkTextMismatchCount += 1;
      }
    }
  }

  const authRisk = clampPercent(
    (hasSpfFail ? 40 : 0) +
    (hasDkimFail ? 30 : 0) +
    (hasDmarcFail ? 25 : 0) +
    (!hasFrom ? 12 : 0) +
    (hasReplyTo ? 10 : 0) +
    (domainMismatch ? 20 : 0) +
    (returnMismatch ? 18 : 0) +
    (fromPunycode ? 18 : 0) +
    (fromSuspiciousTld ? 18 : 0) +
    (fromWatchTld ? 10 : 0) +
    (fromHyphenHeavy ? 8 : 0)
  );
  const socialRisk = clampPercent(
    (urgentHits * 11) +
    (subjectHits * 8) +
    (mismatchHint ? 16 : 0) +
    (displayBrandMismatch ? 16 : 0) +
    (credentialHarvestHint ? 20 : 0) +
    (moneyPressureHint ? 20 : 0) +
    (threatWords ? 16 : 0) +
    (manyExclamations ? 10 : 0) +
    (highCapsPressure ? 12 : 0)
  );
  const linkRisk = clampPercent(
    (linkMatches.length * 10) +
    (shortenedCount * 18) +
    (attachmentHint ? 20 : 0) +
    (domainMismatch ? 16 : 0) +
    (suspiciousTldCount * 20) +
    (atSymbolLinkCount * 16) +
    (linkTextMismatchCount * 18) +
    (htmlBody ? 8 : 0)
  );
  let overall = clampPercent((authRisk * 0.38) + (socialRisk * 0.34) + (linkRisk * 0.28));

  // Hard calibration so obvious phishing/spam cannot remain in low-risk zone.
  const redFlags = [
    hasSpfFail || hasDkimFail || hasDmarcFail,
    domainMismatch,
    shortenedCount > 0 || suspiciousTldCount > 0 || atSymbolLinkCount > 0 || linkTextMismatchCount > 0,
    credentialHarvestHint || moneyPressureHint || threatWords,
    attachmentHint,
    displayBrandMismatch,
    returnMismatch
  ].filter(Boolean).length;

  if (redFlags >= 2 && overall < 55) overall = 55;
  if (redFlags >= 3 && overall < 70) overall = 70;
  if (redFlags >= 4 && overall < 82) overall = 82;

  const riskLevel = overall >= 70 ? "high" : overall >= 40 ? "medium" : "low";

  const signals = [];
  const safeSignals = [];

  if (hasSpfFail) signals.push("SPF failed.");
  if (hasDkimFail) signals.push("DKIM failed.");
  if (hasDmarcFail) signals.push("DMARC failed.");
  if (!hasFrom) signals.push("Missing From header.");
  if (domainMismatch) signals.push("From and Reply-To domains do not match.");
  if (returnMismatch) signals.push("Return-Path mismatch.");
  if (displayBrandMismatch) signals.push("Display name implies brand not matching sender domain.");
  if (shortenedCount > 0) signals.push("Shortened links present.");
  if (suspiciousTldCount > 0) signals.push("Links use high-risk TLDs.");
  if (atSymbolLinkCount > 0) signals.push("Links contain @ symbol.");
  if (linkTextMismatchCount > 0) signals.push("Link text does not match actual URL.");
  if (credentialHarvestHint) signals.push("Requests passwords/OTP or account verification.");
  if (moneyPressureHint) signals.push("Payment or money pressure wording detected.");
  if (attachmentHint) signals.push("Attachment/script/macro mention detected.");
  if (urgentHits > 0) signals.push("Urgent or pressure language detected.");
  if (threatWords) signals.push("Threatening or legal language detected.");
  if (highCapsPressure) signals.push("Excessive ALL-CAPS pressure.");

  if (!hasSpfFail && !hasDkimFail && !hasDmarcFail && hasFrom) {
    safeSignals.push("Authentication headers present without obvious failures.");
  }
  if (linkMatches.length === 0) safeSignals.push("No links detected in message.");

  return {
    riskScore: overall,
    confidence: clampPercent(72 + (redFlags * 5)),
    riskLevel,
    summary: "Email risk estimated from authentication indicators, social engineering signals, and suspicious links/attachments.",
    signals,
    safeSignals,
    factors: [
      { name: "Authentication checks", score: authRisk },
      { name: "Social engineering language", score: socialRisk },
      { name: "Link/attachment indicators", score: linkRisk }
    ]
  };
}

async function llmEmailAnalysis(emailTextValue, heuristic) {
  const prompt = `
  Return strict JSON only:
  {"riskScore":0-100,"confidence":0-100,"riskLevel":"low|medium|high","summary":"<=20 words","factors":[{"name":"factor","score":0-100}]}
  Use only the evidence below. Keep 3-5 factors. If evidence is limited, keep confidence modest.
  EMAIL_TEXT:
  ${emailTextValue.slice(0, 2000)}
  HEURISTIC_SCORE: ${heuristic.riskScore}
  HEURISTIC_SUMMARY: ${heuristic.summary}
  HEURISTIC_SIGNALS: ${Array.isArray(heuristic.signals) ? heuristic.signals.slice(0, 5).join(" | ") : "none"}
  HEURISTIC_SAFE_SIGNALS: ${Array.isArray(heuristic.safeSignals) ? heuristic.safeSignals.slice(0, 3).join(" | ") : "none"}
    `.trim();

  const llm = await callLlmRiskAssessment(prompt, heuristic);
  const blended = blendRisk(llm, heuristic, 0.58);
  // Guard rail: when heuristic is clearly high-risk, do not let model drag it too low.
  if (heuristic.riskScore >= 75 && blended.riskScore < 70) {
    blended.riskScore = 70;
    blended.riskLevel = "high";
  } else if (heuristic.riskScore >= 55 && blended.riskScore < 50) {
    blended.riskScore = 50;
    blended.riskLevel = "medium";
  }
  return blended;
}

function buildSafeLinkOptions() {
  return shuffle([
    { id: "avoid", text: "Do not open this link. Use the official app/site manually." },
    { id: "inspect", text: "Verify domain and path carefully, then open only if it exactly matches the official source." },
    { id: "click_now", text: "Open the link immediately so you do not miss the deadline." },
    { id: "share", text: "Share this link with others and ask them to test it first." }
  ]);
}

function evaluateSafeLink(urlValue) {
  const parsed = normalizeUrl(urlValue);
  if (!parsed) {
    return {
      riskScore: 95,
      riskLevel: "high",
      correctOption: "avoid",
      explanation: "This URL is malformed or invalid. Treat it as unsafe and use an official source manually."
    };
  }

  const heuristic = baseUrlHeuristic(parsed.href);
  const host = parsed.hostname.toLowerCase();
  const trustedRoots = ["google.com", "microsoft.com", "apple.com", "adobe.com", "amazon.com", "paypal.com", "bankofamerica.com"];
  const trustedDomain = trustedRoots.some((root) => host === root || host.endsWith(`.${root}`));
  const isHttps = parsed.protocol === "https:";

  let riskScore = Number(heuristic.riskScore || 0);
  if (trustedDomain && isHttps && riskScore < 55) {
    riskScore = Math.max(8, riskScore - 18);
  }
  if (!isHttps) {
    riskScore = Math.max(riskScore, 55);
  }
  riskScore = clampPercent(riskScore);

  const riskLevel = riskScore >= 70 ? "high" : riskScore >= 40 ? "medium" : "low";
  const correctOption = riskScore >= 45 ? "avoid" : "inspect";
  const explanation = correctOption === "avoid"
    ? `Risk is ${riskScore}% (${riskLevel}). This link has suspicious structure/signals, so avoid opening it and verify via official channels.`
    : `Risk is ${riskScore}% (${riskLevel}). No strong red flags found, but still verify the exact domain/path before opening.`;

  return { riskScore, riskLevel, correctOption, explanation };
}

function buildFallbackSafeLinkQuestion() {
  const suspiciousUrls = [
    "https://secure-paypa1-alerts.click/verify-now",
    "http://update-account-security.work/login",
    "https://microsoft-reset-support.gq/restore",
    "https://accounts-google-security.cam/session-check",
    "https://amazon-billing-review.zip/invoice"
  ];
  const saferUrls = [
    "https://accounts.google.com/signin/v2/challenge",
    "https://www.adobe.com/account/security",
    "https://www.microsoft.com/security",
    "https://www.apple.com/privacy/",
    "https://www.paypal.com/signin"
  ];
  const contexts = [
    "You received this link in a message saying your account needs urgent action.",
    "A coworker forwarded this link and asked if it is safe.",
    "This link appeared in a social media direct message.",
    "You found this link in an email about account verification."
  ];

  const risky = Math.random() < 0.72;
  const url = risky ? randomPick(suspiciousUrls) : randomPick(saferUrls);
  const evaluated = evaluateSafeLink(url);

  return {
    question: "What is the safest action for this link?",
    context: randomPick(contexts),
    url,
    options: buildSafeLinkOptions(),
    correctOption: evaluated.correctOption,
    explanation: evaluated.explanation,
    riskScore: evaluated.riskScore,
    riskLevel: evaluated.riskLevel,
    difficulty: "beginner"
  };
}

async function buildLlmSafeLinkQuestion() {
  const seed = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const prompt = `
You are creating a Safe Link Sprint cybersecurity game question.
Return strict JSON only:
{
  "question": "string",
  "context": "string",
  "url": "string",
  "difficulty": "beginner"
}
Rules:
- Scenario must vary each time.
- Use practical, realistic link examples.
- Keep language simple and clear.
- Seed: ${seed}
  `.trim();

  const fallback = buildFallbackSafeLinkQuestion();
  const parsed = await tryOllamaJson(
    prompt,
    "You are a cybersecurity training assistant. Return strict JSON only."
  );
  if (!parsed) return fallback;

  const question = String(parsed.question || fallback.question).slice(0, 220);
  const context = String(parsed.context || fallback.context).slice(0, 240);
  const rawUrl = String(parsed.url || fallback.url).trim();
  const normalized = normalizeUrl(rawUrl);
  const safeUrl = normalized ? normalized.href : fallback.url;
  const evaluated = evaluateSafeLink(safeUrl);

  return {
    question,
    context,
    url: safeUrl,
    options: buildSafeLinkOptions(),
    correctOption: evaluated.correctOption,
    explanation: evaluated.explanation,
    riskScore: evaluated.riskScore,
    riskLevel: evaluated.riskLevel,
    difficulty: "beginner"
  };
}

function buildMalwareOptions() {
  return shuffle([
    { id: "quarantine", text: "Do not run it. Quarantine/delete it and report to security." },
    { id: "scan_first", text: "Scan in a trusted security tool/sandbox before any execution." },
    { id: "run_now", text: "Run it now because the source looks urgent." },
    { id: "disable_security", text: "Turn off antivirus first so installation does not fail." }
  ]);
}

function evaluateMalwareScenario(scenario) {
  const source = String(scenario?.source || "").toLowerCase();
  const fileName = String(scenario?.fileName || "").toLowerCase();
  const requested = String(scenario?.requestedAccess || "").toLowerCase();
  const behavior = String(scenario?.behaviorHint || "").toLowerCase();

  const highRiskHits = [
    /(telegram|whatsapp|discord|unknown|forum|third[- ]party|random)/.test(source),
    /\.(exe|scr|bat|js|vbs|ps1|apk)$/.test(fileName),
    /(macro|powershell|script|admin|accessibility|device admin|root)/.test(requested),
    /(encrypt|ransom|steal|credential|keylog|persistence|command and control|disable security)/.test(behavior)
  ].filter(Boolean).length;

  const mediumRiskHits = [
    /(direct download|email attachment|shared drive)/.test(source),
    /(invoice|urgent|patch|update|free|crack|mod)/.test(fileName),
    /(contacts|sms|call log|overlay|unknown sources|install packages)/.test(requested),
    /(suspicious|unexpected|outbound|hidden process|startup entry)/.test(behavior)
  ].filter(Boolean).length;

  let riskScore = clampPercent((highRiskHits * 26) + (mediumRiskHits * 11));
  if (highRiskHits >= 2 && riskScore < 72) riskScore = 72;
  if (highRiskHits >= 3 && riskScore < 84) riskScore = 84;

  const riskLevel = riskScore >= 70 ? "high" : riskScore >= 40 ? "medium" : "low";
  const correctOption = riskScore >= 60 ? "quarantine" : "scan_first";
  const explanation = correctOption === "quarantine"
    ? `Risk is ${riskScore}% (${riskLevel}). Multiple malware indicators exist. Do not execute; quarantine and report.`
    : `Risk is ${riskScore}% (${riskLevel}). No immediate critical red flags, but scan/sandbox before any execution.`;

  return { riskScore, riskLevel, correctOption, explanation };
}

function buildFallbackMalwareQuestion() {
  const scenarios = [
    {
      context: "A file named urgent_invoice_viewer.exe arrived from an unknown Telegram contact.",
      source: "Unknown Telegram user",
      fileName: "urgent_invoice_viewer.exe",
      requestedAccess: "Asks for admin rights and to disable antivirus.",
      behaviorHint: "Claims urgent payment issue and asks immediate execution."
    },
    {
      context: "You downloaded a cracked game mod from a random forum.",
      source: "Third-party forum download",
      fileName: "premium_patch.bat",
      requestedAccess: "Requests script execution and startup persistence.",
      behaviorHint: "Promises free premium unlock after running script."
    },
    {
      context: "A coworker shared a utility tool from a shared drive with no signature.",
      source: "Internal shared drive (unverified file)",
      fileName: "printer_helper_tool.exe",
      requestedAccess: "Requests normal file access only.",
      behaviorHint: "No urgent pressure but publisher is unknown."
    },
    {
      context: "You found a mobile app APK outside Play Store.",
      source: "Direct download link from social media",
      fileName: "bank_bonus_offer.apk",
      requestedAccess: "Requests SMS, contacts, accessibility, and overlay permissions.",
      behaviorHint: "Asks to allow unknown sources and install quickly."
    }
  ];

  const picked = randomPick(scenarios);
  const evaluated = evaluateMalwareScenario(picked);
  return {
    question: "What is the safest response to this potential malware file?",
    ...picked,
    options: buildMalwareOptions(),
    correctOption: evaluated.correctOption,
    explanation: evaluated.explanation,
    riskScore: evaluated.riskScore,
    riskLevel: evaluated.riskLevel,
    difficulty: "beginner"
  };
}

async function buildLlmMalwareQuestion() {
  const seed = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const prompt = `
You are creating a Malware Defense game scenario for beginners.
Return strict JSON only:
{
  "question": "string",
  "context": "string",
  "source": "string",
  "fileName": "string",
  "requestedAccess": "string",
  "behaviorHint": "string",
  "difficulty": "beginner"
}
Rules:
- Generate realistic malware-defense situations.
- Keep text short and clear.
- Scenario must vary each time.
- Seed: ${seed}
  `.trim();

  const fallback = buildFallbackMalwareQuestion();
  const parsed = await tryOllamaJson(
    prompt,
    "You are a malware-defense scenario generator. Return strict JSON only."
  );
  if (!parsed) return fallback;

  const scenario = {
    question: String(parsed.question || fallback.question).slice(0, 220),
    context: String(parsed.context || fallback.context).slice(0, 240),
    source: String(parsed.source || fallback.source).slice(0, 160),
    fileName: String(parsed.fileName || fallback.fileName).slice(0, 140),
    requestedAccess: String(parsed.requestedAccess || fallback.requestedAccess).slice(0, 220),
    behaviorHint: String(parsed.behaviorHint || fallback.behaviorHint).slice(0, 220),
    difficulty: "beginner"
  };
  const evaluated = evaluateMalwareScenario(scenario);

  return {
    ...scenario,
    options: buildMalwareOptions(),
    correctOption: evaluated.correctOption,
    explanation: evaluated.explanation,
    riskScore: evaluated.riskScore,
    riskLevel: evaluated.riskLevel
  };
}

function buildMalwareChainStages(riskScore) {
  const detectCorrect = riskScore >= 40 ? "detect_suspicious" : "detect_monitor";
  const containCorrect = riskScore >= 70 ? "contain_isolate" : (riskScore >= 40 ? "contain_sandbox" : "contain_monitor");
  const reportCorrect = riskScore >= 40 ? "report_security" : "report_log";

  return [
    {
      key: "detect",
      title: "Step 1 of 3: Detect",
      question: "What is your first triage decision?",
      options: [
        { id: "detect_suspicious", text: "Mark as suspicious and halt execution immediately." },
        { id: "detect_monitor", text: "Treat as low risk and monitor only for now." },
        { id: "detect_run", text: "Run it first to see what happens." }
      ],
      correctOption: detectCorrect,
      explanation: detectCorrect === "detect_suspicious"
        ? "This scenario has enough risk indicators to block execution at triage."
        : "Signals are limited, so controlled monitoring can be acceptable before escalation."
    },
    {
      key: "contain",
      title: "Step 2 of 3: Contain",
      question: "Choose the best containment action.",
      options: [
        { id: "contain_isolate", text: "Isolate/quarantine endpoint and block related artifacts." },
        { id: "contain_sandbox", text: "Detonate in sandbox and scan before any endpoint execution." },
        { id: "contain_monitor", text: "Do not isolate yet; keep observing telemetry only." }
      ],
      correctOption: containCorrect,
      explanation: containCorrect === "contain_isolate"
        ? "High risk requires immediate isolation to prevent spread and data loss."
        : containCorrect === "contain_sandbox"
          ? "Medium risk is best handled with controlled sandbox analysis before execution."
          : "Low-risk signals may be handled through monitoring and routine controls."
    },
    {
      key: "report",
      title: "Step 3 of 3: Report",
      question: "How should this incident be reported?",
      options: [
        { id: "report_security", text: "Escalate to security with IOC/context and user timeline." },
        { id: "report_log", text: "Log the event in ticketing with evidence and close if clean." },
        { id: "report_ignore", text: "No report needed if nothing executed yet." }
      ],
      correctOption: reportCorrect,
      explanation: reportCorrect === "report_security"
        ? "Suspicious malware indicators require formal escalation with evidence."
        : "For low-risk outcomes, documented logging and closure can be appropriate."
    }
  ];
}

async function ensureAnalyzerLogFile() {
  await fs.mkdir(runtimeDataDir, { recursive: true });
  try {
    await fs.access(analyzerCsvPath);
  } catch {
    await fs.writeFile(analyzerCsvPath, analyzerCsvHeader, "utf8");
  }

  try {
    await fs.access(analyzerJsonPath);
  } catch {
    await fs.writeFile(analyzerJsonPath, "[]", "utf8");
  }

  try {
    const logs = await readAnalyzerLogs();
    let changed = false;
    const normalized = logs.map((entry) => {
      const next = { ...entry };
      if (!next.id) {
        next.id = generateLogId();
        changed = true;
      }
      if (!next.origin) {
        next.origin = "website";
        changed = true;
      }
      return next;
    });
    if (changed) {
      await writeAnalyzerLogs(normalized);
    }
  } catch {
    await fs.writeFile(analyzerJsonPath, "[]", "utf8");
    await fs.writeFile(analyzerCsvPath, analyzerCsvHeader, "utf8");
  }
}

async function ensureAgentCaseFile() {
  await fs.mkdir(runtimeDataDir, { recursive: true });
  try {
    await fs.access(agentCasesJsonPath);
  } catch {
    await fs.writeFile(agentCasesJsonPath, "[]", "utf8");
  }
}

async function readAgentCases() {
  const raw = await fs.readFile(agentCasesJsonPath, "utf8");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

async function writeAgentCases(cases) {
  await fs.writeFile(agentCasesJsonPath, JSON.stringify(cases), "utf8");
}

async function appendAgentCase(entry) {
  const cases = await readAgentCases();
  cases.push(entry);
  const trimmed = cases.slice(-500);
  await writeAgentCases(trimmed);
}

function withToolTimeout(promise, timeoutMs, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs))
  ]);
}

function withTimeoutFallback(promise, timeoutMs, fallback, label) {
  if (!timeoutMs || timeoutMs <= 0) {
    return Promise.resolve(promise).catch(() => fallback);
  }
  return withToolTimeout(promise, timeoutMs, label || "task")
    .catch(() => fallback);
}

async function runWithRetry(taskFn, retries = 1) {
  let lastError;
  for (let i = 0; i <= retries; i += 1) {
    try {
      return await taskFn();
    } catch (err) {
      lastError = err;
      if (i === retries) {
        throw lastError;
      }
    }
  }
  throw lastError || new Error("Task failed");
}

function enforceAgentRateLimit(userEmail) {
  const key = normalizeUserEmail(userEmail);
  const now = Date.now();
  const current = (agentRateWindowByEmail.get(key) || []).filter((ts) => (now - ts) < agentRateWindowMs);
  if (current.length >= agentRateLimitPerWindow) {
    return false;
  }
  current.push(now);
  agentRateWindowByEmail.set(key, current);
  return true;
}

function normalizeAssistantContext(raw) {
  if (!raw || typeof raw !== "object") return null;
  const type = String(raw.analyzerType || "").trim().toLowerCase();
  const analyzerType = ["url", "apk", "email"].includes(type) ? type : "";
  const inputRaw = raw.input && typeof raw.input === "object" ? raw.input : {};
  const analysisRaw = raw.analysis && typeof raw.analysis === "object" ? raw.analysis : null;

  const context = {
    analyzerType,
    input: {
      currentInput: String(inputRaw.currentInput || "").trim().slice(0, 400),
      source: String(inputRaw.source || "").trim().slice(0, 120)
    },
    analysis: null
  };

  if (!analysisRaw) return context;

  const level = String(analysisRaw.riskLevel || "").trim().toLowerCase();
  context.analysis = {
    riskScore: clampPercent(analysisRaw.riskScore),
    confidence: clampPercent(analysisRaw.confidence),
    riskLevel: ["low", "medium", "high"].includes(level) ? level : "low",
    summary: String(analysisRaw.summary || "").trim().slice(0, 320),
    factors: Array.isArray(analysisRaw.factors)
      ? analysisRaw.factors.slice(0, 6).map((item) => ({
        name: String(item?.name || "Signal").trim().slice(0, 80),
        score: clampPercent(item?.score)
      }))
      : []
  };
  return context;
}

function detectAssistantMode(question, context) {
  const text = String(question || "").toLowerCase();
  const type = String(context?.analyzerType || "").toLowerCase();
  if (type) return type;
  if (/https?:\/\/|www\.|phish|phishing|suspicious|link|url/i.test(text)) return "url";
  if (/\.apk\b|package|install/i.test(text)) return "apk";
  if (/email|subject:|from:|attachment|inbox/i.test(text)) return "email";
  if (/malware|virus|trojan|ransomware|exploit/i.test(text)) return "url";
  if (/password|credential|login|account|2fa|multifactor/i.test(text)) return "general";
  return "general";
}

function buildAssistantFallbackReply(message, rawContext) {
  const question = String(message || "").trim();
  if (!question) {
    return "I could not read your question. Share the URL, APK, or email details and I will give a focused safety check.";
  }

  const context = normalizeAssistantContext(rawContext);
  const mode = detectAssistantMode(question, context);
  const lower = question.toLowerCase();
  const riskScore = Number(context?.analysis?.riskScore || 0);
  const confidence = Number(context?.analysis?.confidence || 0);
  const summary = String(context?.analysis?.summary || "").trim();
  const factors = Array.isArray(context?.analysis?.factors) ? context.analysis.factors : [];
  const factorNames = factors
    .slice()
    .sort((a, b) => Number(b?.score || 0) - Number(a?.score || 0))
    .slice(0, 2)
    .map((f) => String(f?.name || "").trim())
    .filter(Boolean);

  const topSignals = factorNames.length ? factorNames.join(" and ") : "available risk signals";
  const verdict = riskScore >= 70
    ? "high risk"
    : riskScore >= 40
      ? "moderate risk"
      : "low risk";
  const modeAction = mode === "url"
    ? "avoid logging in through that link; open the official site manually"
    : mode === "apk"
      ? "do not install until signature/source checks are complete"
      : mode === "email"
        ? "do not click links or open attachments until sender verification is complete"
        : "pause and verify the source before interacting further";

  if (/\bwhy|reason|how\b/.test(lower)) {
    const reason = summary || `the strongest indicators are ${topSignals}`;
    return `Main reason: ${reason}. Current assessment is ${verdict} (${riskScore}% risk, ${confidence}% confidence). Next step: ${modeAction}.`;
  }

  if (/\b(safe|unsafe|can i|should i|ok to|trust)\b/.test(lower)) {
    if (riskScore >= 70) {
      return `Not safe to proceed right now. Risk is ${riskScore}% with ${confidence}% confidence, and the top signals are ${topSignals}. Recommended action: ${modeAction}.`;
    }
    if (riskScore >= 40) {
      return `Use caution. Risk is ${riskScore}% (${confidence}% confidence). Verify ${topSignals} first, then proceed only if those checks pass.`;
    }
    return `No strong high-risk signal detected (${riskScore}% risk, ${confidence}% confidence), but still verify source and identity before proceeding.`;
  }

  if (/\b(what.*do|next|steps|recommend|action|protect)\b/.test(lower)) {
    return `Do this next: 1) verify source authenticity, 2) validate ${topSignals}, 3) proceed only if checks are clean. Current assessment: ${verdict} (${riskScore}% risk).`;
  }

  if (/\b(confidence|certain|sure|accuracy)\b/.test(lower)) {
    return `Confidence is ${confidence}%. This score reflects signal quality from current inputs; confirm with independent checks before trusting the result.`;
  }

  if (summary) {
    return `Based on your analysis: ${summary} Current rating is ${verdict} (${riskScore}% risk, ${confidence}% confidence). Tell me if you want explanation, safety decision, or exact next steps.`;
  }

  return `I am running in fallback mode. Share the exact ${mode === "general" ? "URL, APK, or email content" : `${mode.toUpperCase()} details`} and I will give a targeted risk explanation. For Cyber-Shield product questions, ask about URL analysis, APK checks, email scans, or phishing protection steps. If your question is unrelated, I can relate it back to cybersecurity best practices.`;
}

async function buildAssistantAiReply(message, context) {
  const systemPrompt = [
    "You are Cyber-Shield AI assistant for the Cyber-Shield project (URL/APK/Email analysis, phishing detection, incident response guidance).",
    "Use plain, simple English.",
    "Reply in 2 short sentences (max 40 words).",
    "Avoid jargon; if needed, explain in a few words.",
    "For cybersecurity questions: give a direct answer, a short reason, and the safest next step.",
    "If the question is not about Cyber-Shield, relate your answer back to cybersecurity or project features.",
    "Do not invent facts; if uncertain, say what is unknown."
  ].join(" ");

  const contextPayload = context ? JSON.stringify(context) : "";
  const trimmedContext = contextPayload.length > 600
    ? `${contextPayload.slice(0, 600)}...`
    : contextPayload;
  const userContent = context
    ? `User question: ${message}\n\nAnalyzer context:\n${trimmedContext}`
    : `User question: ${message}`;

  const ollamaModel = (process.env.OLLAMA_MODEL || "phi3").trim();
  try {
    const reply = await runOllamaChatReply(
      userContent,
      ollamaModel,
      systemPrompt,
      { numPredict: 20, numCtx: 640, temperature: 0.1 }
    );
    if (reply) {
      return { reply, modelUsed: ollamaModel, provider: "ollama", error: "" };
    }
    const fallbackContent = `User question: ${message}`;
    const fallbackReply = await runOllamaChatReply(
      fallbackContent,
      ollamaModel,
      systemPrompt,
      { numPredict: 16, numCtx: 512, temperature: 0.1 }
    );
    if (!fallbackReply) {
      const fallbackText = buildAssistantFallbackReply(message, context);
      return { reply: fallbackText, modelUsed: "fallback", provider: "ollama", error: "Empty response from Ollama." };
    }
    return { reply: fallbackReply, modelUsed: ollamaModel, provider: "ollama", error: "" };
  } catch (err) {
    const fallbackText = buildAssistantFallbackReply(message, context);
    return { reply: fallbackText, modelUsed: "fallback", provider: "ollama", error: String(err?.message || "Ollama request failed") };
  }
}

function extractFirstUrl(text) {
  const input = String(text || "");
  const match = input.match(/https?:\/\/[^\s<>"')]+/i);
  return match ? String(match[0]).trim() : "";
}

let projectFaq = null;

async function loadProjectFaq() {
  if (projectFaq) return projectFaq;
  try {
    const faqPath = path.join(staticDataDir, "project-faq.json");
    const raw = await fs.readFile(faqPath, 'utf8');
    projectFaq = JSON.parse(raw);
    return projectFaq;
  } catch (err) {
    console.error('Failed to load project FAQ:', err.message);
    return { faq: [] };
  }
}

function findFaqAnswer(question) {
  if (!projectFaq || !projectFaq.faq) return null;
  const lowerQ = String(question || '').toLowerCase().trim();
  for (const item of projectFaq.faq) {
    const faqQ = String(item.question || '').toLowerCase().trim();
    if (lowerQ.includes(faqQ) || faqQ.includes(lowerQ)) {
      return item.answer;
    }
  }
  return null;
}

function extractAssistantInputForMode(question, context, mode) {
  const fromContext = String(context?.input?.currentInput || "").trim();
  const fromQuestion = String(question || "").trim();

  if (mode === "url") {
    return extractFirstUrl(fromContext) || extractFirstUrl(fromQuestion) || fromContext;
  }
  if (mode === "apk") {
    return fromContext || fromQuestion;
  }
  if (mode === "email") {
    return fromContext || fromQuestion;
  }
  return "";
}

async function buildAgenticAssistantContext(question, context) {
  try {
    const mode = detectAssistantMode(question, context);
    if (!["url", "apk", "email"].includes(mode)) {
      return null;
    }

    const input = extractAssistantInputForMode(question, context, mode);
    if (!String(input || "").trim()) {
      return null;
    }

    if (mode === "url") {
      const data = await runUrlAnalysisInternal(input, false);
      return {
        mode,
        input,
        result: data?.result || null,
        sources: data?.sources || null
      };
    }
    if (mode === "apk") {
      const source = String(context?.input?.source || "Unknown").trim() || "Unknown";
      const permissions = normalizePermissionsInput(context?.input?.permissions);
      const data = await runApkAnalysisInternal(input, source, permissions, false);
      return {
        mode,
        input,
        source,
        result: data?.result || null
      };
    }

    const data = await runEmailAnalysisInternal(input, false);
    return {
      mode,
      inputSnippet: String(input).slice(0, 320),
      result: data?.result || null
    };
  } catch (err) {
    return {
      error: String(err?.message || "Agentic analysis unavailable")
    };
  }
}

async function buildAssistantAiReplyWithFallback(message, context, agenticContext) {
  const mergedContext = agenticContext
    ? { ...(context || {}), agentic: agenticContext }
    : context;

  const primary = await buildAssistantAiReply(message, mergedContext);
  const cleaned = String(primary.reply || "").trim();

  const isWeak = !cleaned || /i('m| am) not sure|unable to answer|unknown|cannot find/i.test(cleaned);
  if (cleaned && !isWeak) {
    return primary;
  }

  const fallbackText = buildAssistantFallbackReply(message, mergedContext);
  return {
    reply: fallbackText,
    modelUsed: primary.modelUsed || "fallback",
    provider: primary.provider || "fallback",
    error: primary.error || "primary model response not strong"
  };
}

async function buildAskAiChatReply(question, messages) {
  const safeQuestion = String(question || "").trim();
  const safeMessages = Array.isArray(messages)
    ? messages
      .filter((m) => m && typeof m === "object")
      .slice(-20)
      .map((m) => ({
        role: String(m.role || "").trim().toLowerCase() === "assistant" ? "assistant" : "user",
        content: String(m.content || "").trim().slice(0, 1600)
      }))
      .filter((m) => m.content)
    : [];

  const inputMessages = safeMessages.length
    ? safeMessages
    : [{ role: "user", content: safeQuestion }];
  const systemMessage = "Use simple, easy English for all age groups. Keep answers short, clear, and calm. Avoid jargon and explain technical words in plain language. If context is missing, ask one concise clarifying question.";
  const prompt = inputMessages.map((m) => `${m.role === "assistant" ? "Assistant" : "User"}: ${m.content}`).join("\n");

  const ollamaModel = (process.env.OLLAMA_MODEL || "phi3").trim();
  try {
    const reply = await runOllamaChatReply(
      prompt,
      ollamaModel,
      systemMessage
    );
    if (!reply) return { reply: "", error: "Empty response from Ollama." };
    return { reply, modelUsed: ollamaModel, error: "" };
  } catch (err) {
    return { reply: "", error: String(err?.message || "Ollama request failed") };
  }
}

function buildAgentFallbackDecision(objective, providedInput, providedSource, email, stepsTaken, preferredMode) {
  if (stepsTaken >= 1) {
    return { done: true, finalSummary: "Investigation loop completed using fallback decision policy." };
  }
  const text = String(objective || "").toLowerCase();
  const input = String(providedInput || "").trim();
  const mode = String(preferredMode || "").toLowerCase();

  // Respect requested analyzer mode first so APK/Email investigations don't fall back to URL.
  if (mode === "url" && input) {
    return { done: false, tool: "analyzeUrl", args: { url: input }, note: "Fallback: running URL analysis." };
  }
  if (mode === "apk" && input) {
    return { done: false, tool: "analyzeApk", args: { input, source: String(providedSource || "Unknown") }, note: "Fallback: running APK analysis." };
  }
  if (mode === "email" && input) {
    return { done: false, tool: "analyzeEmail", args: { text: input }, note: "Fallback: running email analysis." };
  }

  if (input && (text.includes("url") || /^https?:\/\//i.test(input) || /\bwww\./i.test(input))) {
    return { done: false, tool: "analyzeUrl", args: { url: input }, note: "Fallback: running URL analysis." };
  }
  if (input && (text.includes("apk") || /\.apk$/i.test(input) || isValidApkInput(input))) {
    return { done: false, tool: "analyzeApk", args: { input, source: String(providedSource || "Unknown") }, note: "Fallback: running APK analysis." };
  }
  if (input && (text.includes("email") || input.includes("From:") || input.includes("@"))) {
    return { done: false, tool: "analyzeEmail", args: { text: input }, note: "Fallback: running email analysis." };
  }
  return { done: false, tool: "getUserHistory", args: { email }, note: "Fallback: retrieving user history first." };
}

function sanitizeAgentDecision(raw, fallback) {
  if (!raw || typeof raw !== "object") return fallback;
  const done = Boolean(raw.done);
  const tool = String(raw.tool || "").trim();
  const args = raw.args && typeof raw.args === "object" ? raw.args : {};
  const note = String(raw.note || "").trim();
  const finalSummary = String(raw.finalSummary || "").trim();
  const confidence = clampPercent(raw.confidence);
  const evidence = Array.isArray(raw.evidence) ? raw.evidence.slice(0, 6).map((v) => String(v || "").slice(0, 160)) : [];
  return { done, tool, args, note, finalSummary, confidence, evidence };
}

async function planAgentDecision(payload) {
  const fallback = buildAgentFallbackDecision(
    payload.objective,
    payload.input,
    payload.source,
    payload.email,
    payload.steps.length,
    payload.mode
  );
  return fallback;
}

async function runUrlAnalysisInternal(urlValue, saveHistory = true) {
  const heuristic = baseUrlHeuristic(urlValue);
  const parsedUrl = normalizeUrl(urlValue);
  const timeoutLabel = (label, ms) => `${label} timed out after ${ms}ms`;
  const urlLlmLabel = "Ollama URL model";
  const gsbFallback = {
    source: "Google Safe Browsing",
    available: false,
    matched: false,
    error: timeoutLabel("Google Safe Browsing", analyzerSourceTimeoutMs),
    riskScore: 0,
    confidence: 0,
    summary: "Safe Browsing source timeout."
  };
  const abuseFallback = {
    source: "AbuseIPDB IP reputation",
    available: false,
    matched: false,
    error: timeoutLabel("AbuseIPDB", analyzerSourceTimeoutMs),
    riskScore: 0,
    confidence: 0,
    summary: "AbuseIPDB source timeout.",
    evidence: []
  };
  const ollamaFallback = {
    source: urlLlmLabel,
    available: false,
    matched: false,
    error: analyzerFastMode ? "Fast mode: LLM skipped" : timeoutLabel("LLM", analyzerLlmTimeoutMs),
    riskScore: heuristic.riskScore,
    confidence: 0,
    summary: analyzerFastMode ? "AI skipped in fast mode." : "AI source timeout."
  };
  const whoisFallback = {
    domainRisk: 0,
    reasons: [timeoutLabel("WHOIS lookup", analyzerWhoisTimeoutMs)],
    domain: parsedUrl?.hostname || "",
    available: false,
    ageDays: null
  };

  const safeBrowsingSource = await withTimeoutFallback(
    evaluateGoogleSafeBrowsing(urlValue),
    analyzerSourceTimeoutMs,
    gsbFallback,
    "gsb-url"
  );
  const abuseIpSource = await withTimeoutFallback(
    evaluateAbuseIpdb(urlValue),
    analyzerSourceTimeoutMs,
    abuseFallback,
    "abuse-ip"
  );
  const domainIntel = analyzerFastMode
    ? { domainRisk: 0, reasons: ["WHOIS skipped in fast mode."], domain: parsedUrl?.hostname || "", available: false, ageDays: null }
    : await withTimeoutFallback(domainAgent(urlValue), analyzerWhoisTimeoutMs, whoisFallback, "whois");
  const domainSource = buildDomainAgeSource(domainIntel);
  const llmEvidence = { urls: [urlValue], safeBrowsing: safeBrowsingSource, whois: domainSource, abuseIpdb: abuseIpSource };
  const ollamaSource = analyzerFastMode
    ? ollamaFallback
    : await withTimeoutFallback(
        runOllamaUrlAssessment(urlValue, heuristic, llmEvidence),
        analyzerLlmTimeoutMs,
        ollamaFallback,
        "ollama-url"
      );

  const strictErrors = [safeBrowsingSource]
    .filter((item) => item.error && item.available === false && !/not configured/i.test(item.error))
    .map((item) => `${item.source}: ${item.error}`);
  if (threatIntelStrictMode && strictErrors.length > 0) {
    const err = new Error("One or more threat intelligence sources are unavailable in strict mode.");
    err.status = 503;
    err.detail = strictErrors.join(" | ");
    throw err;
  }

  const assessments = [
    { key: "heuristic", source: "Heuristic URL engine", riskScore: heuristic.riskScore, confidence: heuristic.confidence, matched: heuristic.riskScore >= 55, available: true, weight: 0.16 },
    { key: "ollama", source: ollamaSource.source, riskScore: ollamaSource.riskScore, confidence: ollamaSource.confidence, matched: ollamaSource.matched, available: ollamaSource.available, weight: 0.16 },
    { key: "gsb", source: safeBrowsingSource.source, riskScore: safeBrowsingSource.riskScore, confidence: safeBrowsingSource.confidence, matched: safeBrowsingSource.matched, available: safeBrowsingSource.available, weight: 0.20 },
    { key: "abuseIpdb", source: abuseIpSource.source, riskScore: abuseIpSource.riskScore, confidence: abuseIpSource.confidence, matched: abuseIpSource.matched, available: abuseIpSource.available, weight: 0.12 },
    { key: "whois", source: domainSource.source, riskScore: domainSource.riskScore, confidence: domainSource.confidence, matched: domainSource.matched, available: domainSource.available, weight: 0.08 }
  ];
  const result = aggregateUrlRisk(assessments);

  const sources = {
    heuristic: {
      source: "Heuristic URL engine",
      available: true,
      matched: heuristic.riskScore >= 55,
      riskScore: heuristic.riskScore,
      confidence: heuristic.confidence,
      summary: heuristic.summary
    },
    ollama: ollamaSource,
    safeBrowsing: safeBrowsingSource,
    abuseIpdb: abuseIpSource,
    whois: domainSource
  };
  const narrative = buildUrlNarrative(result, sources, heuristic);
  result.summary = narrative.summary;
  result.explanation = narrative.explanation;
  result.evidence = narrative.evidence;
  result.accuracy = computeAnalyzerAccuracy(result.riskLevel, sources);

  if (saveHistory) {
    await saveAnalysisHistorySafe("url", { url: urlValue }, result, result?.riskScore || 0);
  }

  return {
    result,
    sources,
    threatFeed: null,
    intelMode: threatIntelRealtime ? "realtime" : "cached",
    strictMode: threatIntelStrictMode
  };
}

async function runApkAnalysisInternal(apk, source, permissions, saveHistory = true) {
  const normalizedApk = normalizeApkInput(apk);
  if (!isValidApkInput(normalizedApk)) {
    const err = new Error("Invalid APK input. Use package name (com.example.app), SHA-256 hash, APK file name (*.apk), or APK URL.");
    err.status = 400;
    throw err;
  }
  const normalizedPermissions = normalizePermissionsInput(permissions);
  const heuristic = baseApkHeuristic(normalizedApk, source, normalizedPermissions);
  const timeoutLabel = (label, ms) => `${label} timed out after ${ms}ms`;
  const apkLlmLabel = "Ollama APK model";
  const apkUrlTargets = extractUrlsFromText(normalizedApk, 1);
  const sourceUrlTargets = extractUrlsFromText(source, 1);
  const threatUrl = apkUrlTargets[0] || sourceUrlTargets[0] || "";
  const parsedThreatUrl = threatUrl ? normalizeUrl(threatUrl) : null;
  const threatDomain = parsedThreatUrl?.hostname || "";

  const gsbFallback = {
    source: "Google Safe Browsing",
    available: false,
    matched: false,
    error: timeoutLabel("Google Safe Browsing", analyzerSourceTimeoutMs),
    riskScore: 0,
    confidence: 0,
    summary: "Safe Browsing source timeout."
  };
  const abuseFallback = {
    source: "AbuseIPDB IP reputation",
    available: false,
    matched: false,
    error: timeoutLabel("AbuseIPDB", analyzerSourceTimeoutMs),
    riskScore: 0,
    confidence: 0,
    summary: "AbuseIPDB source timeout.",
    evidence: []
  };
  const ollamaFallback = {
    source: apkLlmLabel,
    available: false,
    matched: false,
    error: analyzerFastMode ? "Fast mode: LLM skipped" : timeoutLabel("LLM", analyzerLlmTimeoutMs),
    riskScore: heuristic.riskScore,
    confidence: 0,
    summary: analyzerFastMode ? "AI skipped in fast mode." : "AI source timeout.",
    factors: []
  };
  const whoisFallback = {
    domainRisk: 0,
    reasons: [timeoutLabel("WHOIS lookup", analyzerWhoisTimeoutMs)],
    domain: threatDomain,
    available: false,
    ageDays: null
  };
  let safeBrowsingSource = {
    source: "Google Safe Browsing",
    available: false,
    matched: false,
    error: "",
    riskScore: 0,
    confidence: 0,
    summary: "Safe Browsing skipped (no URL to scan).",
    evidence: []
  };
  let abuseIpSource = {
    source: "AbuseIPDB IP reputation",
    available: false,
    matched: false,
    error: "",
    riskScore: 0,
    confidence: 0,
    summary: "AbuseIPDB skipped (no URL to scan).",
    evidence: []
  };
  let domainIntel = {
    domainRisk: 0,
    reasons: ["No URL available for WHOIS lookup."],
    domain: threatDomain,
    available: false,
    ageDays: null
  };

  if (threatUrl) {
    const [safeBrowsingResult, whoisResult, abuseResult] = await Promise.all([
      withTimeoutFallback(evaluateGoogleSafeBrowsing(threatUrl), analyzerSourceTimeoutMs, gsbFallback, "gsb-apk"),
      analyzerFastMode
        ? Promise.resolve({ domainRisk: 0, reasons: ["WHOIS skipped in fast mode."], domain: threatDomain, available: false, ageDays: null })
        : withTimeoutFallback(domainAgent(threatUrl), analyzerWhoisTimeoutMs, whoisFallback, "apk-whois"),
      withTimeoutFallback(evaluateAbuseIpdb(threatUrl), analyzerSourceTimeoutMs, abuseFallback, "abuse-apk")
    ]);
    safeBrowsingSource = safeBrowsingResult;
    domainIntel = whoisResult;
    abuseIpSource = abuseResult;
  }
  const domainSource = buildDomainAgeSource(domainIntel);
  const llmEvidence = {
    urls: threatUrl ? [threatUrl] : [],
    apkSource: source,
    threatUrl,
    safeBrowsing: safeBrowsingSource,
    abuseIpdb: abuseIpSource,
    whois: domainSource,
    notes: Array.isArray(heuristic.signals) ? heuristic.signals.slice(0, 5) : []
  };
  const ollamaSource = analyzerFastMode
    ? ollamaFallback
    : await withTimeoutFallback(
        runOllamaApkAssessment(normalizedApk, source, heuristic, llmEvidence),
        analyzerLlmTimeoutMs,
        ollamaFallback,
        "ollama-apk"
      );

  const strictErrors = [safeBrowsingSource]
    .filter((item) => item.error && item.available === false && !/not configured/i.test(item.error))
    .map((item) => `${item.source}: ${item.error}`);
  if (threatIntelStrictMode && strictErrors.length > 0) {
    const err = new Error("One or more threat intelligence sources are unavailable in strict mode.");
    err.status = 503;
    err.detail = strictErrors.join(" | ");
    throw err;
  }

  const assessments = [
    {
      key: "heuristic",
      source: "Heuristic APK engine",
      riskScore: heuristic.riskScore,
      confidence: heuristic.confidence,
      matched: heuristic.riskScore >= 55,
      available: true,
      weight: 0.16,
      factors: Array.isArray(heuristic.factors) ? heuristic.factors : []
    },
    {
      key: "ollama",
      source: ollamaSource.source,
      riskScore: ollamaSource.riskScore,
      confidence: ollamaSource.confidence,
      matched: ollamaSource.matched,
      available: ollamaSource.available,
      weight: 0.16,
      factors: Array.isArray(ollamaSource.factors) ? ollamaSource.factors : []
    },
    {
      key: "gsb",
      source: safeBrowsingSource.source,
      riskScore: safeBrowsingSource.riskScore,
      confidence: safeBrowsingSource.confidence,
      matched: safeBrowsingSource.matched,
      available: safeBrowsingSource.available,
      weight: 0.20,
      factors: []
    },
    {
      key: "abuseIpdb",
      source: abuseIpSource.source,
      riskScore: abuseIpSource.riskScore,
      confidence: abuseIpSource.confidence,
      matched: abuseIpSource.matched,
      available: abuseIpSource.available,
      weight: 0.12,
      factors: []
    },
    {
      key: "whois",
      source: domainSource.source,
      riskScore: domainSource.riskScore,
      confidence: domainSource.confidence,
      matched: domainSource.matched,
      available: domainSource.available,
      weight: 0.08,
      factors: []
    }
  ];
  const result = aggregateUrlRisk(assessments);
  const mergedFactors = mergeAssessmentFactors(assessments);
  if (mergedFactors.length) {
    result.factors = mergedFactors;
  }
  const sources = {
    heuristic: {
      source: "Heuristic APK engine",
      available: true,
      matched: heuristic.riskScore >= 55,
      riskScore: heuristic.riskScore,
      confidence: heuristic.confidence,
      summary: heuristic.summary
    },
    ollama: {
      source: ollamaSource.source,
      available: ollamaSource.available,
      matched: ollamaSource.matched,
      riskScore: ollamaSource.available ? ollamaSource.riskScore : 0,
      confidence: ollamaSource.available ? ollamaSource.confidence : 0,
      summary: ollamaSource.available ? ollamaSource.summary : (ollamaSource.error || "LLM source unavailable.")
    },
    safeBrowsing: {
      source: safeBrowsingSource.source,
      available: safeBrowsingSource.available,
      matched: safeBrowsingSource.matched,
      riskScore: safeBrowsingSource.riskScore,
      confidence: safeBrowsingSource.confidence,
      summary: safeBrowsingSource.summary,
      evidence: Array.isArray(safeBrowsingSource.evidence) ? safeBrowsingSource.evidence : []
    },
    abuseIpdb: abuseIpSource,
    whois: domainSource
  };
  const narrative = buildApkNarrative(result, sources, heuristic);
  result.summary = narrative.summary;
  result.explanation = narrative.explanation;
  result.evidence = narrative.evidence;
  result.accuracy = computeAnalyzerAccuracy(result.riskLevel, sources);
  if (saveHistory) {
    await saveAnalysisHistorySafe(
      "apk",
      { apk: normalizedApk, source, permissions: normalizedPermissions },
      result,
      result?.riskScore || 0
    );
  }
  return {
    result,
    sources,
    threatFeed: null,
    intelMode: threatIntelRealtime ? "realtime" : "cached",
    strictMode: threatIntelStrictMode
  };
}

async function runEmailAnalysisInternal(emailText, saveHistory = true) {
  const heuristic = baseEmailHeuristic(emailText);
  const timeoutLabel = (label, ms) => `${label} timed out after ${ms}ms`;
  const emailLlmLabel = "Ollama email model";
  const ollamaFallback = {
    source: emailLlmLabel,
    available: false,
    matched: false,
    error: analyzerFastMode ? "Fast mode: LLM skipped" : timeoutLabel("LLM", analyzerLlmTimeoutMs),
    riskScore: heuristic.riskScore,
    confidence: 0,
    summary: analyzerFastMode ? "AI skipped in fast mode." : "AI source timeout.",
    factors: []
  };

  const gsbFallback = {
    source: "Google Safe Browsing",
    available: false,
    matched: false,
    error: timeoutLabel("Google Safe Browsing", analyzerSourceTimeoutMs),
    riskScore: 0,
    confidence: 0,
    summary: "Safe Browsing source timeout."
  };
  const abuseFallback = {
    source: "AbuseIPDB IP reputation",
    available: false,
    matched: false,
    error: timeoutLabel("AbuseIPDB", analyzerSourceTimeoutMs),
    riskScore: 0,
    confidence: 0,
    summary: "AbuseIPDB source timeout.",
    evidence: []
  };
  const emailUrls = extractUrlsFromText(emailText, 3);
  const safeBrowsingScans = emailUrls.length
    ? await Promise.all(
        emailUrls.map((urlValue) => withTimeoutFallback(
          evaluateGoogleSafeBrowsing(urlValue),
          analyzerSourceTimeoutMs,
          gsbFallback,
          "gsb-email"
        ))
      )
    : [];
  const safeBrowsingSource = summarizeSafeBrowsingResults(safeBrowsingScans, emailUrls.length);
  const primaryThreatUrl = emailUrls[0] || "";
  const abuseIpSource = primaryThreatUrl
    ? await withTimeoutFallback(evaluateAbuseIpdb(primaryThreatUrl), analyzerSourceTimeoutMs, abuseFallback, "abuse-email")
    : {
        source: "AbuseIPDB IP reputation",
        available: false,
        matched: false,
        error: "",
        riskScore: 0,
        confidence: 0,
        summary: "AbuseIPDB skipped (no URL to scan).",
        evidence: []
      };

  const senderDomain = extractEmailDomainForWhois(emailText);
  const whoisFallback = {
    domainRisk: 0,
    reasons: [timeoutLabel("WHOIS lookup", analyzerWhoisTimeoutMs)],
    domain: senderDomain,
    available: false,
    ageDays: null
  };
  const domainIntel = senderDomain
    ? (analyzerFastMode
        ? { domainRisk: 0, reasons: ["WHOIS skipped in fast mode."], domain: senderDomain, available: false, ageDays: null }
        : await withTimeoutFallback(domainAgent(`https://${senderDomain}`), analyzerWhoisTimeoutMs, whoisFallback, "email-whois"))
    : { domainRisk: 0, reasons: ["No sender domain found."], domain: "", available: false, ageDays: null };
  const domainSource = buildDomainAgeSource(domainIntel);
  const llmEvidence = {
    urls: emailUrls,
    senderDomain,
    safeBrowsing: safeBrowsingSource,
    abuseIpdb: abuseIpSource,
    whois: domainSource,
    notes: Array.isArray(heuristic.signals) ? heuristic.signals.slice(0, 5) : []
  };
  const ollamaSource = analyzerFastMode
    ? ollamaFallback
    : await withTimeoutFallback(
        runOllamaEmailAssessment(emailText, heuristic, llmEvidence),
        analyzerLlmTimeoutMs,
        ollamaFallback,
        "email-ollama"
      );

  const strictErrors = [safeBrowsingSource]
    .filter((item) => item.error && item.available === false && !/not configured/i.test(item.error))
    .map((item) => `${item.source}: ${item.error}`);
  if (threatIntelStrictMode && strictErrors.length > 0) {
    const err = new Error("One or more threat intelligence sources are unavailable in strict mode.");
    err.status = 503;
    err.detail = strictErrors.join(" | ");
    throw err;
  }

  const assessments = [
    {
      key: "heuristic",
      source: "Heuristic email engine",
      riskScore: heuristic.riskScore,
      confidence: heuristic.confidence,
      matched: heuristic.riskScore >= 55,
      available: true,
      weight: 0.16,
      factors: Array.isArray(heuristic.factors) ? heuristic.factors : []
    },
    {
      key: "ollama",
      source: ollamaSource.source,
      riskScore: ollamaSource.riskScore,
      confidence: ollamaSource.confidence,
      matched: ollamaSource.matched,
      available: ollamaSource.available,
      weight: 0.16,
      factors: Array.isArray(ollamaSource.factors) ? ollamaSource.factors : []
    },
    {
      key: "gsb",
      source: safeBrowsingSource.source,
      riskScore: safeBrowsingSource.riskScore,
      confidence: safeBrowsingSource.confidence,
      matched: safeBrowsingSource.matched,
      available: safeBrowsingSource.available,
      weight: 0.20,
      factors: []
    },
    {
      key: "abuseIpdb",
      source: abuseIpSource.source,
      riskScore: abuseIpSource.riskScore,
      confidence: abuseIpSource.confidence,
      matched: abuseIpSource.matched,
      available: abuseIpSource.available,
      weight: 0.12,
      factors: []
    },
    {
      key: "whois",
      source: domainSource.source,
      riskScore: domainSource.riskScore,
      confidence: domainSource.confidence,
      matched: domainSource.matched,
      available: domainSource.available,
      weight: 0.08,
      factors: []
    }
  ];
  const result = aggregateUrlRisk(assessments);
  const mergedFactors = mergeAssessmentFactors(assessments);
  if (mergedFactors.length) {
    result.factors = mergedFactors;
  }
  const sources = {
    heuristic: {
      source: "Heuristic email engine",
      available: true,
      matched: heuristic.riskScore >= 55,
      riskScore: heuristic.riskScore,
      confidence: heuristic.confidence,
      summary: heuristic.summary
    },
    ollama: {
      source: ollamaSource.source,
      available: ollamaSource.available,
      matched: ollamaSource.matched,
      riskScore: ollamaSource.available ? ollamaSource.riskScore : 0,
      confidence: ollamaSource.available ? ollamaSource.confidence : 0,
      summary: ollamaSource.available ? ollamaSource.summary : (ollamaSource.error || "LLM source unavailable.")
    },
    safeBrowsing: {
      source: safeBrowsingSource.source,
      available: safeBrowsingSource.available,
      matched: safeBrowsingSource.matched,
      riskScore: safeBrowsingSource.riskScore,
      confidence: safeBrowsingSource.confidence,
      summary: safeBrowsingSource.summary,
      evidence: Array.isArray(safeBrowsingSource.evidence) ? safeBrowsingSource.evidence : []
    },
    abuseIpdb: abuseIpSource,
    whois: domainSource
  };
  const narrative = buildEmailNarrative(result, sources, heuristic);
  result.summary = narrative.summary;
  result.explanation = narrative.explanation;
  result.evidence = narrative.evidence;
  result.accuracy = computeAnalyzerAccuracy(result.riskLevel, sources);
  if (saveHistory) {
    await saveAnalysisHistorySafe("email", { emailText }, result, result?.riskScore || 0);
  }
  return {
    result,
    sources,
    threatFeed: null,
    intelMode: threatIntelRealtime ? "realtime" : "cached",
    strictMode: threatIntelStrictMode
  };
}

async function getAgentUserHistory(email) {
  const normalized = normalizeUserEmail(email);
  const logs = (await readAnalyzerLogs())
    .filter((entry) => String(entry.user_email || "").toLowerCase() === normalized)
    .slice(-20)
    .reverse()
    .map((entry) => ({
      id: entry.id || "",
      timestamp: entry.timestamp,
      type: entry.type,
      details: String(entry.details || "").slice(0, 220)
    }));

  const agentCases = (await readAgentCases())
    .filter((entry) => String(entry.user_email || "").toLowerCase() === normalized)
    .slice(-5)
    .reverse()
    .map((entry) => ({
      caseId: entry.caseId,
      timestamp: entry.timestamp,
      summary: String(entry?.report?.summary || "").slice(0, 220),
      riskLevel: String(entry?.report?.riskLevel || "")
    }));

  return { analyzer: logs, investigatorCases: agentCases };
}

function summarizeAgentObservation(output) {
  if (!output || typeof output !== "object") return String(output || "");
  if (output.result && typeof output.result === "object") {
    const result = output.result;
    return `risk=${result.riskScore || 0}% (${result.riskLevel || "unknown"}) confidence=${result.confidence || 0}%`;
  }
  if (Array.isArray(output.analyzer)) {
    return `history loaded (${output.analyzer.length} analyzer rows)`;
  }
  if (output.message) return String(output.message).slice(0, 220);
  return JSON.stringify(output).slice(0, 220);
}

function buildRuleBasedUrlFallback(ruleOutput, warning) {
  const score = clampPercent(Number(ruleOutput?.score || 0));
  const verdict = String(ruleOutput?.verdict || "").toLowerCase();
  const riskLevel = verdict.includes("danger")
    ? "high"
    : verdict.includes("suspicious")
      ? "medium"
      : "low";
  const reasons = Array.isArray(ruleOutput?.reasons) ? ruleOutput.reasons : [];
  const confidence = clampPercent(Math.min(80, 40 + (reasons.length * 8)));
  const factorScore = clampPercent(Math.max(35, Math.min(100, score)));
  const factors = reasons.slice(0, 6).map((reason) => ({
    name: String(reason || "").slice(0, 120),
    score: factorScore
  }));
  if (!factors.length) {
    factors.push({ name: "Rule-based checks", score: factorScore });
  }

  const summary = String(ruleOutput?.explanation || "").trim()
    || `Rule-based analyzer scored ${score}% risk (${riskLevel}).`;

  return {
    result: {
      riskScore: score,
      riskLevel,
      confidence,
      summary,
      factors
    },
    sources: {
      rules: {
        source: "Rule-based URL analyzer",
        available: true,
        matched: score >= 55,
        riskScore: score,
        confidence,
        summary
      }
    },
    fallback: true,
    warning: String(warning || "").trim()
  };
}

async function runOllamaChatReply(userInput, model, systemMessage, extra = {}) {
  const ollamaUrl = (process.env.OLLAMA_URL || "http://localhost:11434").trim().replace(/\/+$/, "");
  const baseNumPredict = Math.max(20, Number(process.env.OLLAMA_NUM_PREDICT || 120));
  const baseNumCtx = Math.max(512, Number(process.env.OLLAMA_NUM_CTX || 1536));
  const numPredict = Math.max(20, Number(extra.numPredict || baseNumPredict));
  const numCtx = Math.max(512, Number(extra.numCtx || baseNumCtx));
  const temperature = Number.isFinite(extra.temperature) ? Number(extra.temperature) : 0.2;
  const maxInputChars = Math.max(
    800,
    Number(extra.maxInputChars || process.env.OLLAMA_PROMPT_MAX_CHARS || 2800)
  );
  const basePayload = {
    model: String(model || "").trim() || "mistral",
    messages: [
      { role: "system", content: String(systemMessage || "").trim() },
      { role: "user", content: String(userInput || "").trim().slice(0, maxInputChars) }
    ],
    options: {
      temperature,
      num_ctx: numCtx,
      num_predict: numPredict
    }
  };
  if (extra.format) {
    basePayload.format = extra.format;
  }

  const timeoutMs = Math.max(
    4000,
    Number(extra.timeoutMs || 0),
    Number(process.env.OLLAMA_TIMEOUT_MS || 12000)
  );
  const runNonStream = async (payload) => {
    const response = await axios.post(
      `${ollamaUrl}/api/chat`,
      { ...payload, stream: false },
      { timeout: timeoutMs }
    );
    const data = response?.data || {};
    return String(data?.message?.content || data?.response || "").trim();
  };
  const streamEnabled = !/^(0|false|no)$/i.test(String(process.env.OLLAMA_STREAM || "").trim());
  if (!streamEnabled) {
    try {
      return (await runNonStream(basePayload)).trim();
    } catch {
      return "";
    }
  }

  try {
    const response = await axios.post(
      `${ollamaUrl}/api/chat`,
      { ...basePayload, stream: true },
      { responseType: "stream", timeout: timeoutMs }
    );

    let acc = "";
    let buffer = "";
    let settled = false;
    let streamError = "";
    await new Promise((resolve, reject) => {
      const finish = (err) => {
        if (settled) return;
        settled = true;
        try {
          response.data.removeAllListeners("data");
          response.data.removeAllListeners("end");
          response.data.removeAllListeners("error");
        } catch {
          // Ignore cleanup errors.
        }
        if (err) reject(err);
        else resolve();
      };

      response.data.on("data", (chunk) => {
        buffer += chunk.toString("utf8");
        let lineEnd = buffer.indexOf("\n");
        while (lineEnd >= 0) {
          const raw = buffer.slice(0, lineEnd).trim();
          buffer = buffer.slice(lineEnd + 1);
          if (raw) {
            try {
              const frame = JSON.parse(raw);
              if (frame?.error) {
                streamError = String(frame.error || "");
              } else {
                acc += String(frame?.message?.content || "");
              }
              if (frame?.done === true) {
                finish();
                return;
              }
            } catch {
              // Ignore malformed stream frames.
            }
          }
          lineEnd = buffer.indexOf("\n");
        }
      });
      response.data.on("end", () => {
        if (settled) return;
        const tail = String(buffer || "").trim();
        if (tail) {
          try {
            const frame = JSON.parse(tail);
            if (frame?.error) {
              streamError = String(frame.error || "");
            } else {
              acc += String(frame?.message?.content || "");
            }
          } catch {
            // Ignore malformed trailing frame.
          }
        }
        if (streamError) {
          finish(new Error(streamError));
          return;
        }
        finish();
      });
      response.data.on("error", (err) => finish(err));
    });

    const trimmed = acc.trim();
    if (trimmed) return trimmed;
  } catch {
    // fall through to non-stream fallback
  }

  try {
    const fallbackPayload = {
      ...basePayload,
      options: { ...basePayload.options, num_predict: Math.min(32, numPredict), num_ctx: Math.min(768, numCtx) }
    };
    const reply = await runNonStream(fallbackPayload);
    return reply.trim();
  } catch {
    return "";
  }
}

function estimateAskAiResponseQuality(question) {
  let score = 75;
  const text = String(question || "").trim();
  if (text.length < 20) score -= 15;
  if (text.length > 400) score -= 5;

  return clampPercent(score);
}

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, db: "connected" });
  } catch (err) {
    res.status(500).json({ ok: false, message: "DB connection failed", detail: err.message });
  }
});

app.post("/api/analyze-url", async (req, res) => {
  try {
    const urlValue = String(req.body.url || "").trim();
    if (!urlValue) {
      return res.status(400).json({ message: "URL is required." });
    }
    const data = await runUrlAnalysisInternal(urlValue, true);
    return res.json(data);
  } catch (err) {
    const status = Number(err?.status || 500);
    return res.status(status).json({
      message: "URL analysis failed",
      detail: String(err?.detail || err?.message || "Unknown error")
    });
  }
});

app.post("/analyze-url", async (req, res) => {
  try {
    const url = String(req.body.url || "").trim();
    if (!url) {
      return res.status(400).json({ message: "URL is required." });
    }
    try {
      const data = await runUrlAnalysisInternal(url, true);
      return res.json({
        ...data,
        aiResult: data?.result?.explanation || data?.result?.summary || "URL analysis completed."
      });
    } catch (err) {
      const data = await analyzeUrlWithRules(url);
      return res.json({
        ...data,
        aiResult: data.explanation || "URL analysis completed.",
        fallback: true,
        warning: String(err?.detail || err?.message || "Fallback to rule-based analyzer.")
      });
    }
  } catch (err) {
    return res.status(500).json({ message: "URL analyzer failed", detail: err.message });
  }
});

app.post("/api/analyze-apk", async (req, res) => {
  try {
    const apk = normalizeApkInput(req.body.apk || "");
    const source = String(req.body.source || "Unknown").trim();
    const permissions = normalizePermissionsInput(req.body.permissions);
    if (!apk) {
      return res.status(400).json({ message: "APK package/hash is required." });
    }
    const data = await runApkAnalysisInternal(apk, source, permissions, true);
    return res.json(data);
  } catch (err) {
    const status = Number(err?.status || 500);
    return res.status(status).json({
      message: "APK analysis failed",
      detail: String(err?.detail || err?.message || "Unknown error")
    });
  }
});

app.post("/api/analyze-email", async (req, res) => {
  try {
    const emailText = String(req.body.emailText || "").trim();
    if (!emailText) {
      return res.status(400).json({ message: "Email text is required." });
    }
    const data = await runEmailAnalysisInternal(emailText, true);
    return res.json(data);
  } catch (err) {
    const status = Number(err?.status || 500);
    return res.status(status).json({
      message: "Email analysis failed",
      detail: String(err?.detail || err?.message || "Unknown error")
    });
  }
});

app.post("/api/hover-log", async (req, res) => {
  try {
    const url = String(req.body.url || "").trim();
    if (!url) {
      return res.status(400).json({ message: "URL is required." });
    }
    const userAction = String(req.body.userAction || "hover").trim();
    const result = req.body.result || {};
    const riskScore = Number(result?.riskScore ?? result?.risk ?? 0);
    await saveAnalysisHistorySafe("url-hover", { url, userAction }, result, riskScore);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: "Failed to save hover log", detail: err.message });
  }
});

app.post("/api/llm-assistant", async (req, res) => {
  try {
    const message = String(req.body.message || "").trim();
    const context = normalizeAssistantContext(req.body.context);
    if (!message) {
      return res.status(400).json({ message: "Message is required." });
    }
    if (message.length > 1600) {
      return res.status(400).json({ message: "Message is too long. Keep it under 1600 characters." });
    }

    await loadProjectFaq();
    const faqAnswer = findFaqAnswer(message);
    if (faqAnswer) {
      return res.json({
        reply: faqAnswer,
        modelUsed: "project-faq",
        usedAgentic: false,
        provider: "local"
      });
    }

    const agenticContext = await buildAgenticAssistantContext(message, context);
    const ai = await buildAssistantAiReplyWithFallback(message, context, agenticContext);

    const reply = String(ai.reply || "").trim();
    if (!reply) {
      const fallbackText = buildAssistantFallbackReply(message, context);
      return res.json({ reply: fallbackText, modelUsed: "fallback", usedAgentic: Boolean(agenticContext && !agenticContext.error), provider: "fallback" });
    }

    return res.json({
      reply,
      modelUsed: ai.modelUsed || "ollama",
      usedAgentic: Boolean(agenticContext && !agenticContext.error),
      provider: ai.provider || "ollama"
    });
  } catch (err) {
    const fallbackText = buildAssistantFallbackReply(String(req.body?.message || ""), normalizeAssistantContext(req.body?.context));
    return res.status(500).json({ message: "AI assistant failed.", detail: String(err?.message || "Unknown LLM error"), reply: fallbackText, modelUsed: "fallback", provider: "fallback" });
  }
});

app.post("/ask-ai", async (req, res) => {
  try {
    const question = String(req.body?.question || "").trim();
    if (!question) {
      return res.status(400).json({ error: "question is required" });
    }

    await loadProjectFaq();
    const faqAnswer = findFaqAnswer(question);
    if (faqAnswer) {
      return res.json({
        answer: faqAnswer,
        modelUsed: "project-faq",
        provider: "local",
        responseQuality: 100
      });
    }

    const detectedUrl = extractFirstUrl(question);
    let promptInput = question;
    let systemMessage = "You are Cyber-Shield AI for the Cyber-Shield project; answer all user questions about the project, tools, and security topics. If the question is not about Cyber-Shield, relate your answer back to cybersecurity or project features. Use plain and simple English for all age groups. Keep answers short (3-6 lines), clear, and calm. Avoid difficult words. If you use a technical term, explain it simply. Give: 1) direct answer, 2) simple reason, 3) safest next step. No fear language, panic tone, or unnecessary urgency.";

    if (detectedUrl) {
      const shortInput = detectedUrl.slice(0, 200);
      promptInput = `URL: ${shortInput}\n\nUser question: ${question}`;
      systemMessage = "You are a Cyber-Shield cybersecurity analyzer. Use provided URL context first. Explain clearly with one recommended action and why.";
    }

    const responseQuality = estimateAskAiResponseQuality(question);
    const ollamaModel = (process.env.OLLAMA_MODEL || "phi3").trim();
    const answer = await runOllamaChatReply(
      promptInput,
      ollamaModel,
      systemMessage,
      { numPredict: 20, numCtx: 640, temperature: 0.1 }
    );
    if (!answer) {
      const fallbackText = buildAssistantFallbackReply(question, null);
      return res.json({ answer: fallbackText, modelUsed: "fallback", provider: "ollama", responseQuality });
    }
    return res.json({ answer, modelUsed: ollamaModel, provider: "ollama", responseQuality });
  } catch (error) {
    return res.status(500).json({ error: "AI failed", detail: String(error?.message || "Unknown error from Ollama") });
  }
});

app.post("/api/agent/investigate", async (req, res) => {
  try {
    const objective = String(req.body.objective || "").trim();
    const email = normalizeUserEmail(req.body.email || "");
    const mode = String(req.body.mode || "auto").trim().toLowerCase();
    const input = String(req.body.input || "").trim();
    const source = String(req.body.source || "Unknown").trim();

    if (!objective) {
      return res.status(400).json({ message: "Objective is required." });
    }
    if (objective.length > 1600) {
      return res.status(400).json({ message: "Objective is too long. Keep it under 1600 characters." });
    }
    if (/\b(delete|export|wipe|escalate)\b/i.test(objective)) {
      return res.status(403).json({
        message: "High-impact objective requires human approval.",
        requiresApproval: true
      });
    }
    if (!enforceAgentRateLimit(email)) {
      return res.status(429).json({ message: "Rate limit exceeded. Try again in a minute." });
    }

    const availableTools = ["analyzeUrl", "analyzeApk", "analyzeEmail", "saveCase", "getUserHistory"];
    const previousCases = (await readAgentCases())
      .filter((entry) => String(entry.user_email || "").toLowerCase() === email)
      .slice(-3)
      .map((entry) => ({
        caseId: entry.caseId,
        timestamp: entry.timestamp,
        summary: String(entry?.report?.summary || "").slice(0, 220),
        riskLevel: entry?.report?.riskLevel || ""
      }));

    const steps = [];
    const notes = [];
    const analysisResults = [];
    let plannerFinalSummary = "";
    let plannerConfidence = 0;
    let plannerEvidence = [];

    for (let i = 0; i < agentMaxSteps; i += 1) {
      const plan = await planAgentDecision({
        objective,
        email,
        mode,
        input,
        source,
        previousCases,
        availableTools,
        steps
      });

      if (plan.done) {
        const planSummary = String(plan.finalSummary || "").trim();
        const isFallbackSummary = /fallback decision policy/i.test(planSummary);
        if (!analysisResults.length || !isFallbackSummary) {
          plannerFinalSummary = planSummary;
        }
        plannerConfidence = clampPercent(plan.confidence || plannerConfidence);
        plannerEvidence = Array.isArray(plan.evidence) ? plan.evidence : plannerEvidence;
        steps.push({
          step: i + 1,
          action: "finish",
          status: "completed",
          note: plan.note || "Planner marked investigation as complete.",
          observation: plannerFinalSummary || "Final summary ready."
        });
        break;
      }

      const highImpactTool = new Set(["deleteData", "exportData", "escalateIncident"]);
      if (highImpactTool.has(plan.tool)) {
        steps.push({
          step: i + 1,
          action: plan.tool,
          status: "needs_approval",
          note: "High-impact action requires human approval.",
          observation: "Planner requested a protected operation."
        });
        plannerFinalSummary = "Investigation paused because a high-impact action needs human approval.";
        break;
      }

      if (!availableTools.includes(plan.tool)) {
        steps.push({
          step: i + 1,
          action: plan.tool || "unknown",
          status: "rejected",
          note: "Tool not allowlisted.",
          observation: "Planner requested a blocked tool."
        });
        continue;
      }

      let observation = null;
      try {
        if (plan.tool === "analyzeUrl") {
          if (analysisResults.some((item) => item.kind === "url")) {
            steps.push({
              step: i + 1,
              action: plan.tool,
              status: "skipped",
              note: "Duplicate URL analysis avoided.",
              args: plan.args || {},
              observation: "Using previous URL analysis result."
            });
            plannerFinalSummary = plannerFinalSummary || "Investigation completed using the first successful URL analysis result.";
            break;
          }
          const urlValue = String(plan.args?.url || input || "").trim();
          if (!urlValue) throw new Error("analyzeUrl requires args.url");
          observation = await runWithRetry(
            () => withToolTimeout(runUrlAnalysisInternal(urlValue, false), agentAnalysisTimeoutMs, "analyzeUrl"),
            1
          );
          analysisResults.push({ kind: "url", result: observation.result });
        } else if (plan.tool === "analyzeApk") {
          if (analysisResults.some((item) => item.kind === "apk")) {
            steps.push({
              step: i + 1,
              action: plan.tool,
              status: "skipped",
              note: "Duplicate APK analysis avoided.",
              args: plan.args || {},
              observation: "Using previous APK analysis result."
            });
            plannerFinalSummary = plannerFinalSummary || "Investigation completed using the first successful APK analysis result.";
            break;
          }
          const apkInput = String(plan.args?.input || input || "").trim();
          const apkSource = String(plan.args?.source || source || "Unknown").trim();
          const apkPermissions = normalizePermissionsInput(plan.args?.permissions);
          if (!apkInput) throw new Error("analyzeApk requires args.input");
          observation = await runWithRetry(
            () => withToolTimeout(runApkAnalysisInternal(apkInput, apkSource, apkPermissions, false), agentAnalysisTimeoutMs, "analyzeApk"),
            1
          );
          analysisResults.push({ kind: "apk", result: observation.result });
        } else if (plan.tool === "analyzeEmail") {
          if (analysisResults.some((item) => item.kind === "email")) {
            steps.push({
              step: i + 1,
              action: plan.tool,
              status: "skipped",
              note: "Duplicate email analysis avoided.",
              args: plan.args || {},
              observation: "Using previous email analysis result."
            });
            plannerFinalSummary = plannerFinalSummary || "Investigation completed using the first successful email analysis result.";
            break;
          }
          const emailText = String(plan.args?.text || input || "").trim();
          if (!emailText) throw new Error("analyzeEmail requires args.text");
          observation = await runWithRetry(
            () => withToolTimeout(runEmailAnalysisInternal(emailText, false), agentAnalysisTimeoutMs, "analyzeEmail"),
            1
          );
          analysisResults.push({ kind: "email", result: observation.result });
        } else if (plan.tool === "saveCase") {
          const note = String(plan.args?.note || "").trim();
          if (!note) throw new Error("saveCase requires args.note");
          notes.push(note.slice(0, 300));
          observation = { message: "Case note saved in memory." };
        } else if (plan.tool === "getUserHistory") {
          const historyEmail = normalizeUserEmail(plan.args?.email || email);
          const isAdmin = isAdminEmail(email);
          if (!isAdmin && historyEmail !== email) {
            throw new Error("Permission denied for other user history.");
          }
          observation = await runWithRetry(
            () => withToolTimeout(getAgentUserHistory(historyEmail), agentToolTimeoutMs, "getUserHistory"),
            1
          );
        }

        steps.push({
          step: i + 1,
          action: plan.tool,
          status: "completed",
          note: String(plan.note || "").slice(0, 220),
          args: plan.args || {},
          observation: summarizeAgentObservation(observation)
        });
      } catch (toolErr) {
        let fallbackObservation = null;
        if (plan.tool === "analyzeUrl") {
          const urlValue = String(plan.args?.url || input || "").trim();
          if (urlValue) {
            try {
              const ruleData = await analyzeUrlWithRules(urlValue);
              fallbackObservation = buildRuleBasedUrlFallback(ruleData, toolErr?.message || "");
              analysisResults.push({ kind: "url", result: fallbackObservation.result });
            } catch {
              fallbackObservation = null;
            }
          }
        }

        if (fallbackObservation) {
          const errorMessage = String(toolErr?.message || "Tool execution failed.");
          steps.push({
            step: i + 1,
            action: plan.tool,
            status: "completed",
            note: `${String(plan.note || "Fallback analysis").slice(0, 190)} Rule-based analyzer used.`,
            args: plan.args || {},
            observation: `${summarizeAgentObservation(fallbackObservation)} (fallback after ${errorMessage})`
          });
        } else {
          steps.push({
            step: i + 1,
            action: plan.tool,
            status: "failed",
            note: String(plan.note || "").slice(0, 220),
            args: plan.args || {},
            observation: String(toolErr?.message || "Tool execution failed.")
          });
        }
      }
    }

    const topResult = analysisResults
      .map((item) => ({ kind: item.kind, ...(item.result || {}) }))
      .sort((a, b) => Number(b.riskScore || 0) - Number(a.riskScore || 0))[0] || null;

    const riskScore = clampPercent(topResult?.riskScore || 0);
    const riskLevel = String(topResult?.riskLevel || riskLevelFromScore(riskScore));
    const confidence = clampPercent(topResult?.confidence || plannerConfidence || 0);
    const evidence = [
      ...(Array.isArray(topResult?.factors) ? topResult.factors.map((f) => `${f.name}: ${f.score}%`) : []),
      ...steps.filter((s) => s.status === "completed").map((s) => `Step ${s.step} ${s.action}: ${s.observation}`),
      ...plannerEvidence
    ].slice(0, 8);

    const recommendations = riskScore >= 70
      ? ["Do not open/click/install yet.", "Isolate item and escalate to security.", "Preserve indicators and timeline evidence."]
      : riskScore >= 40
        ? ["Run additional verification and sandbox checks.", "Confirm sender/domain/signature via trusted source.", "Proceed only after manual review."]
        : ["No strong high-risk signal found.", "Continue with normal caution and verify authenticity.", "Monitor for behavior changes or new intel."]
      ;

    const report = {
      summary: plannerFinalSummary || topResult?.summary || "Investigation completed with available tools.",
      riskScore,
      riskLevel,
      confidence,
      evidence,
      recommendations
    };

    const caseId = `case_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const timestamp = new Date().toISOString();
    await appendAgentCase({
      caseId,
      timestamp,
      user_email: email,
      objective,
      request: { mode, input, source },
      steps,
      notes,
      report
    });

    return res.json({
      caseId,
      timestamp,
      steps,
      report,
      analysis: topResult || null
    });
  } catch (err) {
    const status = Number(err?.status || 500);
    return res.status(status).json({
      message: err?.message || "Agent investigation failed.",
      detail: err?.detail || ""
    });
  }
});

app.post("/api/llm/url-risk", async (req, res) => {
  try {
    const rawData = req.body.data ?? req.body.url ?? req.body.email ?? req.body.apk ?? "";
    const dataValue = String(rawData || "").trim();
    if (!dataValue) {
      return res.status(400).json({ message: "Data is required." });
    }
    const typeValue = String(req.body.type || "").trim().toLowerCase();
    const typeLabel = typeValue === "email" ? "EMAIL" : typeValue === "apk" ? "APK" : "URL";
    const ollamaModel = (process.env.OLLAMA_MODEL || "mistral").trim();
    const reply = await runOllamaChatReply(
      `Analyze this URL/email/APK behavior and classify as SAFE, SUSPICIOUS, or MALICIOUS. Explain why briefly.\nData (${typeLabel}): ${dataValue}`,
      ollamaModel,
      "You are a cybersecurity analyst. Keep the response short and clear."
    );
    if (!reply) {
      return res.status(502).json({ message: "LLM URL risk analysis failed", detail: "Empty response from Ollama." });
    }
    return res.json({ text: reply });
  } catch (err) {
    return res.status(500).json({ message: "LLM URL risk analysis failed", detail: err.message });
  }
});


app.post("/api/signup", async (req, res) => {
  try {
    const name = (req.body.name || "").trim();
    const email = (req.body.email || "").trim().toLowerCase();
    const password = req.body.password || "";
    const username = name || email.split("@")[0] || "user";

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    if (!isEmailFormatValid(email)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }

    if (isDisposableEmailDomain(email)) {
      return res.status(400).json({ message: "Disposable email addresses are not allowed." });
    }

    const [existing] = await pool.query(
      `SELECT id FROM \`${usersTable}\` WHERE email = ? LIMIT 1`,
      [email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: "Email already registered. Please login." });
    }

    const hashed = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO \`${usersTable}\` (username, name, email, password)
       VALUES (?, ?, ?, ?)`,
      [username, name, email, hashed]
    );

    const [fresh] = await pool.query(
      `SELECT id, username, name, email FROM \`${usersTable}\` WHERE email = ? LIMIT 1`,
      [email]
    );
    const user = fresh[0] || { id: 0, name, username, email };

    return res.status(201).json({
      message: "Signup successful.",
      user: { id: user.id, name: user.name || name, username: user.username || username, email: user.email || email }
    });
  } catch (err) {
    return res.status(500).json({ message: "Signup failed", detail: err.message });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const password = req.body.password || "";
    const loginMeta = {
      clientLoginDate: req.body.clientLoginDate,
      clientLoginTime: req.body.clientLoginTime,
      clientTimeZone: req.body.clientTimeZone
    };

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    if (isAdminLogin(email, password)) {
      const adminUser = { id: 0, name: "Admin", username: "admin", email: appAdminEmail };
      await recordLoginAuditSafe(req, adminUser, loginMeta);
      const loginAt = new Date().toISOString();
      return res.json({
        message: "Login successful",
        user: adminUser,
        isAdmin: true,
        loginAt
      });
    }

    const [rows] = await pool.query(
      `SELECT id, username, name, email, password
       FROM \`${usersTable}\` WHERE email = ? LIMIT 1`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const dbUser = rows[0];
    const passOk = await bcrypt.compare(password, dbUser.password);

    if (!passOk) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    await recordLoginAuditSafe(req, dbUser, loginMeta);
    const loginAt = new Date().toISOString();

    return res.json({
      message: "Login successful",
      user: { id: dbUser.id, name: dbUser.name || dbUser.username || "User", username: dbUser.username || "", email: dbUser.email },
      isAdmin: false,
      loginAt
    });
  } catch (err) {
    return res.status(500).json({ message: "Login failed", detail: err.message });
  }
});

app.post("/api/delete-account", async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const [result] = await pool.query(`DELETE FROM \`${usersTable}\` WHERE email = ? LIMIT 1`, [email]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Account not found." });
    }

    await pool.query("DELETE FROM game_scores WHERE user_email = ?", [email]);
    return res.json({ message: "Account deleted successfully." });
  } catch (err) {
    return res.status(500).json({ message: "Delete account failed", detail: err.message });
  }
});

app.post("/api/analyzer-log", async (req, res) => {
  try {
    const type = String(req.body.type || "").trim().toLowerCase();
    const details = String(req.body.details || "").trim();
    const userName = String(req.body.userName || "Unknown").trim();
    const userEmail = String(req.body.userEmail || "guest@local").trim().toLowerCase();
    const origin = normalizeAnalyzerOrigin(req.body.origin);
    const riskScore = normalizePercent(req.body.riskScore ?? req.body.risk_score);
    const safeScore = normalizePercent(req.body.safeScore ?? req.body.safe_score);
    const confidence = normalizePercent(req.body.confidence);
    const riskLevel = String(req.body.riskLevel || req.body.risk_level || "").trim().toLowerCase();

    if (!["url", "apk", "email"].includes(type)) {
      return res.status(400).json({ message: "Invalid analyzer type." });
    }
    if (!details) {
      return res.status(400).json({ message: "Analyzer details are required." });
    }

    const timestamp = new Date().toISOString();
    const logs = await readAnalyzerLogs();
    logs.push({
      id: generateLogId(),
      timestamp,
      type,
      origin,
      user_name: userName,
      user_email: userEmail,
      details,
      risk_score: riskScore,
      safe_score: safeScore,
      confidence,
      risk_level: riskLevel
    });
    await writeAnalyzerLogs(logs);
    return res.status(201).json({ message: "Analyzer data saved." });
  } catch (err) {
    return res.status(500).json({ message: "Failed to save analyzer data", detail: err.message });
  }
});

app.get("/api/analyzer-log/mine", async (req, res) => {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const isAdminRequest = isAdminEmail(email);
    const rawRows = (await readAnalyzerLogs())
      .filter((entry) => isAdminRequest || String(entry.user_email || "").toLowerCase() === email)
      .slice(-200)
      .reverse()
      .map((entry) => ({
        id: entry.id || "",
        timestamp: entry.timestamp,
        type: entry.type,
        origin: normalizeAnalyzerOrigin(entry.origin),
        userName: String(entry.user_name || "").trim(),
        userEmail: String(entry.user_email || "").trim().toLowerCase(),
        details: entry.details,
        riskScore: entry.risk_score ?? entry.riskScore ?? null,
        safeScore: entry.safe_score ?? entry.safeScore ?? null,
        confidence: entry.confidence ?? null,
        riskLevel: entry.risk_level ?? entry.riskLevel ?? ""
      }));

    const emailSet = new Set(rawRows.map((row) => row.userEmail).filter(Boolean));
    const emails = Array.from(emailSet);
    const usernameByEmail = new Map();

    if (emails.length > 0) {
      const placeholders = emails.map(() => "?").join(",");
      const [userRows] = await pool.query(
        `SELECT email, username
         FROM \`${usersTable}\`
         WHERE LOWER(COALESCE(email, "")) IN (${placeholders})`,
        emails
      );
      (userRows || []).forEach((u) => {
        const k = String(u.email || "").trim().toLowerCase();
        const v = String(u.username || "").trim();
        if (k) usernameByEmail.set(k, v);
      });
    }

    const rows = rawRows.map((row) => ({
      ...row,
      username: usernameByEmail.get(row.userEmail) || ""
    }));

    return res.json({ rows });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load analyzer data", detail: err.message });
  }
});

app.delete("/api/analyzer-log/:id", async (req, res) => {
  try {
    const id = String(req.params.id || "").trim();
    const email = String(req.query.email || "").trim().toLowerCase();
    if (!id || !email) {
      return res.status(400).json({ message: "Log id and email are required." });
    }

    const isAdminRequest = isAdminEmail(email);
    const logs = await readAnalyzerLogs();
    const next = logs.filter((entry) => {
      const idMatches = String(entry.id || "") === id;
      if (!idMatches) return true;
      if (isAdminRequest) return false;
      return String(entry.user_email || "").toLowerCase() !== email;
    });
    if (next.length === logs.length) {
      return res.status(404).json({ message: "Record not found." });
    }
    await writeAnalyzerLogs(next);
    return res.json({ message: "Record deleted." });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete record", detail: err.message });
  }
});

app.post("/api/analyzer-log/delete-many", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const ids = Array.isArray(req.body.ids) ? req.body.ids.map((v) => String(v)) : [];
    if (!email || ids.length === 0) {
      return res.status(400).json({ message: "Email and ids are required." });
    }

    const isAdminRequest = isAdminEmail(email);
    const idSet = new Set(ids);
    const logs = await readAnalyzerLogs();
    const next = logs.filter((entry) => {
      const targetId = idSet.has(String(entry.id || ""));
      if (!targetId) return true;
      if (isAdminRequest) return false;
      return String(entry.user_email || "").toLowerCase() !== email;
    });
    const deleted = logs.length - next.length;
    if (deleted === 0) {
      return res.status(404).json({ message: "No matching records found." });
    }
    await writeAnalyzerLogs(next);
    return res.json({ message: "Records deleted.", deleted });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete records", detail: err.message });
  }
});

app.get("/api/admin/analyzer-export", async (req, res) => {
  try {
    const key = String(req.query.key || req.header("x-admin-key") || "").trim();
    if (!hasValidAdminExportKey(key)) {
      return res.status(403).json({ message: "Forbidden: invalid admin key." });
    }

    const content = await fs.readFile(analyzerCsvPath, "utf8");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=\"analyzer_logs.csv\"");
    return res.status(200).send(content);
  } catch (err) {
    return res.status(500).json({ message: "Failed to export analyzer data", detail: err.message });
  }
});

app.get("/api/admin/leaderboard-export", async (req, res) => {
  try {
    const key = String(req.query.key || req.header("x-admin-key") || "").trim();
    if (!hasValidAdminExportKey(key)) {
      return res.status(403).json({ message: "Forbidden: invalid admin key." });
    }

    const [rows] = await pool.query(
      `SELECT
         user_name AS userName,
         user_email AS userEmail,
         COALESCE(MAX(u.username), "") AS username,
         COUNT(*) AS runs,
         ROUND(AVG(score), 1) AS avgScore,
         MAX(score) AS bestScore
       FROM game_scores gs
       LEFT JOIN \`${usersTable}\` u ON LOWER(COALESCE(u.email, "")) = gs.user_email
       GROUP BY user_email, user_name
       ORDER BY avgScore DESC, bestScore DESC, runs DESC
       LIMIT 1000`
    );

    const header = "rank,user_name,username,user_email,runs,avg_score,best_score\n";
    const body = (rows || []).map((row, idx) => ([
      idx + 1,
      row.userName,
      row.username,
      row.userEmail,
      row.runs,
      row.avgScore,
      row.bestScore
    ].map(csvEscape).join(","))).join("\n");
    const content = `${header}${body}${body ? "\n" : ""}`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=\"leaderboard_export.csv\"");
    return res.status(200).send(content);
  } catch (err) {
    return res.status(500).json({ message: "Failed to export leaderboard data", detail: err.message });
  }
});


app.post("/api/game-score", async (req, res) => {
  try {
    let userName = String(req.body.userName || "User").trim() || "User";
    const userEmail = String(req.body.userEmail || "").trim().toLowerCase();
    const gameKey = String(req.body.gameKey || "").trim().toLowerCase();
    const score = Math.max(0, Math.round(Number(req.body.score || 0)));
    const correctCount = Math.max(0, Math.round(Number(req.body.correctCount || 0)));
    const totalQuestions = Math.max(0, Math.round(Number(req.body.totalQuestions || 0)));
    const accuracy = totalQuestions > 0
      ? Math.max(0, Math.min(100, (correctCount / totalQuestions) * 100))
      : 0;
    const durationSeconds = Math.max(0, Math.round(Number(req.body.durationSeconds || 0)));

    if (!userEmail) {
      return res.status(400).json({ message: "User email is required." });
    }
    if (!allowedGameKeys.has(gameKey)) {
      return res.status(400).json({ message: "Invalid game key." });
    }

    if (userName === "User" || userName === "Unknown") {
      const [ownerRows] = await pool.query(
        `SELECT COALESCE(NULLIF(name, ''), NULLIF(username, ''), 'User') AS displayName
         FROM \`${usersTable}\`
         WHERE email = ?
         LIMIT 1`,
        [userEmail]
      );
      userName = String(ownerRows?.[0]?.displayName || userName).trim() || "User";
    }

    const [scoreInsert] = await pool.query(
      `INSERT INTO game_scores
      (user_name, user_email, game_key, score, accuracy, correct_count, total_questions, duration_seconds)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userName.slice(0, 120), userEmail.slice(0, 190), gameKey, score, accuracy, correctCount, totalQuestions, durationSeconds]
    );

    await pool.query(
      `INSERT INTO leaderboard (username, email, score, scans_completed, threats_detected, source_game_score_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userName.slice(0, 100),
        userEmail.slice(0, 150),
        score,
        totalQuestions,
        correctCount,
        Number(scoreInsert?.insertId || 0) || null
      ]
    );

    return res.status(201).json({ message: "Score saved." });
  } catch (err) {
    return res.status(500).json({ message: "Failed to save game score", detail: err.message });
  }
});

app.get("/api/game-score/board", async (req, res) => {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();
    const requestedGameKey = String(req.query.gameKey || "all").trim().toLowerCase();
    const gameKey = requestedGameKey === "all" ? "all" : requestedGameKey;
    const isAdminBoardView = isAdminEmail(email);

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }
    if (gameKey !== "all" && !allowedGameKeys.has(gameKey)) {
      return res.status(400).json({ message: "Invalid game key." });
    }

    const [summaryRows] = await pool.query(
      `SELECT
        COUNT(*) AS runs,
        ROUND(AVG(score), 1) AS avgScore,
        COALESCE(MAX(score), 0) AS bestScore,
        COUNT(DISTINCT game_key) AS gamesPlayed
      FROM game_scores
      WHERE user_email = ?`,
      [email]
    );

    const historySql = gameKey === "all"
      ? `SELECT game_key AS gameKey, score, accuracy, correct_count AS correctCount,
           total_questions AS totalQuestions, duration_seconds AS durationSeconds, created_at AS createdAt
         FROM game_scores
         WHERE user_email = ?
         ORDER BY created_at ASC
         LIMIT 60`
      : `SELECT game_key AS gameKey, score, accuracy, correct_count AS correctCount,
           total_questions AS totalQuestions, duration_seconds AS durationSeconds, created_at AS createdAt
         FROM game_scores
         WHERE user_email = ? AND game_key = ?
         ORDER BY created_at ASC
         LIMIT 60`;
    const historyParams = gameKey === "all" ? [email] : [email, gameKey];
    const [historyRows] = await pool.query(historySql, historyParams);

    const recentSql = isAdminBoardView
      ? `SELECT
           gs.user_name AS userName,
           gs.user_email AS userEmail,
           COALESCE(u.username, "") AS username,
           gs.game_key AS gameKey,
           gs.score AS score,
           gs.accuracy AS accuracy,
           gs.correct_count AS correctCount,
           gs.total_questions AS totalQuestions,
           gs.duration_seconds AS durationSeconds,
           gs.created_at AS createdAt
         FROM game_scores gs
         LEFT JOIN \`${usersTable}\` u ON LOWER(COALESCE(u.email, "")) = gs.user_email
         ORDER BY gs.created_at DESC
         LIMIT 20`
      : `SELECT
           gs.user_name AS userName,
           gs.user_email AS userEmail,
           COALESCE(u.username, "") AS username,
           gs.game_key AS gameKey,
           gs.score AS score,
           gs.accuracy AS accuracy,
           gs.correct_count AS correctCount,
           gs.total_questions AS totalQuestions,
           gs.duration_seconds AS durationSeconds,
           gs.created_at AS createdAt
         FROM game_scores gs
         LEFT JOIN \`${usersTable}\` u ON LOWER(COALESCE(u.email, "")) = gs.user_email
         WHERE gs.user_email = ?
         ORDER BY gs.created_at DESC
         LIMIT 8`;
    const recentParams = isAdminBoardView ? [] : [email];
    const [recentRows] = await pool.query(recentSql, recentParams);

    const leaderboardSql = gameKey === "all"
      ? `SELECT
           gs.user_name AS userName,
           gs.user_email AS userEmail,
           COALESCE(MAX(u.username), "") AS username,
           COUNT(*) AS runs,
           ROUND(AVG(score), 1) AS avgScore,
           MAX(score) AS bestScore
         FROM game_scores gs
         LEFT JOIN \`${usersTable}\` u ON LOWER(COALESCE(u.email, "")) = gs.user_email
         GROUP BY gs.user_email, gs.user_name
         ORDER BY avgScore DESC, bestScore DESC, runs DESC
         LIMIT 20`
      : `SELECT
           gs.user_name AS userName,
           gs.user_email AS userEmail,
           COALESCE(MAX(u.username), "") AS username,
           COUNT(*) AS runs,
           ROUND(AVG(score), 1) AS avgScore,
           MAX(score) AS bestScore
         FROM game_scores gs
         LEFT JOIN \`${usersTable}\` u ON LOWER(COALESCE(u.email, "")) = gs.user_email
         WHERE gs.game_key = ?
         GROUP BY gs.user_email, gs.user_name
         ORDER BY avgScore DESC, bestScore DESC, runs DESC
         LIMIT 20`;
    const leaderboardParams = gameKey === "all" ? [] : [gameKey];
    const [leaderboardRows] = await pool.query(leaderboardSql, leaderboardParams);

    return res.json({
      summary: summaryRows?.[0] || { runs: 0, avgScore: 0, bestScore: 0, gamesPlayed: 0 },
      history: historyRows || [],
      recent: recentRows || [],
      leaderboard: leaderboardRows || []
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load game leaderboard", detail: err.message });
  }
});

app.get("/api/game-score/my", async (req, res) => {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const [summaryRows] = await pool.query(
      `SELECT
        COUNT(*) AS runs,
        ROUND(AVG(score), 1) AS avgScore,
        COALESCE(MAX(score), 0) AS bestScore,
        COUNT(DISTINCT game_key) AS gamesPlayed
      FROM game_scores
      WHERE user_email = ?`,
      [email]
    );

    const [recentRows] = await pool.query(
      `SELECT game_key AS gameKey, score, accuracy, created_at AS createdAt
       FROM game_scores
       WHERE user_email = ?
       ORDER BY created_at DESC
       LIMIT 20`,
      [email]
    );

    return res.json({
      summary: summaryRows?.[0] || { runs: 0, avgScore: 0, bestScore: 0, gamesPlayed: 0 },
      recent: recentRows || []
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load my score board", detail: err.message });
  }
});

const PORT = process.env.PORT || 2906;

ensureDatabaseExists()
  .then(() => Promise.all([
    ensureUsersTable(),
    ensureLoginAuditTable(),
    ensureAnalyzerLogFile(),
    ensureAgentCaseFile(),
    ensureGameScoresTable(),
    ensureAnalysisHistoryTable(),
    ensureLeaderboardTable()
  ]))
  .then(() => backfillLeaderboardFromGameScores())
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Startup failed:", err.code || "UNKNOWN", err.message || "");
    process.exit(1);
  });
