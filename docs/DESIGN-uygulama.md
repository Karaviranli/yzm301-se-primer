# DESIGN.md — SE Primer

> **Kaynak notu:** Bu dosya, GitHub Pages sürümündeki `style.css` tasarım sisteminin elle yazılmış hâlidir. Stitch'in ürettiği tasarım sistemi kök dizindeki [DESIGN.md](../DESIGN.md) dosyasındadır. Stitch ekranları ise [docs/stitch/](stitch/) klasöründedir.

## İlke

Kriz anında okunan bir ekran: sakin, yüksek kontrastlı, tek sütunlu. Renk dikkat çekmek için değil, **anlam** taşımak için kullanılır:

- Teal: eylem ve odak
- Yeşil: iyi son
- Turuncu: risk, süre, kötü son

## Ekranlar (mobil, 390 × 844)

| Ekran | İçerik | Gerçek görüntü |
|---|---|---|
| 1. Giriş | Başlık + 3 soru (seviye, rol, hedef) + "Nöbete başla" (3 soru cevaplanana kadar pasif) + isteğe bağlı Gemini anahtarı | [docs/screens/1-giris.png](screens/1-giris.png) |
| 2. Sahne | Karar etiketi (+ Odak rozeti) → durum metni → A/B düğmeleri → (deneyimliyse) sayaç → Tutor kartı (ipucu, metin alanı, yanıtlar) | [docs/screens/2-sahne.png](screens/2-sahne.png) |
| 2b. Sonuç | "Seçimin" → **Ne oldu?** kartı → **Neden oldu?** kartı → saat → Devam | (Cypress demo videosunda) |
| 3. Son | SON A/B etiketi → saat + manşet → 3 kararın özeti → tek cümlelik ders → Yeniden oyna | [docs/screens/3-son.png](screens/3-son.png) |

Görüntüler `cypress/e2e/screens.cy.js` koşusundan alınmış gerçek ekran görüntüleridir. Tasarım aracı çıktısı değildir.

## Tokenlar

| Token | Açık | Koyu | Kullanım |
|---|---|---|---|
| `--bg` | #f6f5f1 | #12161b | sayfa |
| `--card` | #ffffff | #1b2128 | kart, düğme |
| `--ink` | #1d232b | #e8ebee | metin |
| `--muted` | #5d6673 | #9aa4af | ikincil metin |
| `--line` | #dcd9d0 | #2c343d | kenarlık |
| `--accent` | #0b6e69 | #4fb3ab | birincil eylem, etiket, "Ne oldu" çizgisi |
| `--good` | #23764a | #6cc48f | Son A |
| `--warn` | #b4441c | #f08a62 | sayaç, Son B |
| `--tutor` | #eef4f3 | #18272a | tutor kartı zemini |

- **Tipografi:** sistem yazı tipi. 16 px gövde, 24 px başlık, 12 px büyük harfli üst etiket (eyebrow).
- **Ölçüler:** 16 px kenar boşluğu, kart yarıçapı 14 px, düğme yarıçapı 12 px. Dokunma hedefi en az 48 px (Google erişilebilirlik önerisi).
- **Tema:** `prefers-color-scheme` ile açık/koyu tema otomatik seçilir.
- **Erişilebilirlik:** `main` alanı `aria-live="polite"`. Seçenekler gerçek `<button>`, profil soruları gerçek `<fieldset>/<legend>` ve radyo düğmesidir.
