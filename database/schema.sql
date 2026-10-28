-- ==========================================================
-- TOEFL Path - Complete Database Schema
-- Database Name: toefl_path
-- Target: MySQL (XAMPP MariaDB 10.4+ / MySQL 8.0+)
-- ==========================================================

CREATE DATABASE IF NOT EXISTS toefl_path
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE toefl_path;

-- ----------------------------------------------------------
-- 1. Table: users
-- Menyimpan data profil pengguna
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(190) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 2. Table: user_goals
-- Target skor TOEFL iBT (0-120), target waktu belajar, & tanggal tes
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_goals (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    target_score_min TINYINT UNSIGNED NOT NULL DEFAULT 80,
    target_score_max TINYINT UNSIGNED NOT NULL DEFAULT 100,
    target_exam_date DATE NULL,
    daily_study_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 60,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY fk_goals_user (user_id),
    CONSTRAINT fk_goals_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_target_score CHECK (target_score_min <= target_score_max AND target_score_max <= 120)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 3. Table: questions (Bank Soal TOEFL iBT)
-- Mendukung 4 skill: Reading, Listening, Speaking, Writing
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS questions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    skill ENUM('reading', 'listening', 'speaking', 'writing') NOT NULL,
    question_type VARCHAR(60) NOT NULL,
    difficulty ENUM('beginner', 'intermediate', 'advanced') NOT NULL DEFAULT 'intermediate',
    prompt TEXT NOT NULL,
    content LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(content)),
    options LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(options)),
    answer_key LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(answer_key)),
    explanation TEXT DEFAULT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_questions_skill (skill),
    INDEX idx_questions_type (question_type),
    INDEX idx_questions_difficulty (difficulty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 4. Table: learning_materials
-- Materi belajar TOEFL iBT dengan konten dan referensi media
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS learning_materials (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    slug VARCHAR(120) NOT NULL UNIQUE,
    title VARCHAR(180) NOT NULL,
    description TEXT DEFAULT NULL,
    skill ENUM('reading', 'listening', 'speaking', 'writing') NOT NULL,
    difficulty ENUM('beginner', 'intermediate', 'advanced') NOT NULL DEFAULT 'intermediate',
    estimated_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 10,
    body LONGTEXT NOT NULL,
    image_data LONGBLOB DEFAULT NULL,
    image_mime_type VARCHAR(80) DEFAULT NULL,
    image_url TEXT DEFAULT NULL,
    audio_data LONGBLOB DEFAULT NULL,
    audio_mime_type VARCHAR(80) DEFAULT NULL,
    audio_url TEXT DEFAULT NULL,
    audio_transcript LONGTEXT DEFAULT NULL,
    source_name VARCHAR(180) NOT NULL DEFAULT 'TOEFL Path',
    source_url TEXT DEFAULT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_materials_skill (skill, is_active),
    INDEX idx_materials_difficulty (difficulty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 5. Table: practice_sessions
-- Mencatat sesi latihan atau simulasi tes harian pengguna
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS practice_sessions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    session_type ENUM('diagnostic', 'practice', 'mock_test') NOT NULL DEFAULT 'practice',
    skill ENUM('reading', 'listening', 'speaking', 'writing', 'full') NOT NULL DEFAULT 'reading',
    status ENUM('in_progress', 'completed', 'abandoned') NOT NULL DEFAULT 'in_progress',
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL DEFAULT NULL,
    duration_seconds INT UNSIGNED DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_sessions_user_date (user_id, started_at),
    CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 6. Table: responses
-- Menyimpan jawaban user per butir soal dalam satu sesi
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS responses (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    session_id BIGINT UNSIGNED NOT NULL,
    question_id BIGINT UNSIGNED NOT NULL,
    answer LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(answer)),
    is_correct TINYINT(1) DEFAULT NULL,
    score_value DECIMAL(5, 2) DEFAULT NULL,
    time_spent_seconds INT UNSIGNED DEFAULT 0,
    answered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_session_question (session_id, question_id),
    KEY fk_responses_question (question_id),
    CONSTRAINT fk_responses_session FOREIGN KEY (session_id) REFERENCES practice_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_responses_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 7. Table: feedback
-- Evaluasi, rubrik nilai, dan catatan perbaikan jawaban user
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS feedback (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    response_id BIGINT UNSIGNED NOT NULL,
    rubric_scores LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(rubric_scores)),
    strengths TEXT DEFAULT NULL,
    improvements TEXT DEFAULT NULL,
    feedback_source ENUM('self_review', 'rule_based', 'ai', 'human') NOT NULL DEFAULT 'rule_based',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY fk_feedback_response (response_id),
    CONSTRAINT fk_feedback_response FOREIGN KEY (response_id) REFERENCES responses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 8. Table: skill_progress
-- Rekap perkembangan per skill untuk ditampilkan pada dashboard
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS skill_progress (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    skill ENUM('reading', 'listening', 'speaking', 'writing') NOT NULL,
    assessment_type ENUM('diagnostic', 'weekly', 'monthly', 'mock_test', 'daily') NOT NULL DEFAULT 'daily',
    accuracy_percent DECIMAL(5, 2) DEFAULT NULL,
    rubric_score DECIMAL(4, 2) DEFAULT NULL,
    assessed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_progress_user_skill_date (user_id, skill, assessed_at),
    CONSTRAINT fk_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 9. Table: study_plan_items
-- Agenda dan to-do list belajar harian pengguna
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS study_plan_items (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(180) NOT NULL,
    description TEXT DEFAULT NULL,
    skill ENUM('reading', 'listening', 'speaking', 'writing', 'vocabulary', 'mixed') NOT NULL,
    scheduled_date DATE NOT NULL,
    planned_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 60,
    status ENUM('pending', 'completed', 'skipped') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_plan_user_date (user_id, scheduled_date),
    CONSTRAINT fk_plan_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 10. Table: vocabularies
-- Bank Kosakata TOEFL untuk memperkaya vocabulary
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS vocabularies (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    word VARCHAR(100) NOT NULL,
    part_of_speech VARCHAR(30) NULL,
    definition TEXT NOT NULL,
    sample_sentence TEXT NULL,
    synonyms VARCHAR(255) NULL,
    mastery_status ENUM('new', 'reviewing', 'mastered') NOT NULL DEFAULT 'new',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_vocab_user (user_id),
    KEY idx_vocab_word (word),
    CONSTRAINT fk_vocab_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 11. Default Seed Data (Akun Pengguna Awal & Goal)
-- ----------------------------------------------------------
INSERT INTO users (id, full_name, email, password_hash)
VALUES (1, 'TOEFL Learner', 'user@toeflpath.local', '$2a$10$demopasswordhashforlocaldevelopment')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

INSERT INTO user_goals (user_id, target_score_min, target_score_max, target_exam_date, daily_study_minutes)
VALUES (1, 90, 105, DATE_ADD(CURRENT_DATE, INTERVAL 60 DAY), 60)
ON DUPLICATE KEY UPDATE target_score_max = VALUES(target_score_max);
