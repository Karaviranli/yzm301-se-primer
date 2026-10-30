# RELEASE — primer-riskli-secim v2.0.0

## Yayın kaydı

| Alan | Değer |
|---|---|
| Model reposu | https://huggingface.co/<HF_REPO> |
| Commit | `<HF_COMMIT>` |
| Commit'e sabit model URL'si | https://huggingface.co/<HF_REPO>/resolve/<HF_COMMIT>/model.onnx |
| Uygulama | https://karaviranli.github.io/yzm301-se-primer/ |
| Veri özeti (SHA-256) | `model/config.json → veri.sha256` |

> ⚠️ **Durum:** `<HF_REPO>` ve `<HF_COMMIT>` alanları henüz boş. Yayın için öğrencinin Hugging Face hesabıyla bir kez giriş yapması gerekiyor. Ardından `python scripts/hf_yayinla.py` komutu bu alanları ve `model/kaynak.json` dosyasını otomatik doldurur. Yayın yapılana kadar uygulama modeli GitHub Pages'teki kopyadan (`model/model.onnx`) yükler. Bu kopya, yayınlanacak dosyayla bayt bayt aynıdır.

## v2.0'da ne değişti

- **v1 (geçen hafta):** Uyum yalnızca girişteki 3 cevaba dayanan sabit kurallardı (seviye → ipucu/süre).
- **v2.0:** Her karar sahnesinde 5 davranış özelliğinden "riskli seçime gidecek mi?" olasılığı `p` hesaplanır. `p ≥ 0.5` ise:
  - "Dur ve düşün" kartı açılır,
  - deneyimli oyuncunun süre baskısı kalkar,
  - sonuç ekranındaki açıklama derinleşir.

  Model tarayıcıda onnxruntime-web ile çalışır.
- **Yeni artefaktlar:**
  - `model/model.onnx`,
  - `config.json` (sözleşme) ve `config.schema.json`,
  - model kartı.
- **Yeni testler:**
  - parite (tarayıcı ↔ Python ↔ sunucu),
  - müdahale kabul örnekleri,
  - yayılım anahtarı.

  v1'in 17 E2E testi değişmeden geçer.
- **Kapı:** `train.py` eşiğin altındaki modeli yazmaz. İlk iki eğitim denemesi bu kapıda reddedildi (model kartındaki eğitim günlüğü).

## Rollback

Uygulama hangi modeli kullanacağını `model/kaynak.json → url` alanından okur. Her sürüm Hub'da kendi commit'ine sabitlendiği için geri almak tek satırlık bir iştir:

1. `model/kaynak.json` içindeki `url`'yi önceki commit'in `.../resolve/<eski-commit>/model.onnx` adresiyle değiştir.
2. `git commit -am "rollback: model <eski-commit>" && git push`. GitHub Pages yaklaşık 1 dakikada yayınlar.

Model tümüyle devre dışı bırakılacaksa `"yayilim": {"mod": "golge"}` yazılır. Bu durumda p ölçülmeye devam eder ama oyun v1 gibi akar. Model hiç yüklenemezse uygulama zaten v1 kurallarına düşer (panelde "model yüklenemedi" yazar).

**Neden `main` değil commit:** `resolve/main` hareketli bir hedeftir. Hub'a yeni bir model yüklendiği anda, uygulama hiçbir değişiklik yapılmadan başka bir modelle çalışmaya başlar. Commit'e sabit URL ise Shankar vd. (2022)'nin "Versioning" ilkesini sağlar: her kullanıcının hangi modeli gördüğü git geçmişinden okunabilir.

## Shadow → Canary → Progressive (bu senaryoda)

Anahtar `model/kaynak.json → yayilim` alanıdır. Statik bir sitede uzaktan yapılandırma görevini görür. Kanarya grubu `oturum_id`'nin özetinden (FNV-1a hash) kararlı biçimde seçilir: aynı oturum hep aynı grupta kalır. Davranış `cypress/e2e/model.cy.js` içinde test edilir.

| Aşama | `yayilim` | Oyuncu ne görür | Neye bakılır | İlerleme koşulu |
|---|---|---|---|---|
| **Shadow** | `{"mod": "golge"}` | v1 ile aynı oyun. Model p'yi hesaplar ama müdahale etmez. | Veri toplama modundaki oturumlarda p ile gerçek seçimin (B) karşılaştırması: gerçek veride AUC | ≥ 15 gerçek oturumda AUC ≥ 0.70 (spec §8.3) |
| **Canary %5** | `{"mod": "kanarya", "oran": 0.05}` | Oturumların %5'inde müdahale | Müdahale alan oturumlarda Son B (KVKK ihlali) oranı düşüyor mu, oyun süresi makul mü (< 6 dk) | Son B oranı kontrol grubundan kötü değil, şikâyet yok |
| **Progressive** | `oran` 0.25 → 0.50 → 1.0 ve sonunda `{"mod": "tam"}` | Giderek daha çok oyuncu | Aynı ölçütler, her adımda en az birkaç gün | Herhangi bir adımda ölçüt kötüleşirse → rollback |

**Dürüst not:** Bu teslimde doğrudan `tam` modundayız; yani Shadow ve Canary aşamaları **uygulanmadı**. Gerçek oyuncu verisi yokken Shadow'da ölçülecek bir şey de olmazdı. Anahtar ve testleri hazır. Gerçek bir ürün kararı olsaydı ilk yayın `golge` modunda yapılırdı.

## Mimari dağıtım kararı ve ödünleşim matrisi

**Karar: tarayıcıda onnxruntime-web (GitHub Pages).** İkinci ve üçüncü tüketiciler parite kahini olarak tutulur: Python onnxruntime (`tests/parite.py`) ve FastAPI sunucusu (`server/`, bonus).

| Soru | Tarayıcı · onnxruntime-web (seçilen) | Cihaz içi · Expo + onnxruntime-react-native | Sunucu · Render (FastAPI/Rails) |
|---|---|---|---|
| **Ağ zorunlu mu, gecikme?** | Model ve wasm ilk açılışta indirilir: model 532 bayt, wasm yaklaşık 11 MB (CDN). Sonrasında her tahmin yerel, milisaniyenin altında. Çevrimdışı oyun için service worker gerekir (yok). | Model uygulamayla paketlenir; ağ gerekmez, gecikme en düşük. | Her karar sahnesinde bir istek gider; ağ zorunlu. Render'ın ücretsiz planı boşta kalınca uyur; ilk istek 30–60 sn sürebilir. Bu, 60 sn'lik süre baskılı bir oyunda kabul edilemez. |
| **Veri cihazdan çıkar mı (KVKK)?** | Hayır. 5 özellik tarayıcıda hesaplanır ve orada kalır. | Hayır. | Evet: her istekte davranış özellikleri sunucuya gider. Kişisel veri değil ama oturum boyunca birleştirilebilir bir iz oluşur. Aydınlatma metni ve saklama politikası gerekir. |
| **Model gizli kalır mı (REA riski)?** | Hayır. `model.onnx` herkese açık indirilir; tersine mühendislik (REA) basit, katsayılar okunabilir. Bu senaryoda kabul edilebilir: model gizli bir sınav anahtarı değil ve kart da zaten herkese açık. Asıl risk, oyuncunun eşiği öğrenip "yavaş tıklayarak" müdahaleden kaçmasıdır; bunun zararı düşük. | Uygulama paketinden çıkarılabilir, yine açık sayılır. | Evet, model sunucuda kalır. Ancak API'ye çok sayıda sorgu atılarak model yine yaklaşık olarak çıkarılabilir; oran sınırlama gerekir. |
| **Maliyet / işletim** | Sıfır (statik site). | Sıfır, ama mağaza/derleme süreci ağır. | Ücretsiz plan var ama uyku, kota ve izleme sorunları var. |

**Ödünleşim:** Gizlilik (KVKK) ve gecikme bu oyunda belirleyici; model gizliliği ise değil. Bu yüzden tarayıcı seçildi. Model bir gün sınav notlandırması gibi yüksek riskli bir işe bağlanırsa REA riski öne çıkar ve sunucu seçeneği yeniden değerlendirilmelidir (bkz. model kartı, "Kullanılmaması gereken durumlar").

## Kaynaklar

- Amershi, S. vd. (2019). *Software Engineering for Machine Learning: A Case Study.* ICSE-SEIP. ML yaşam döngüsünün 9 aşaması; burada veri toplama → eğitim → değerlendirme → dağıtım → izleme döngüsü.
- Shankar, S. vd. (2022). *Operationalizing Machine Learning: An Interview Study.* arXiv:2209.09125. 3V: Velocity, Validation, Versioning. Validation burada eğitim kapısı ve parite, Versioning commit'e sabit URL ve veri SHA-256'sı.
- Breck, E. vd. (2017). *The ML Test Score.* IEEE Big Data. Model/altyapı testleri; parite ve "eğitim–sunum çarpıklığı" (training–serving skew) kontrolü.
- Mitchell, M. vd. (2019). *Model Cards for Model Reporting.* FAT\*. `model/README.md` bu biçime dayanır.
- Hugging Face Hub belgeleri: revision ve `resolve/<revision>` URL'leri, `HfApi.upload_folder` (dönen `CommitInfo.oid`).
- ONNX Runtime Web belgeleri; skl2onnx (`zipmap=False` ile düz olasılık tensörü).
- Başlangıç reposu: github.com/seyyah/huggingface-hello-web. `onnx_aktar` eşdeğerlik kontrolü ve config/kart yapısı buradan uyarlandı; hedef ve veri özgündür.
