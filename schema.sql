CREATE DATABASE IF NOT EXISTS indexdb;
USE indexdb;

CREATE TABLE IF NOT EXISTS `user` (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `users` (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(120),
  name VARCHAR(120),
  email VARCHAR(190) NOT NULL UNIQUE,
  password VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `login_audit` (
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
);

CREATE TABLE IF NOT EXISTS `analysis_history` (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(32) NOT NULL,
  input_data LONGTEXT NOT NULL,
  result LONGTEXT NOT NULL,
  risk_score INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_analysis_history_type (type),
  INDEX idx_analysis_history_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS `analyzer_logs` (
  id VARCHAR(32) PRIMARY KEY,
  timestamp VARCHAR(40) NOT NULL,
  type VARCHAR(16) NOT NULL,
  origin VARCHAR(32) NOT NULL DEFAULT 'website',
  user_name VARCHAR(120),
  user_email VARCHAR(190) NOT NULL,
  details LONGTEXT NOT NULL,
  risk_score INT NULL,
  safe_score INT NULL,
  confidence INT NULL,
  risk_level VARCHAR(16) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_analyzer_logs_timestamp (timestamp),
  INDEX idx_analyzer_logs_type (type),
  INDEX idx_analyzer_logs_user_email (user_email)
);

CREATE TABLE IF NOT EXISTS `leaderboard` (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(150),
  score INT DEFAULT 0,
  scans_completed INT DEFAULT 0,
  threats_detected INT DEFAULT 0,
  source_game_score_id BIGINT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
