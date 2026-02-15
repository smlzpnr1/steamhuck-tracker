-- =============================================
-- STEAMHUCK TRACKER - VERİTABANI ŞEMASI
-- =============================================
-- Bu SQL'i Supabase SQL Editor'da çalıştırın

-- 1. Workouts (Antrenmanlar) Tablosu
CREATE TABLE IF NOT EXISTS workouts (
  id BIGSERIAL PRIMARY KEY,
  user_name TEXT NOT NULL,
  workout_type TEXT NOT NULL,
  points INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tags (Etiketlemeler) Tablosu
CREATE TABLE IF NOT EXISTS tags (
  id BIGSERIAL PRIMARY KEY,
  tagger_user TEXT NOT NULL,      -- Etiketleyen kişi
  target_user TEXT NOT NULL,       -- Etiketlenen kişi
  status TEXT DEFAULT 'pending',   -- pending, completed, failed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Weekly Goals (Haftalık Hedefler) Tablosu
CREATE TABLE IF NOT EXISTS weekly_goals (
  id BIGSERIAL PRIMARY KEY,
  user_name TEXT NOT NULL,
  week_number INTEGER NOT NULL,
  goal_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) Politikaları
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_goals ENABLE ROW LEVEL SECURITY;

-- Herkesin okuma/yazma yapabilmesi için politikalar
CREATE POLICY "Enable all access for workouts" ON workouts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for tags" ON tags FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for weekly_goals" ON weekly_goals FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- ÖRNEK VERİLER (İSTEĞE BAĞLI - TEST İÇİN)
-- =============================================

-- Eğer test etmek isterseniz bu satırları da çalıştırabilirsiniz:
-- INSERT INTO workouts (user_name, workout_type, points) VALUES ('Emir', 'sh_training', 4);
-- INSERT INTO workouts (user_name, workout_type, points) VALUES ('Ceyhun', 'upper_body', 2);
