# SE Primer v2 — "08:00, randevu sistemi çöktü. Nöbetçi sensin."

YZM301 · The Primer v2 ödevi · Öğrenci no 241478067 (bireysel)

Geçen haftaki oyun girişteki 3 cevaba göre **sabit kurallarla** uyum sağlıyordu. v2'de uyumu, oyuncunun davranışından öğrenen küçük bir model yönetir. Model her karar sahnesi açılırken **"Bu oyuncu birazdan riskli seçeneğe (B) mi gidecek?"** sorusuna bir olasılık `p` verir.

`p ≥ 0.5` ise oyun "Dur ve düşün" der:

- Sokratik soruyu öne çıkarır.
- Deneyimli oyuncunun süre baskısını kaldırır.
- Sonuç ekranında açıklamayı derinleştirir.

Model cevabı asla söylemez; yalnızca yavaşlatır. Fikir, TikTok/Netflix'in "bir sonraki davranışı tahmin edip deneyimi önceden ayarlama" yaklaşımından geliyor. Ancak burada amaç etkileşimi artırmak değil, oyuncuyu kötü sona giderken yakalamak.

## Teslim formu için 4 link

| # | Link | Durum |
|---|---|---|
| 1 | GitHub repo: https://github.com/Karaviranli/yzm301-se-primer | ✓ |
| 2 | Hugging Face model (commit'li): `https://huggingface.co/<HF_REPO>/tree/<HF_COMMIT>` | ⚠ **Henüz yayınlanmadı.** Öğrencinin HF hesabı gerekiyor; komut aşağıda |
| 3 | Canlı uygulama: https://karaviranli.github.io/yzm301-se-primer/ | ✓ Giriş gerektirmez. Veri toplama modu: `?toplama=1` |
| 4 | Demo video (69 sn): https://github.com/Karaviranli/yzm301-se-primer/blob/main/demo/demo-v2.mp4 | ✓ Aynı K2 sahnesinde iki oyuncu, iki farklı model kararı |

## Puanlama tablosuna göre durum

| Kalem (puan) | Kanıt | Durum |
|---|---|---|
| Spec ve kabul örnekleri (10) | [spec.md §8](spec.md): hedef, 5 özellik, metrik, eşik, 3 yeni kabul örneği. Eşik commit'i (`ce73aa3`) `train.py`'den önce geliyor. | ✓ |
| Veri, sözlük, kaynak (10) | [data/oturumlar.csv](data/oturumlar.csv), [data/SOZLUK.md](data/SOZLUK.md), `kaynak` sütunu, veri toplama modu, [scripts/csv_ekle.py](scripts/csv_ekle.py) | ⚠ **0 gerçek oturum** (hedef ≥ 15). Yalnızca sentetik veri var; ödev kuralına göre bu kalemin yarısı alınır. |
| Tekrarlanabilir eğitim ve eval kapısı (15) | [train.py](train.py): tek komut, `random_state=13`, oturum bazında bölme. Metrikler `config.json`'a yazılır. Eşik ya da şema kapısı geçilmezse hata koduyla durur. Aynı veriyle `model.onnx` bayt bayt aynı çıkar. | ✓ İlk iki deneme kapıda reddedildi (model kartında) |
| Artefakt ve model kartı (10) | [model/model.onnx](model/model.onnx), [model/config.json](model/config.json) + [config.schema.json](model/config.schema.json), [model/README.md](model/README.md) | ✓ |
| Yayın (15) | [RELEASE.md](RELEASE.md): ödünleşim matrisi, Shadow/Canary/Progressive, rollback. Yayılım anahtarı kodda ve testli. [scripts/hf_yayinla.py](scripts/hf_yayinla.py) | ⚠ HF yayını ve commit'i bekliyor |
| Uygulamada çıkarım (15) | [model.js](model.js) (onnxruntime-web), [app.js](app.js). Model kararı sahneyi, süreyi ve açıklamayı değiştiriyor; `data-cy="p"` | ✓ |
| Parite + regresyon E2E (15) | [tests/parite.py](tests/parite.py), [tests/parite.json](tests/parite.json), [cypress/e2e/parite.cy.js](cypress/e2e/parite.cy.js), [model.cy.js](cypress/e2e/model.cy.js), v1'in [paths.cy.js](cypress/e2e/paths.cy.js) testi değişmeden. **26/26 geçti.** Tarayıcı ile Python farkı < 1e-4. | ✓ |
| Demo, README, sınav tasarımı (10) | [demo/demo-v2.mp4](demo/demo-v2.mp4), bu dosya, [SINAV_TASARIMI.md](SINAV_TASARIMI.md) | ✓ |
| Bonus (+10) | [server/app.py](server/app.py) (FastAPI + onnxruntime) ve [render.yaml](render.yaml). Yerelde aynı 5 referansta fark 0. | ⚠ Render'a dağıtılmadı (ücretsiz Render hesabı gerekiyor) |

## Kurulum (3 komut)

```bash
pip install -r requirements.txt && npm install
```

```bash
python train.py && python tests/parite.py
```

```bash
npm test
```

1. Bağımlılıkları kurar.
2. Modeli eğitir, kapıdan geçirir ve Python kahiniyle pariteyi doğrular.
3. Statik sunucuyu açar ve Cypress'i koşturur: v1 regresyonu + parite + model davranışı.

Sentetik veriyi baştan üretmek isterseniz önce `python scripts/sentetik_uret.py` çalıştırın.

## Sentetik veri: üretici kural ve tohum

Betik `scripts/sentetik_uret.py`, **tohum 13**, **1000 oturum** (3000 karar satırı) üretir:

- **Gizli eğilim:** Her oturuma gizli bir "acelecilik" eğilimi `u ~ N(0, 1)` atanır. CSV'ye yazılmaz.
- **Seviye:** `seviye` ∈ {0, 1, 2}, eşit olasılıkla.
- **Tutor mesajı:** Kararda tutora mesaj sayısı `m ~ Poisson(0.7 · e^(-0.5u) · (yeni başlayansa 1.4, değilse 1))`.
- **Karar süresi:** `t = e^(2.7 − 0.55u + N(0, 0.35)) + 6m` saniye, [1, 120] aralığına kırpılır.
- **B seçme olasılığı:** `P(B) = sigmoid(−0.6 + 1.0u + 0.7·önceki_B − 0.35·önceki_tutor − 0.3·seviye)`.
- **Süre dolması:** Deneyimli oyuncuda `t > 60` ise süre dolar ve B uygulanır.
- **K1:** Önceki karar süresi sabit 15 sn yazılır.

Bu kuralı biz yazdık. Model aslında bu kuralı geri öğreniyor; sentetik verideki AUC 0.72, gerçek oyuncular hakkında bir şey söylemez.

## Hâlâ eksik olanlar (dürüst durum)

1. **15 gerçek oturum yok.** Gerçek veriyi yalnızca gerçek insanlar üretebilir; uydurma "gercek" satırı yazılmadı.
   - Toplamak için: 3 arkadaşına `https://karaviranli.github.io/yzm301-se-primer/?toplama=1` linkini gönder ve her birinden 5 oturum iste. Her oturumun sonunda indirdikleri CSV'leri topla.
   - Sonra şunları çalıştır: `python scripts/csv_ekle.py indirilenler/*.csv && python train.py && python tests/parite.py && npm test`.
   - Model değişirse referanslar `python tests/parite.py --yaz` ile yenilenir.
2. **Hugging Face yayını yok.** Token gerektiriyor; ajan senin token'ını girmez.
   - Önce bir kez `hf auth login` (write yetkili token), sonra:
     ```bash
     python scripts/hf_yayinla.py
     ```
   - Betik public repoyu açar ve modeli yükler. Commit'e sabit URL'yi doğrular, `model/kaynak.json` ve `RELEASE.md` dosyalarını doldurur. Ardından `git commit -am "v2.0 HF yayını" && git push`.
3. **Render (bonus) dağıtılmadı.** render.com'da ücretsiz hesap aç, "New → Blueprint" ile bu repoyu seç (`render.yaml` hazır). Sonra `python tests/parite.py --url https://<servis>.onrender.com/tahmin` komutunu çalıştır.

## Mimari ve kaynaklar

Dağıtım kararı ve ödünleşim matrisi, Shadow → Canary → Progressive planı ve rollback [RELEASE.md](RELEASE.md) dosyasında. Kullanılan kaynaklar:

- Amershi vd. 2019 (SE4ML yaşam döngüsü), Shankar vd. 2022 (3V), Breck vd. 2017 (ML Test Score), Mitchell vd. 2019 (Model Cards).
- Sommerville 10. baskı, Bl. 8 (yazılım testi).
- Feathers (karakterizasyon testi, SINAV_TASARIMI.md).
- Hugging Face Hub, ONNX Runtime Web ve skl2onnx belgeleri.
- Başlangıç reposu [seyyah/huggingface-hello-web](https://github.com/seyyah/huggingface-hello-web): `onnx_aktar` eşdeğerlik kontrolü ve config/kart yapısı buradan uyarlandı. Hedef ("riskli seçime gidecek mi?"), özellikler ve veri özgündür.

## Araç beyanı

- **Claude Code (Anthropic, Opus 5.5):** Ödev metninden plan çıkardı; spec §8, `train.py`, sentetik üretici, `model.js`/`app.js` entegrasyonu, Cypress testleri, parite betiği, FastAPI sunucusu ve bu belgeleri yazdı. Demo videosunu Cypress koşusundan kaydetti.
- **Ajanın kendi düzelttikleri:** İlk eğitimde kapı modeli reddetti (AUC 0.666). Eşik değiştirilmedi. Model seçimi yalnızca eğitim kümesinde çapraz doğrulamayla yapıldı ve veri 300'den 1000 oturuma büyütüldü. Bu karar başarısızlıktan sonra verildiği için model kartında açıkça yazıyor. Demo süresi de 49 sn'den 69 sn'ye uzatıldı.
- **Elle doğrulanması gerekenler:** spec §8 eşikleri, model kartındaki "sınırlar" ve "kullanılmaması gereken durumlar" bölümleri ile SINAV_TASARIMI.md'nin değerlendirme anahtarı ajan taslağıdır. Öğrenci okuyup kendi gerekçesiyle onaylamalıdır.
- **Elle yapılması gerekenler:** Gerçek oturumların toplanması (insan gerekiyor), Hugging Face girişi ve Render hesabı (öğrencinin hesapları).

---

# v1 — SE Primer ödevi (geçen hafta)

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
