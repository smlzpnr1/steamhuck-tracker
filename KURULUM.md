# 🥏 Steamhuck Tracker - Kurulum Rehberi

Bu rehber, uygulamanı sıfırdan canlıya almanı sağlayacak. Toplam süre: ~15 dakika.

---

## 📋 Adım 1: Supabase Kurulumu (5 dakika)

### 1.1 Hesap Oluştur
1. **[supabase.com](https://supabase.com)** adresine git
2. **"Start your project"** butonuna tıkla
3. **GitHub ile giriş yap** (en kolay yöntem)

### 1.2 Yeni Proje Oluştur
1. **"New Project"** butonuna tıkla
2. Ayarları gir:
   - **Name:** `steamhuck-tracker`
   - **Database Password:** Güçlü bir şifre belirle (kaydet!)
   - **Region:** `Frankfurt (eu-central-1)` - Türkiye'ye en yakın
3. **"Create new project"** tıkla
4. 2-3 dakika bekle (veritabanı hazırlanıyor)

### 1.3 Veritabanı Tablolarını Oluştur
1. Sol menüden **"SQL Editor"** tıkla
2. **"New query"** tıkla
3. Aşağıdaki SQL kodunu yapıştır:

```sql
-- Workouts (Antrenmanlar) Tablosu
CREATE TABLE workouts (
  id BIGSERIAL PRIMARY KEY,
  user_name TEXT NOT NULL,
  workout_type TEXT NOT NULL,
  points INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tags (Etiketlemeler) Tablosu
CREATE TABLE tags (
  id BIGSERIAL PRIMARY KEY,
  tagger_user TEXT NOT NULL,
  target_user TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) Politikaları
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Herkesin okuma/yazma yapabilmesi için
CREATE POLICY "Enable all for workouts" ON workouts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for tags" ON tags FOR ALL USING (true) WITH CHECK (true);
```

4. **"Run"** butonuna tıkla (yeşil play butonu)
5. **"Success"** mesajını gör ✅

### 1.4 API Anahtarlarını Al
1. Sol menüden **"Project Settings"** (⚙️ dişli ikon) tıkla
2. **"API"** sekmesine git
3. Şu iki değeri kopyala ve bir yere kaydet:

| Değer | Örnek |
|-------|-------|
| **Project URL** | `https://abcdefgh.supabase.co` |
| **anon public key** | `eyJhbGciOiJIUzI1NiIs...` (uzun bir metin) |

---

## 📋 Adım 2: GitHub'a Yükle (3 dakika)

### 2.1 GitHub Hesabı
1. **[github.com](https://github.com)** adresine git
2. Hesabın yoksa oluştur (ücretsiz)

### 2.2 Yeni Repo Oluştur
1. Sağ üstteki **"+"** butonuna tıkla
2. **"New repository"** seç
3. Ayarları gir:
   - **Repository name:** `steamhuck-tracker`
   - **Public** seç
4. **"Create repository"** tıkla

### 2.3 Dosyaları Yükle
1. Açılan sayfada **"uploading an existing file"** linkine tıkla
2. ZIP dosyasını aç ve TÜM dosyaları sürükle-bırak yap:
   - `package.json`
   - `vite.config.js`
   - `tailwind.config.js`
   - `postcss.config.js`
   - `index.html`
   - `src/` klasörü (içindekilerle birlikte)
   - `public/` klasörü
3. **"Commit changes"** tıkla

---

## 📋 Adım 3: Vercel'e Yayınla (5 dakika)

### 3.1 Vercel Hesabı
1. **[vercel.com](https://vercel.com)** adresine git
2. **"Sign Up"** tıkla
3. **"Continue with GitHub"** seç

### 3.2 Projeyi İçe Aktar
1. **"Add New..."** → **"Project"** tıkla
2. GitHub repoların listelenecek
3. `steamhuck-tracker` yanındaki **"Import"** tıkla

### 3.3 Environment Variables Ekle (ÖNEMLİ!)
1. **"Environment Variables"** bölümünü aç
2. Şu değişkenleri ekle:

| NAME | VALUE |
|------|-------|
| `VITE_SUPABASE_URL` | `https://abcdefgh.supabase.co` (senin URL'n) |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIs...` (senin key'in) |

3. Her birini ekledikten sonra **"Add"** tıkla

### 3.4 Yayınla
1. **"Deploy"** butonuna tıkla
2. 1-2 dakika bekle
3. Yeşil tik görünce tamamdır! ✅
4. Verilen URL'yi kopyala (örn: `steamhuck-tracker.vercel.app`)

---

## 🎉 TAMAMLANDI!

Artık kendi web siten var! URL'yi takım arkadaşlarınla paylaş.

**Site adresi:** `https://steamhuck-tracker.vercel.app` (veya Vercel'in verdiği adres)

---

## 📱 Telefona Uygulama Gibi Ekle

### iPhone:
1. Safari'de siteyi aç
2. Alt kısımdaki **Paylaş** butonuna tıkla
3. **"Ana Ekrana Ekle"** seç
4. **"Ekle"** tıkla

### Android:
1. Chrome'da siteyi aç
2. Sağ üstteki **⋮** menüsüne tıkla
3. **"Ana ekrana ekle"** seç
4. **"Ekle"** tıkla

---

## ❓ Sorun Giderme

### "Veriler görünmüyor" veya "Demo modu" yazıyor:
- Vercel'de Environment Variables'ı doğru ekledin mi?
- Ekleme sonrası **"Redeploy"** yaptın mı?
  - Vercel Dashboard → Deployments → en üstteki → **"Redeploy"**

### SQL hatası alıyorum:
- Tabloların zaten var olup olmadığını kontrol et
- Supabase → Table Editor'da `workouts` ve `tags` tablolarını gör

### Antrenmanlar kaydedilmiyor:
- Browser Console'da hata var mı? (F12 → Console)
- Supabase API key'i doğru mu?

---

## 🔄 Güncelleme Yapmak İstersen

1. GitHub'da dosyayı düzenle veya yeni dosya yükle
2. Vercel otomatik olarak yeniden deploy edecek
3. 1-2 dakika içinde site güncellenecek

---

## 📞 Yardım

Herhangi bir sorunla karşılaşırsan Claude'a sor! 🚀
