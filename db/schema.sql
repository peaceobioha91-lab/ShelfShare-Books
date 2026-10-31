CREATE TABLE IF NOT EXISTS members (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'librarian')),
  plan TEXT CHECK (plan IS NULL OR plan IN ('Basic', 'Standard')),
  paid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS books (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  category TEXT NOT NULL,
  cover_url TEXT,
  copies_total INTEGER NOT NULL DEFAULT 1 CHECK (copies_total >= 0),
  copies_available INTEGER NOT NULL DEFAULT 1 CHECK (copies_available >= 0 AND copies_available <= copies_total),
  UNIQUE (title, author)
);

ALTER TABLE books ADD COLUMN IF NOT EXISTS cover_url TEXT;

CREATE TABLE IF NOT EXISTS loans (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
  book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE RESTRICT,
  borrowed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_at TIMESTAMPTZ NOT NULL,
  returned_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'borrowed' CHECK (status IN ('borrowed', 'returned', 'overdue')),
  reminder_claimed_at TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ
);

ALTER TABLE loans ADD COLUMN IF NOT EXISTS reminder_claimed_at TIMESTAMPTZ;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS borrow_requests (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at TIMESTAMPTZ,
  reviewed_by BIGINT REFERENCES members(id) ON DELETE SET NULL,
  loan_id BIGINT REFERENCES loans(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS membership_payments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('Basic', 'Standard')),
  amount_kobo INTEGER NOT NULL CHECK (amount_kobo > 0),
  currency TEXT NOT NULL DEFAULT 'NGN' CHECK (currency = 'NGN'),
  reference TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  paystack_transaction_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS membership_payments_member_date_idx
  ON membership_payments (member_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS borrow_requests_one_pending_idx
  ON borrow_requests (member_id, book_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS borrow_requests_status_date_idx
  ON borrow_requests (status, requested_at);

CREATE TABLE IF NOT EXISTS waitlist (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position > 0),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notified BOOLEAN NOT NULL DEFAULT FALSE,
  hold_until TIMESTAMPTZ,
  email_claimed_at TIMESTAMPTZ,
  email_sent_at TIMESTAMPTZ,
  UNIQUE (book_id, position),
  UNIQUE (member_id, book_id)
);

ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS hold_until TIMESTAMPTZ;
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS email_claimed_at TIMESTAMPTZ;
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS loans_member_status_idx ON loans (member_id, status);
CREATE INDEX IF NOT EXISTS loans_book_status_idx ON loans (book_id, status);
CREATE INDEX IF NOT EXISTS waitlist_book_position_idx ON waitlist (book_id, position);
CREATE INDEX IF NOT EXISTS loans_reminder_due_idx ON loans (due_at) WHERE returned_at IS NULL AND reminder_sent_at IS NULL;
CREATE INDEX IF NOT EXISTS waitlist_unsent_hold_idx ON waitlist (hold_until) WHERE hold_until IS NOT NULL AND notified = FALSE;
