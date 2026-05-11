-- LottoSquad Initial Schema
-- Run in Supabase Dashboard > SQL Editor

-- Groups — each admin owns one pool
CREATE TABLE IF NOT EXISTS groups (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name           text NOT NULL,
  slug           text UNIQUE NOT NULL,
  etransfer_info text,
  rules          text,
  created_at     timestamptz DEFAULT now()
);

-- Members — belong to a group, no Supabase Auth required
CREATE TABLE IF NOT EXISTS members (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  name       text NOT NULL,
  email      text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(group_id, name)
);

-- Draws — belong to a group
CREATE TABLE IF NOT EXISTS draws (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id        uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  lottery_type    text DEFAULT 'western_649',
  draw_date       date NOT NULL,
  buy_in_amount   numeric(10,2) NOT NULL DEFAULT 5.00,
  status          text DEFAULT 'open',   -- open | closed | settled
  jackpot_amount  text,
  winning_numbers integer[],
  bonus_number    integer,
  prize_notes     text,
  created_at      timestamptz DEFAULT now()
);

-- Tickets — belong to a draw
CREATE TABLE IF NOT EXISTS tickets (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id        uuid REFERENCES draws(id) ON DELETE CASCADE NOT NULL,
  numbers        integer[] NOT NULL,
  ticket_extra   text,    -- Gold Ball / EXTRA depending on lottery
  ticket_extra2  text,    -- Second extra (e.g. Lotto 6/49 EXTRA alongside Gold Ball)
  serial_number  text,
  created_at     timestamptz DEFAULT now()
);

-- Buy-ins — member commits to a draw
CREATE TABLE IF NOT EXISTS buy_ins (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id    uuid REFERENCES draws(id)   ON DELETE CASCADE NOT NULL,
  member_id  uuid REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  status     text DEFAULT 'pending',     -- pending | confirmed
  paid_at    timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(draw_id, member_id)
);
