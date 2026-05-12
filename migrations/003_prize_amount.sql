-- LottoSquad Migration 003 — Prize Amount
-- Run in Supabase Dashboard > SQL Editor

ALTER TABLE draws ADD COLUMN IF NOT EXISTS prize_amount numeric(10,2) DEFAULT 0;
