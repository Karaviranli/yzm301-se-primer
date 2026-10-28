# Stitch ve AI Studio adımları (Google hesabı gerektirir)

Ödevin 2. ve 3. adımları Google'ın kendi araçlarında, öğrencinin Google hesabıyla yapılır. Bu repo hazırlanırken bu iki adım **yapılmadı**: ajan, öğrencinin Google hesabına giriş yapamaz. Aşağıdaki metinler kopyala-yapıştır için hazır. Toplam süre yaklaşık 20 dakika.

## Adım 2 — Stitch (stitch.withgoogle.com)

1. Yeni proje açın, **Mobile** seçin.
2. Şu istemi yapıştırın:

```
Türkçe, mobil, tek sütun, 3 ekranlı bir "seçimli hikâye" oyunu tasarla. Konu: kurgusal bir hastanede randevu sistemi çöktü, oyuncu nöbetçi yazılım mühendisi.
Ekran 1 Giriş: başlık "08:00, randevu sistemi çöktü. Nöbetçi sensin." + 3 radyo sorusu (Seviye: Yeni başladım/Biraz deneyimim var/Deneyimliyim; Rol: Backend geliştirici/Test mühendisi/Ekip lideri; Hedef: Mimari/Test/KVKK) + "Nöbete başla" birincil düğme.
Ekran 2 Sahne: üstte "KARAR 1 · MİMARİ" etiketi, durum metni kartı, iki büyük seçenek düğmesi (A) Eski sürüme geri dön, B) Canlıda yama yap), deneyimliler için geri sayan "60 sn" sayacı, altta "Tutor" kartı (ipucu balonu, metin alanı, "Tutor'a sor" düğmesi).
Ekran 3 Son: "SON A · İYİ" etiketi, "08:13 · Sistem ayakta, veri güvende" manşeti, 3 kararın numaralı özeti, "Yeniden oyna" düğmesi.
Stil: sakin, yüksek kontrast, teal birincil renk (#0b6e69), yeşil iyi son, turuncu risk/sayaç, kart köşeleri 14px, dokunma hedefi en az 48px, açık ve koyu tema.
```

3. Üç ekranın PNG'sini `docs/stitch/` klasörüne koyun. Stitch'in ürettiği DESIGN.md ile repodaki `DESIGN.md` dosyasını değiştirin.

## Adım 3 — AI Studio (aistudio.google.com → Build)

1. **Build** sekmesinde yeni uygulama açın. Stitch ekranlarını görsel olarak ekleyin.
2. Şu istemi yapıştırın (spec'i ve mevcut kodu verir):

```
Bu repodaki spec.md'yi birebir uygula: https://github.com/Karaviranli/yzm301-se-primer/blob/main/spec.md
Ekli ekran tasarımlarını kullan. Senaryo metinleri story.js'te, tutor kuralları tutor.js'te (SYSTEM_PROMPT) — bunları aynen kullan.
Tutor için Gemini kullan; SYSTEM_PROMPT'u sistem talimatı yap. Tutor hiçbir koşulda hangi seçeneğin doğru olduğunu söylemesin.
Kapsam dışı: kullanıcı hesabı/giriş, ikinci bölüm, gerçek hasta verisi, native mobil uygulama.
Her elemana Cypress için data-cy niteliği ekle: start, level-*, role-*, goal-*, opt-A, opt-B, what, why, next, ending, ending-title, recap, restart, tutor-input, tutor-send, tutor-reply, auto-hint, timer, timeout, focus, intro.
```

3. Uygulamayı çalıştırın, telefonda açıp baştan sona oynayın. **Share / Deploy** ile linki alın ve README'deki "AI Studio linki" satırına yazın.
4. AI Studio sürümünde tutor Gemini ile çalışır. Ölçmek için şunu koşturun ve `eval/labels.json` dosyasına `gemini-v1` etiketlerini elle ekleyin:

```bash
GEMINI_API_KEY=... node eval/run_eval.cjs gemini-v1
```
