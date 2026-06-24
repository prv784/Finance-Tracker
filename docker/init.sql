-- ============================================================
-- Finance Tracker – PostgreSQL Schema (Java 17 + Gemini AI)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Users ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id                    BIGSERIAL PRIMARY KEY,
    email                 VARCHAR(255) NOT NULL UNIQUE,
    password              VARCHAR(255) NOT NULL,
    first_name            VARCHAR(100) NOT NULL,
    last_name             VARCHAR(100) NOT NULL,
    profile_picture       VARCHAR(500),
    enabled               BOOLEAN NOT NULL DEFAULT FALSE,
    otp_code              VARCHAR(255),
    otp_expiry_time       TIMESTAMP,
    reset_password_token  VARCHAR(255),
    reset_token_expiry    TIMESTAMP,
    role                  VARCHAR(20)  NOT NULL DEFAULT 'USER',
    created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── Categories ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    icon       VARCHAR(50),
    color      VARCHAR(20),
    type       VARCHAR(20)  NOT NULL CHECK (type IN ('EXPENSE','INCOME','BOTH')),
    is_default BOOLEAN      NOT NULL DEFAULT FALSE,
    user_id    BIGINT REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (name, user_id)
);

-- ── Expenses ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
    id              BIGSERIAL PRIMARY KEY,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    amount          NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    date            DATE          NOT NULL,
    category_id     BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payment_method  VARCHAR(50),
    notes           TEXT,
    is_recurring    BOOLEAN NOT NULL DEFAULT FALSE,
    recurrence_type VARCHAR(20) CHECK (recurrence_type IN ('DAILY','WEEKLY','MONTHLY','YEARLY')),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── Income ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS income (
    id              BIGSERIAL PRIMARY KEY,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    amount          NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    date            DATE          NOT NULL,
    source          VARCHAR(50)   NOT NULL DEFAULT 'OTHER'
                        CHECK (source IN ('SALARY','FREELANCE','BUSINESS','INVESTMENT',
                                          'RENTAL','GIFT','BONUS','OTHER')),
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notes           TEXT,
    is_recurring    BOOLEAN NOT NULL DEFAULT FALSE,
    recurrence_type VARCHAR(20) CHECK (recurrence_type IN ('DAILY','WEEKLY','MONTHLY','YEARLY')),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── Budgets ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS budgets (
    id               BIGSERIAL PRIMARY KEY,
    name             VARCHAR(200)  NOT NULL,
    amount           NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    month            INT           NOT NULL CHECK (month BETWEEN 1 AND 12),
    year             INT           NOT NULL CHECK (year >= 2000),
    category_id      BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    user_id          BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    alert_threshold  NUMERIC(5,2)  NOT NULL DEFAULT 80.00,
    alert_sent       BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── Performance Indexes ────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_expenses_user_date     ON expenses(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_user_category ON expenses(user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_income_user_date       ON income(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_budgets_user_period    ON budgets(user_id, year, month);
CREATE INDEX IF NOT EXISTS idx_categories_user        ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email            ON users(email);

-- ── Auto-update updated_at trigger ────────────────────────
CREATE OR REPLACE FUNCTION _set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = CURRENT_TIMESTAMP; RETURN NEW; END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_users_updated_at')     THEN CREATE TRIGGER trg_users_updated_at     BEFORE UPDATE ON users     FOR EACH ROW EXECUTE FUNCTION _set_updated_at(); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_expenses_updated_at')  THEN CREATE TRIGGER trg_expenses_updated_at  BEFORE UPDATE ON expenses  FOR EACH ROW EXECUTE FUNCTION _set_updated_at(); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_income_updated_at')    THEN CREATE TRIGGER trg_income_updated_at    BEFORE UPDATE ON income    FOR EACH ROW EXECUTE FUNCTION _set_updated_at(); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_budgets_updated_at')   THEN CREATE TRIGGER trg_budgets_updated_at   BEFORE UPDATE ON budgets   FOR EACH ROW EXECUTE FUNCTION _set_updated_at(); END IF;
END $$;
