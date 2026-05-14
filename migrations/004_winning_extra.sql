-- LottoSquad Migration 004 — Winning Extra Numbers
-- Run in Supabase Dashboard > SQL Editor

ALTER TABLE draws ADD COLUMN IF NOT EXISTS winning_extra  text DEFAULT NULL;
ALTER TABLE draws ADD COLUMN IF NOT EXISTS winning_extra2 text DEFAULT NULL;
