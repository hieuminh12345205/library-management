-- LibraryHub – lược đồ cơ sở dữ liệu (chạy lại nhiều lần không lỗi)

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  full_name     VARCHAR(50)  NOT NULL,
  email         VARCHAR(100) NOT NULL,
  phone         VARCHAR(10)  NOT NULL,
  password_hash TEXT         NOT NULL,
  role          VARCHAR(10)  NOT NULL DEFAULT 'READER' CHECK (role IN ('READER', 'LIBRARIAN', 'ADMIN')),
  status        VARCHAR(10)  NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'LOCKED')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_uq ON users (lower(email));

CREATE TABLE IF NOT EXISTS books (
  id               SERIAL PRIMARY KEY,
  isbn             VARCHAR(13)  NOT NULL,
  title            VARCHAR(200) NOT NULL,
  author           VARCHAR(100) NOT NULL,
  category         VARCHAR(50)  NOT NULL,
  publisher        VARCHAR(100) NOT NULL DEFAULT '',
  publish_year     INTEGER,
  total_copies     INTEGER      NOT NULL CHECK (total_copies BETWEEN 1 AND 100),
  available_copies INTEGER      NOT NULL,
  description      TEXT         NOT NULL DEFAULT '',
  cover_url        VARCHAR(500) NOT NULL DEFAULT '',
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  deleted_at       TIMESTAMPTZ,
  CHECK (available_copies >= 0 AND available_copies <= total_copies)
);
CREATE UNIQUE INDEX IF NOT EXISTS books_isbn_uq ON books (isbn) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS books_created_idx ON books (created_at DESC);

CREATE TABLE IF NOT EXISTS loans (
  id            SERIAL PRIMARY KEY,
  code          VARCHAR(20)  NOT NULL UNIQUE,
  user_id       INTEGER      NOT NULL REFERENCES users (id),
  book_id       INTEGER      NOT NULL REFERENCES books (id),
  status        VARCHAR(10)  NOT NULL CHECK (status IN ('PENDING', 'BORROWING', 'OVERDUE', 'RETURNED', 'REJECTED')),
  requested_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  approved_at   TIMESTAMPTZ,
  approved_by   INTEGER      REFERENCES users (id),
  due_date      DATE,
  renew_count   INTEGER      NOT NULL DEFAULT 0,
  returned_at   TIMESTAMPTZ,
  returned_by   INTEGER      REFERENCES users (id),
  overdue_days  INTEGER      NOT NULL DEFAULT 0,
  fine          INTEGER      NOT NULL DEFAULT 0,
  rejected_at   TIMESTAMPTZ,
  reject_reason VARCHAR(200)
);
CREATE INDEX IF NOT EXISTS loans_user_status_idx ON loans (user_id, status);
CREATE INDEX IF NOT EXISTS loans_status_idx ON loans (status);
CREATE INDEX IF NOT EXISTS loans_book_idx ON loans (book_id);

-- Bộ đếm sinh mã phiếu PM-YYYYMMDD-NNNN
CREATE TABLE IF NOT EXISTS daily_counters (
  day DATE    PRIMARY KEY,
  n   INTEGER NOT NULL
);

-- Token đã đăng xuất
CREATE TABLE IF NOT EXISTS revoked_tokens (
  jti        UUID        PRIMARY KEY,
  expires_at TIMESTAMPTZ NOT NULL
);
