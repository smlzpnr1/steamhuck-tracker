# 🥏 Steamhuck Challenge Tracker - Kurulum Rehberi

## 🎯 Sistem Özellikleri

### Puan Tablosu
| Antrenman | Puan |
|-----------|------|
| SH Antrenmanı | 4 |
| Ultimate-specific Alt Vücut/Core/HIIT | 3 |
| Koşu (5km+) / Bisiklet (10km+) / Plyometrics / Sprint | 3 |
| Farklı Takım Frizbi Antrenmanı | 2 |
| Üst Vücut Antrenmanı | 2 |
| Disk Atma | 2 |
| Farklı Spor Dalı | 1 |
| Yoga / Pilates / Mobility | 1 |

### Etiketleme Sistemi 🎯
- Antrenman sonrası rakip takımdan birini etiketleyebilirsin
- Etiketlenen kişi 48 saat içinde 2+ puan yapmalı
- Yapmazsa: **-3 puan**
- Yaparsa: **+1 puan** bonus
- Aynı kişi 48 saat içinde tekrar etiketlenemez

### Haftalık Minimum ⚠️
- Haftada minimum **6 puan** toplanmalı
- Altında kalırsan: **-3 puan** ceza

### 2 Haftalık Dönem
- Dönem sonunda kazanan takımın en çok puanlı oyuncusuna ödül
- Sonraki dönemin kaptanları: En çok puan alan 2 kişi

---

## 🚀 KURULUM (15 dakika)

### ADIM 1: Supabase Veritabanı

1. [supabase.com](https://supabase.com)'a git, ücretsiz hesap aç
2. "New Project" → İsim: `steamhuck-tracker`
3. Şifre belirle, Frankfurt region seç
4. **SQL Editor**'a git, şu kodu çalıştır:

```sql
-- Workouts Tablosu
CREATE TABLE IF NOT EXISTS workouts (
  id BIGSERIAL PRIMARY KEY,
  user_name TEXT NOT NULL,
  workout_type TEXT NOT NULL,
  points INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tags (Etiketleme) Tablosu
CREATE TABLE IF NOT EXISTS tags (
  id BIGSERIAL PRIMARY KEY,
  tagger_user TEXT NOT NULL,
  target_user TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weekly Goals Tablosu
CREATE TABLE IF NOT EXISTS weekly_goals (
  id BIGSERIAL PRIMARY KEY,
  user_name TEXT NOT NULL,
  week_number INTEGER NOT NULL,
  goal_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Politikaları
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all" ON workouts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all" ON tags FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all" ON weekly_goals FOR ALL USING (true) WITH CHECK (true);
```

5. **Project Settings → API** bölümünden kopyala:
   - Project URL
   - anon public key

---

### ADIM 2: GitHub'a Yükle

1. [github.com](https://github.com)'da yeni repo oluştur: `steamhuck-tracker`
2. Tüm dosyaları yükle

---

### ADIM 3: Vercel'e Deploy

1. [vercel.com](https://vercel.com)'a git, GitHub ile giriş yap
2. "Import Project" → `steamhuck-tracker` seç
3. Environment Variables ekle:
   - `VITE_SUPABASE_URL` = Project URL
   - `VITE_SUPABASE_ANON_KEY` = anon key
4. "Deploy" tıkla

---

## ✅ TAMAMLANDI!

Artık `steamhuck-tracker.vercel.app` adresinde canlı!

### İlk Takımlar:
**💚 Emir'in Takımı:** Emir, Simay, Kağan, İrem, Ayşenur, Tuti, Bilgecan, Aytaç, Ece, Deniz, Şevval

**💙 Ceyhun'un Takımı:** Ceyhun, Efza, Tarık Zadil, Elif, Hüseyin, Azra, Emre, Şamil, Dilara, Aliberk, Şeyma

---

## 📱 Telefona Ekle

**iPhone:** Safari → Paylaş → "Ana Ekrana Ekle"
**Android:** Chrome → Menü → "Ana ekrana ekle"

---

## ❓ Sorun Giderme

**Veriler görünmüyor:**
- Supabase'de tabloların oluştuğunu kontrol et
- Environment variables'ı kontrol et

**Etiketleme çalışmıyor:**
- `tags` tablosunun oluştuğundan emin ol
