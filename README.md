# SE Primer — "08:00, randevu sistemi çöktü. Nöbetçi sensin."

YZM301 · SE Primer ödevi · Öğrenci no 241478067 (bireysel)

Kurgusal bir hastanenin randevu sistemi çöküyor ve oyuncu nöbetçi mühendis. Oyuncu üç mühendislik kararı verir: mimari, test, KVKK. Uygulama her kararın teknik sonucunu ve nedenini gösterir. Tutor ipucu verir, cevabı vermez.

## Teslim linkleri

| | Link |
|---|---|
| GitHub repo | https://github.com/Karaviranli/yzm301-se-primer |
| AI Studio uygulaması (ana teslim) | https://ai.studio/apps/c1adc121-6106-40cd-9667-4cdcf1d91236 — herkese açık link; açmak için Google hesabıyla giriş gerekebilir |
| Yedek: GitHub Pages sürümü | https://karaviranli.github.io/yzm301-se-primer/ — giriş gerektirmez, Cypress testleri bu sürümde koşar |
| 60 sn demo video | [demo/demo-60sn.mp4](demo/demo-60sn.mp4) — Cypress koşusunun kendi kaydı (GitHub Pages sürümü) |

## Akış: Stitch → AI Studio → Eval → Cypress

1. **Spec:** [spec.md](spec.md)
2. **Stitch:** Spec'ten yazılan istemle 3 mobil ekran üretildi: [docs/stitch/](docs/stitch/). Stitch'in tasarım sistemi kök dizindeki [DESIGN.md](DESIGN.md) dosyasında.
3. **AI Studio:** Stitch ekranları "Build with AI Studio" ile aktarıldı ve spec metni istem olarak verildi. Ortaya çıkan uygulama iki düzeltme isteğiyle spec'e uyduruldu (ayrıntı aşağıda).
4. **Eval:** 20 cevap hem çevrimdışı tutora hem AI Studio'daki Gemini tutora verildi, ikisi de iterasyonla iyileştirildi: [eval/RESULTS.md](eval/RESULTS.md).
5. **Cypress:** GitHub Pages sürümünde 8 yolun hepsi E2E test edildi, 60 sn demo videosu kaydedildi.

## Puanlama tablosuna göre durum

| Teslim (puan) | Kanıt | Durum |
|---|---|---|
| spec.md (20) | [spec.md](spec.md): problem, kapsam dışı, 5 kabul örneği, mermaid durum makinesi | Tamam |
| Tasarım (15) | [docs/stitch/](docs/stitch/): 3 Stitch ekranı (PNG + HTML) ve Stitch'in [DESIGN.md](DESIGN.md) dosyası | Tamam |
| Çalışan uygulama (20) | AI Studio linki. Elle doğrulandı: iki son da oynandı (A-A-A → Son A 08:13; A-A-B → Son B 08:10), "Ne oldu?/Neden oldu?" ekranları, deneyimli modda 60 sn sayaç (süre dolunca B uygulandı), KVKK hedefinde Odak rozeti | Tamam, notlarla (aşağıda) |
| Tutor eval (25) | [eval/RESULTS.md](eval/RESULTS.md): 20 cevap, hata türleri, oran + örnek sayısı. Çevrimdışı tutor 3 koşu, Gemini tutor 2 koşu | Tamam |
| Cypress demo (10) | [cypress/e2e/paths.cy.js](cypress/e2e/paths.cy.js): 8 yolun hepsi + kişiselleştirme + tutor, 17/17 geçti; [demo videosu](demo/demo-60sn.mp4) | Tamam, GitHub Pages sürümünde |
| Ürün kararı (10) | Aşağıda | Tamam |

## AI Studio sürümü: spec'e uydurma ve kalan farklar

AI Studio'nun ilk ürettiği sürümde iki spec ihlali bulundu ve düzeltme istendi:

1. **Kartlar seçimden önce sonucu gösteriyordu.** Karar kartlarında "Yüksek Riskli Hotfix", "+19 dk" ve "Teknik Etki" metinleri vardı; yeni başlayanlara gösterilen ipucu da cevabı açıklıyordu. Kaynağı Stitch'in DESIGN.md önerisiydi (bkz. [docs/stitch/README.md](docs/stitch/README.md)). Düzeltmeden sonra kartlarda yalnızca seçenek metni kaldı, ipucu da sadece Sokratik soruyu gösteriyor.
2. **Tutor gerçekte Gemini'yi kullanmıyordu.** Gemini çağrısı hata verince (503 ya da 4 sn zaman aşımı) hazır yanıtlar dönüyordu: "kahve makinesi" mesajına bile rollback sorusu geliyordu. Hazır yanıtlar kaldırıldı. Hata durumunda artık açıkça "[Bağlantı hatası – tutor yanıt veremedi]" yazıyor.

Kalan farklar:

- **Seviye sorusu:** İki seçenek var (Yeni başladım / Deneyimliyim); spec'teki "Biraz deneyimim var" seçeneği yok.
- **Ek özellikler:** AI Studio spec'te olmayan ses efektleri, log görüntüleyici ve hasta kuyruğu sayacı ekledi.
- **Cypress:** Testler AI Studio sürümünde değil, GitHub Pages sürümünde koşar. AI Studio sürümü yukarıdaki elle oynanışla doğrulandı.

## Ürün kararı: yapmadığım 3 özellik

1. **Puan / skor tablosu:** Puan, gerekçeyi anlamayı değil hızlı ve doğru tıklamayı ödüllendirir. Bu oyunun amacı "neden oldu?" sorusunu okutmak.
2. **Kararı geri alma (undo):** Nöbette verilen karar geri alınamaz. Sonuçla yüzleşmek dersin kendisidir; tekrar denemek isteyen oyuncu için "Yeniden oyna" düğmesi var.
3. **Oyuncu ilerlemesini ve tutor yazışmalarını sunucuda saklamak:** Oyuncunun tutora yazdığı metin kişisel veri içerebilir. KVKK'nın ölçülülük ilkesini öğreten bir uygulamanın amacı aşan veri toplaması kendi dersiyle çelişir.

## Nasıl çalıştırılır (GitHub Pages sürümü)

Gerekenler: Node 18+.

```bash
node serve.cjs 8080
```

Sunucu açılınca tarayıcıda http://localhost:8080 adresine gidin. Testleri ayrı bir terminalde, sunucu açıkken koşturun:

```bash
npm install
```

```bash
npx cypress run --browser electron
```

Çevrimdışı tutor eval'i:

```bash
node eval/run_eval.cjs v3
```

Tabloları üretmek için:

```bash
node eval/report.cjs offline
```

```bash
node eval/report.cjs gemini
```

Gemini tutor eval'i AI Studio uygulamasının sekmesinde, tarayıcı konsolunda [eval/gemini_browser_runner.js](eval/gemini_browser_runner.js) ile koşar. Ham çıktı `eval/raw/` klasörüne konur, sonra şu komutla aktarılır:

```bash
node eval/import_gemini.cjs gemini-v2
```

## Dosyalar

| Dosya | İçerik |
|---|---|
| `index.html`, `style.css`, `app.js` | GitHub Pages sürümü (durum makinesi: profile → scene → outcome → end) |
| `story.js` | Senaryo, seçenekler, "ne oldu / neden oldu" metinleri, son kuralı |
| `tutor.js` | Pages sürümünün tutoru: çevrimdışı kural tabanlı + isteğe bağlı Gemini, sızıntı filtresi |
| `DESIGN.md`, `docs/stitch/` | Stitch çıktıları |
| `docs/DESIGN-uygulama.md`, `docs/screens/` | Pages sürümünün tasarım notu ve gerçek ekran görüntüleri |
| `eval/` | 20 cevap, koşu çıktıları (`runs/`), ham Gemini çıktıları (`raw/`), etiketler, sonuç raporu |
| `cypress/e2e/` | `paths.cy.js` (tüm yollar), `demo.cy.js` (60 sn video), `screens.cy.js` (ekran görüntüleri) |

## Açık notlar (etik ve dürüstlük)

- **Veri:** Hastane, kişi ve sürüm adları kurgusaldır, gerçek hasta verisi yoktur. Eval'deki 20 öğrenci cevabı sentetiktir ve test amacıyla yazılmıştır.
- **Yapay zekâ kullanımı:**
  - Kod, spec taslağı ve eval ön etiketleri Claude Code (Anthropic) ajanıyla hazırlandı.
  - Stitch ve AI Studio adımlarını da aynı ajan, öğrencinin Google hesabıyla tarayıcıda yürüttü.
  - Öğrenci, teslimden önce `spec.md`, `eval/labels.json` ve ürün kararlarını okuyup onaylamalı. Sunumun ifadesiyle: spec, eval ve karar öğrencinin.
- **Yapılmayan:** "Bir arkadaşına oynat" önerisi gerçek bir kişi gerektirdiği için yapılmadı. Bunun yerine sahte bir oyuncu gözlemi konmadı.
- **Kaynaklar:** Sunumdaki kaynakça. Özellikle tutor davranışı için OpenAI "study mode" (2025), K3 için 6698 sayılı KVKK, akış için Sommerville (2016) Bölüm 5.
