-- LottoSquad Row Level Security
-- Run AFTER 001_schema.sql
-- Run in Supabase Dashboard > SQL Editor

-- Enable RLS on all tables
ALTER TABLE groups   ENABLE ROW LEVEL SECURITY;
ALTER TABLE members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE draws    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets  ENABLE ROW LEVEL SECURITY;
ALTER TABLE buy_ins  ENABLE ROW LEVEL SECURITY;

-- ── GROUPS ──────────────────────────────────────────────────────────────────

-- Anyone can read groups (needed for invite/join flow by slug)
CREATE POLICY "groups_read_all"
  ON groups FOR SELECT USING (true);

-- Only the admin who owns the group can update/delete it
CREATE POLICY "groups_admin_write"
  ON groups FOR ALL
  USING (admin_id = auth.uid())
  WITH CHECK (admin_id = auth.uid());

-- ── MEMBERS ─────────────────────────────────────────────────────────────────

-- Anyone can read members (needed to load squad roster)
CREATE POLICY "members_read_all"
  ON members FOR SELECT USING (true);

-- Anyone can insert a member (joining via invite link — no auth required)
CREATE POLICY "members_insert_open"
  ON members FOR INSERT WITH CHECK (true);

-- Only the group admin can update or delete members
CREATE POLICY "members_admin_write"
  ON members FOR UPDATE
  USING (group_id IN (SELECT id FROM groups WHERE admin_id = auth.uid()));

CREATE POLICY "members_admin_delete"
  ON members FOR DELETE
  USING (group_id IN (SELECT id FROM groups WHERE admin_id = auth.uid()));

-- ── DRAWS ────────────────────────────────────────────────────────────────────

-- Anyone can read draws
CREATE POLICY "draws_read_all"
  ON draws FOR SELECT USING (true);

-- Only the group admin can manage draws
CREATE POLICY "draws_admin_write"
  ON draws FOR ALL
  USING (group_id IN (SELECT id FROM groups WHERE admin_id = auth.uid()))
  WITH CHECK (group_id IN (SELECT id FROM groups WHERE admin_id = auth.uid()));

-- ── TICKETS ──────────────────────────────────────────────────────────────────

-- Anyone can read tickets
CREATE POLICY "tickets_read_all"
  ON tickets FOR SELECT USING (true);

-- Only the group admin can manage tickets
CREATE POLICY "tickets_admin_write"
  ON tickets FOR ALL
  USING (
    draw_id IN (
      SELECT d.id FROM draws d
      JOIN groups g ON g.id = d.group_id
      WHERE g.admin_id = auth.uid()
    )
  )
  WITH CHECK (
    draw_id IN (
      SELECT d.id FROM draws d
      JOIN groups g ON g.id = d.group_id
      WHERE g.admin_id = auth.uid()
    )
  );

-- ── BUY-INS ──────────────────────────────────────────────────────────────────

-- Anyone can read buy-ins (members need to see their own status)
CREATE POLICY "buy_ins_read_all"
  ON buy_ins FOR SELECT USING (true);

-- Anyone can upsert their own buy-in (marking as paid — no auth required)
CREATE POLICY "buy_ins_insert_open"
  ON buy_ins FOR INSERT WITH CHECK (true);

CREATE POLICY "buy_ins_member_update"
  ON buy_ins FOR UPDATE USING (true);

-- Only the group admin can delete buy-ins
CREATE POLICY "buy_ins_admin_delete"
  ON buy_ins FOR DELETE
  USING (
    draw_id IN (
      SELECT d.id FROM draws d
      JOIN groups g ON g.id = d.group_id
      WHERE g.admin_id = auth.uid()
    )
  );
