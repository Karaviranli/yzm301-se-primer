# SE Primer — "08:00, randevu sistemi çöktü. Nöbetçi sensin."

YZM301 · SE Primer ödevi · Öğrenci no 241478067 (bireysel)

Kurgusal bir hastanenin randevu sistemi çöküyor ve oyuncu nöbetçi mühendis. Oyuncu üç mühendislik kararı verir: mimari, test, KVKK. Uygulama her kararın teknik sonucunu ve nedenini gösterir. Tutor ipucu verir, cevabı vermez.

## Teslim linkleri

| | Link |
|---|---|
| GitHub repo | https://github.com/Karaviranli/yzm301-se-primer |
| Çalışan uygulama (telefonda açılır) | https://karaviranli.github.io/yzm301-se-primer/ — GitHub Pages |
| AI Studio linki | **Henüz yok.** Google hesabıyla yapılması gerekiyor; adımlar [docs/STITCH_AI_STUDIO.md](docs/STITCH_AI_STUDIO.md) dosyasında |
| 60 sn demo video | [demo/demo-60sn.mp4](demo/demo-60sn.mp4) — Cypress koşusunun kendi kaydı |

## Puanlama tablosuna göre durum

| Teslim (puan) | Kanıt | Durum |
|---|---|---|
| spec.md (20) | [spec.md](spec.md): problem, kapsam dışı, 5 kabul örneği, mermaid durum makinesi | Tamam |
| Tasarım (15) | [DESIGN.md](DESIGN.md) + 3 ekranın gerçek görüntüsü ([docs/screens/](docs/screens/)) | **Kısmi:** Stitch ekranları üretilmedi; DESIGN.md elle yazıldı |
| Çalışan uygulama (20) | GitHub Pages linki; telefonda baştan sona oynanır | **Kısmi:** uygulama çalışıyor ama AI Studio'da değil |
| Tutor eval (25) | [eval/RESULTS.md](eval/RESULTS.md): 20 cevap, 3 hata türü, oran + örnek sayısı, 3 iterasyon | Tamam (çevrimdışı tutor). **Gemini modu ölçülmedi** |
| Cypress demo (10) | [cypress/e2e/paths.cy.js](cypress/e2e/paths.cy.js): 8 yolun hepsi + kişiselleştirme + tutor, 17/17 geçti; [demo videosu](demo/demo-60sn.mp4) | Tamam |
| Ürün kararı (10) | Aşağıda | Tamam |

## Ürün kararı: yapmadığım 3 özellik

1. **Puan / skor tablosu:** Puan, gerekçeyi anlamayı değil hızlı ve doğru tıklamayı ödüllendirir. Bu oyunun amacı "neden oldu?" sorusunu okutmak.
2. **Kararı geri alma (undo):** Nöbette verilen karar geri alınamaz. Sonuçla yüzleşmek dersin kendisidir; tekrar denemek isteyen oyuncu için "Yeniden oyna" düğmesi var.
3. **Oyuncu ilerlemesini ve tutor yazışmalarını sunucuda saklamak:** Oyuncunun tutora yazdığı metin kişisel veri içerebilir. KVKK'nın ölçülülük ilkesini öğreten bir uygulamanın amacı aşan veri toplaması kendi dersiyle çelişir.

## Nasıl çalıştırılır

Gerekenler: Node 18+.

```bash
node serve.cjs 8080
```

Sunucu açılınca tarayıcıda http://localhost:8080 adresine gidin.

Testler (ayrı terminalde, sunucu açıkken):

```bash
npm install
```

```bash
npx cypress run --browser electron
```

Tutor eval'ini koşturmak için:

```bash
node eval/run_eval.cjs v3
```

Sonra tabloları üretin:

```bash
node eval/report.cjs
```

## Dosyalar

| Dosya | İçerik |
|---|---|
| `index.html`, `style.css`, `app.js` | Mobil web uygulaması (durum makinesi: profile → scene → outcome → end) |
| `story.js` | Senaryo, seçenekler, "ne oldu / neden oldu" metinleri, son kuralı |
| `tutor.js` | Sokratik tutor: çevrimdışı kural tabanlı + isteğe bağlı Gemini, sızıntı filtresi |
| `eval/` | 20 cevap, koşu çıktıları (`runs/v1..v3.json`), etiketler, sonuç raporu |
| `cypress/e2e/` | `paths.cy.js` (tüm yollar), `demo.cy.js` (60 sn video), `screens.cy.js` (ekran görüntüleri) |

## Açık notlar (etik ve dürüstlük)

- **Veri:** Hastane, kişi ve sürüm adları kurgusaldır. Gerçek hasta verisi yoktur. Eval'deki 20 öğrenci cevabı sentetiktir ve test amacıyla yazılmıştır.
- **Yapay zekâ kullanımı:** Kod, spec taslağı ve eval ön etiketleri Claude Code (Anthropic) ajanıyla hazırlandı. Öğrenci, teslimden önce `spec.md`, `eval/labels.json` ve ürün kararlarını okuyup onaylamalı. Sunumun ifadesiyle: spec, eval ve karar öğrencinin.
- **Yapılmayanlar:**
  - Stitch ekranları ve AI Studio uygulaması: Google hesabı gerekiyor.
  - Gemini tutorunun ölçümü: API anahtarı yok.
  - "Bir arkadaşına oynat" önerisi: gerçek bir kişi gerekiyor.

  Bunların yerine sahte ekran görüntüsü, link ya da sonuç konmadı.
- **Kaynaklar:** Sunumdaki kaynakça. Özellikle tutor davranışı için OpenAI "study mode" (2025), K3 için 6698 sayılı KVKK, akış için Sommerville (2016) Bölüm 5.
