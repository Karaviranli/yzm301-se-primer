---
license: mit
library_name: onnx
tags:
- onnx
- sklearn
- tabular-classification
- education
- synthetic-data
pipeline_tag: tabular-classification
language:
- tr
---

# primer-riskli-secim v2.0.0 — model kartı

> ⚠️ **Yalnızca sentetik veriyle doğrulandı.** Bu sürümde 0 gerçek oturum var (hedef ≥ 15). Aşağıdaki metrikler, kuralını bizim yazdığımız bir üreticinin verisinde ölçüldü. Gerçek oyuncularda ne kadar iyi çalıştığı **bilinmiyor**.

Biçim Mitchell vd. (2019) "Model Cards for Model Reporting" önerisine dayanır.

## Amaç

[SE Primer](https://github.com/Karaviranli/yzm301-se-primer) oyununda her karar sahnesi açılırken şu soruya bir olasılık verir: **"Bu oyuncu birazdan riskli seçeneğe (B) mi gidecek?"**

`p ≥ 0.5` ise oyun "Dur ve düşün" müdahalesi yapar:

- Sokratik soruyu öne çıkarır.
- Deneyimli oyuncunun süre baskısını kaldırır.
- Sonuç ekranında açıklamayı derinleştirir.

Model oyuncuya hiçbir zaman doğru cevabı söylemez; yalnızca **yavaşlatır**.

## Girdi / çıktı sözleşmesi

Ayrıntı `config.json` dosyasında, şeması `config.schema.json` dosyasında.

- **Girdi:** `input`, float32 `[n, 5]`. Sıra: `seviye` (0–2), `karar_no` (1–3), `onceki_riskli` (0–2), `onceki_karar_suresi_sn` (K1'de 15), `tutor_mesaj_onceki`.
- **Çıktı:** `probabilities`, float32 `[n, 2]`. Sütun 1 = P(riskli seçim).
- **Model:** `StandardScaler → LogisticRegression(class_weight="balanced", random_state=13)`, skl2onnx ile opset 17'ye aktarıldı. ONNX ile sklearn arasındaki maksimum fark 8.9e-08.

## Veri

`data/oturumlar.csv`: 1000 sentetik oturum, 3000 karar satırı, SHA-256 değeri `config.json → veri.sha256` alanında.

Üretici kural (`scripts/sentetik_uret.py`, tohum 13) şöyle işler:

- Her oturuma gizli bir "acelecilik" eğilimi `u ~ N(0,1)` atanır.
- Aceleci oyuncu daha hızlı karar verir ve tutoru daha az kullanır.
- `P(B) = sigmoid(-0.6 + 1.0u + 0.7·önceki_B - 0.35·önceki_tutor - 0.3·seviye)`.

Model `u`'yu görmez; yalnızca onun izlerini (süre, önceki B, tutor kullanımı) görür.

Gerçek veri toplama modu hazırdır (`?toplama=1`), ancak bu sürümde gerçek veri yoktur.

## Metrikler

Eşikler eğitimden önce `spec.md §8.3` içinde yazıldı. Test kümesi, oturum bazında ayrılmış %30'luk kısımdır: 300 oturum, 900 karar.

| Metrik | Değer | Kabul eşiği |
|---|---|---|
| ROC AUC | **0.7193** | ≥ 0.70 ✓ |
| Dengeli doğruluk (p ≥ 0.5) | **0.6550** | ≥ 0.60 ✓ |
| Doğruluk | 0.6378 | — |
| Brier skoru | 0.2107 | — |
| ONNX–sklearn maks fark | 8.9e-08 | ≤ 1e-4 ✓ |

### Eğitim günlüğü (başarısız denemeler dahil)

| # | Değişiklik | Test AUC | Dengeli doğr. | Kapı |
|---|---|---|---|---|
| 1 | 300 oturum, `LogisticRegression` | 0.6661 | 0.5861 | ✗ reddedildi |
| 2 | Yalnızca eğitim kümesinde 5 katlı grup CV ile model seçimi → `class_weight="balanced"` (CV: AUC 0.711, dengeli doğr. 0.646) | 0.6663 | 0.6056 | ✗ reddedildi (AUC) |
| 3 | Aynı kural ve tohumla 1000 oturum. Gerekçe: 90 oturumluk test kümesinde AUC'nin standart hatası ≈ 0.035, kapı için fazla gürültülü. **Bu karar 2. başarısızlıktan sonra verildi.** | 0.7193 | 0.6550 | ✓ geçti |

Eşikler hiç değiştirilmedi. Ancak 3. denemenin test kümesinden geçtiği, ilk iki başarısızlık görüldükten sonra yapılmış bir veri büyütme kararına dayanıyor. Bu yüzden 0.72'lik AUC iyimser bir tahmin olarak okunmalıdır.

## Sınırlar

- **Sentetik veri:** Model, kendi yazdığımız kuralı geri öğreniyor. Gerçek oyuncunun aceleciliği süreye, B seçimine ve tutora bu biçimde yansımayabilir.
- **Kalibrasyon:** `class_weight="balanced"` olasılıkları yukarı kaydırır, dolayısıyla `p` kalibre bir olasılık değildir. Yalnızca 0.5 eşiğiyle karar vermek için kullanılmalıdır.
- **K1:** Geçmiş olmadığı için K1'de yalnızca seviye belirleyicidir. Yeni başlayanda p ≈ 0.54, orta seviyede ≈ 0.51, deneyimlide ≈ 0.48 çıkar; bu yüzden ilk iki seviyede K1'de neredeyse herkese müdahale edilir.
- **Süre özelliği:** Süre, oyuncunun dikkati dağıldığında (sekme değiştirme gibi) da uzar. Bu durum yanlışlıkla "düşünceli" sayılabilir.
- **Kapsam:** Yalnızca bu oyunun 3 kararı ve bu 5 özellik için geçerlidir.

## Kullanılmaması gereken durumlar

- Gerçek bir öğrenciyi notlandırmak, sıralamak ya da "aceleci/özensiz" diye etiketlemek.
- Oyun dışındaki herhangi bir karar: işe alım, sınav, sağlık, gerçek nöbet süreçleri.
- Oyuncuya cevabı göstermek ya da gizlemek. Model doğru cevabı bilmez, yalnızca davranışı tahmin eder.
- Gerçek veriyle yeniden eğitilip kapıdan geçmeden, sentetik metrikleri gerçek performans gibi sunmak.

## Etik ve KVKK

- Eğitim verisinde kişisel veri yoktur.
- Uygulama yalnızca 5 sayısal özelliği tarayıcıda hesaplar. Model tarayıcıda çalıştığı için veri cihazdan çıkmaz.
- Veri toplama modu açık onayla çalışır, satırlar sunucuya gönderilmez.

## Yeniden üretme

```bash
python scripts/sentetik_uret.py && python train.py && python tests/parite.py
```

Aynı ortamda (Python 3.14, scikit-learn 1.8.0, skl2onnx 1.20.0, onnx 1.23.2) `model.onnx` bayt bayt aynı üretilir.
