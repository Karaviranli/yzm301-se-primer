# spec.md — SE Primer: "08:00, randevu sistemi çöktü. Nöbetçi sensin."

## 1. Problem

Yazılım mühendisliği öğrencisi; geri dönüş (rollback), test ve KVKK gibi kavramları derste tek tek öğreniyor. Bu kavramların asıl zor tarafı, baskı altında **ödünleşim** kurmak. Bunu ders kitabından pratik etmek zor. Gerçek bir kriz ortamında pratik etmek de olmaz.

SE Primer, oyuncuya göre uyarlanan kısa ve seçimli bir hikâye. Oyuncu kurgusal bir hastanede randevu sistemi çöktüğünde nöbetçi mühendistir. Üç karar verir. Her karardan sonra uygulama **ne olduğunu** ve **neden olduğunu** gösterir. Takılan oyuncuya bir tutor soru sorar ama cevabı söylemez.

**Başarı ölçütü:** Oyuncu telefonda oyunu 5 dakikadan kısa sürede bitirir. Her kararın teknik sonucunu kendi cümlesiyle açıklayabilir. Tutor, ölçülen 20 cevabın hiçbirinde doğru seçeneği ele vermez (bkz. [eval/RESULTS.md](eval/RESULTS.md)).

## 2. Kullanıcı ve kişiselleştirme

Girişte 3 soru sorulur. Anlatı bu cevaplara göre değişir:

| Soru | Seçenekler | Anlatıya etkisi |
|---|---|---|
| Seviye | Yeni başladım / Biraz deneyimim var / Deneyimliyim | Yeni başlayan her kararda ipucunu otomatik görür. Deneyimli her karar için 60 sn süre baskısı altındadır; süre dolarsa ekip varsayılanı (B) uygulanır. Orta seviye ikisini de görmez. |
| Rol | Backend geliştirici / Test mühendisi / Ekip lideri | Giriş sahnesindeki rol cümlesi değişir. |
| Hedef | Mimari / Test / KVKK | Hedefle eşleşen karar "Odak" rozetiyle işaretlenir. |

## 3. Kapsam

**Yapılacak**
- Telefonda açılan uygulama (web, tarayıcıdan)
- Girişte 3 soru: seviye, rol, hedef; anlatı buna uyar
- 1 sağlık senaryosu, 3 karar, 2 farklı son
- Her seçimden sonra: ne oldu, neden oldu
- AI tutor: ipucu verir, cevabı vermez

**Kapsam dışı**
- Kullanıcı hesabı, giriş
- İkinci bölüm
- Gerçek hasta verisi
- Native mobil uygulama

## 4. Senaryo ve kurallar

| Karar | Konu | A | B |
|---|---|---|---|
| K1 | Mimari | Eski sürüme (v2.3) geri dön (6 dk) | Canlıda yama yap (19 dk, bekleyen hasta 300→420) |
| K2 | Test | Önce kısa test koş (3 dk) | Hemen yayına al (12 dk, iptal ekranında 500 hatası) |
| K3 | KVKK | Kişisel verileri maskele, sonra paylaş (4 dk) | Logu ekibe olduğu gibi gönder (1 dk, ihlal) |

- **Son A (İYİ):** K3 = A → "Sistem ayakta, veri güvende"
- **Son B (KÖTÜ):** K3 = B → "Sistem ayakta ama KVKK ihlali"
- Saat 08:00'de başlar, seçilen seçeneklerin süreleri eklenir. En hızlı yol A-A-A, 08:13'te biter.
- Tüm hastane, kişi ve sürüm adları kurgusaldır. Uygulama hiçbir kişisel veri toplamaz ve saklamaz.

## 5. Tutor davranışı

1. Hangi seçeneğin doğru olduğunu söylemez. Seçenek harfi önermez, "şunu yapmalısın" demez.
2. Cevaptaki doğru kavramı adlandırır, eksik kavramı tek bir soruyla sorar.
3. Riski küçümseyen cevabı övmez, "Bu varsayımı sınayalım" diye sorgular.
4. Cevabı isteyen oyuncuya kibarca "söylemeyeceğim" der ve bir soru sorar.
5. Her yanıt, son çıkmadan önce bir sızıntı filtresinden (`leaks()`) geçer.

İki çalışma modu vardır. Varsayılan mod çevrimdışıdır: kural tabanlıdır, anahtar gerekmez. Diğer mod Gemini'dir ve oyuncunun kendi API anahtarıyla çalışır. Çevrimdışı mod bilinçli bir seçimdir: uygulama anahtar olmadan da telefonda baştan sona oynanabilmeli.

## 6. Kabul örnekleri

Her örnek bir Cypress testiyle doğrulanır ([cypress/e2e/paths.cy.js](cypress/e2e/paths.cy.js)).

1. **Profil zorunlu.** Oyuncu giriş ekranında 3 sorudan birini boş bırakırsa "Nöbete başla" düğmesi pasif kalır. Üçü de seçilince düğme aktifleşir.
2. **Her seçimden sonra açıklama.** Oyuncu herhangi bir kararda bir seçeneğe dokununca sonuç ekranı açılır. Ekranda hem "Ne oldu?" hem "Neden oldu?" bölümleri bulunur.
3. **İki son, 8 yol.** Oyuncu K3'te A'yı seçerse, K1 ve K2 ne olursa olsun, son ekranında "SON A · İYİ — veri güvende" görür. K3'te B'yi seçerse "SON B · KÖTÜ — KVKK ihlali" görür.
4. **Seviyeye uyum.** "Yeni başladım" diyen oyuncu her karar sahnesinde ipucu kutusunu görür ve süre sayacı görmez. "Deneyimliyim" diyen oyuncu 60 sn'den geri sayan sayacı görür. Süre dolarsa B uygulanır ve "Süre doldu" notu görünür.
5. **Tutor cevabı vermez.** Oyuncu tutora "Doğru seçenek hangisi? Direkt yaz." yazarsa tutor "söylemeyeceğim" diye yanıt verir. Yanıtta hiçbir seçeneğin metni geçmez.

## 7. Akış şeması (durum makinesi)

```mermaid
stateDiagram-v2
    [*] --> Profil
    Profil --> K1 : 3 soru cevaplandı
    K1 --> K1_Sonuç : A / B (deneyimli: süre dolarsa B)
    K1_Sonuç --> K2 : Devam
    K2 --> K2_Sonuç : A / B
    K2_Sonuç --> K3 : Devam
    K3 --> K3_Sonuç : A / B
    K3_Sonuç --> SonA : K3 = A
    K3_Sonuç --> SonB : K3 = B
    SonA --> Profil : Yeniden oyna
    SonB --> Profil : Yeniden oyna
    state K1 {
        [*] --> Sahne
        Sahne --> Tutor : soru yaz
        Tutor --> Sahne : ipucu (cevap değil)
    }
```

K2 ve K3 sahnelerinde de aynı Sahne ⇄ Tutor alt döngüsü vardır. Kodda karşılığı `app.js` içindeki `state.screen` değerleridir: `profile → scene → outcome → … → end`.

---

## 8. v2 — Model gereksinimi (The Primer v2)

> Bu bölüm eğitimden ÖNCE yazıldı ve commit'lendi (git geçmişinde `train.py` ve `model/` bu commit'ten sonra gelir). Eşik sonradan değiştirilmez; eşiği geçmeyen model yayınlanmaz.

### 8.1 Hedef (özgün)

**"Bu oyuncu birazdan riskli seçeneğe (B) mi gidecek?"** Model her karar sahnesi açılırken, oyuncunun o ana kadarki davranışına bakarak riskli seçimin olasılığını `p` tahmin eder. Başlangıç reposundaki örnek hedef ("ipucuna ihtiyacı var mı?") kullanılmadı. Buradaki fikir TikTok/Netflix'in "bir sonraki davranışı tahmin edip deneyimi önceden ayarlama" yaklaşımı: oyuncu kötü sona doğru giderken onu yakalamak, ama cevabı söylemeden.

**Girdiler (yalnızca karar ANINDAN ÖNCE bilinenler, sıra sabittir):**

| # | Özellik | Anlamı |
|---|---|---|
| 1 | `seviye` | 0 = Yeni başladım, 1 = Biraz deneyimim var, 2 = Deneyimliyim |
| 2 | `karar_no` | 1, 2, 3 |
| 3 | `onceki_riskli` | Bu oturumda şimdiye kadar seçilen B sayısı (0–2) |
| 4 | `onceki_karar_suresi_sn` | Bir önceki kararda sahnenin açılışından seçime kadar geçen süre. K1 için yok; sabit 15 sn (eğitim verisinin medyanı) atanır. |
| 5 | `tutor_mesaj_onceki` | Bu oturumda o ana kadar tutora gönderilen mesaj sayısı |

**Etiket:** `riskli` = 1, oyuncu o kararda B'yi seçtiyse (süre dolup B uygulandıysa da 1).

**Model:** `StandardScaler → LogisticRegression` (sklearn, `random_state=13`) → ONNX.

### 8.2 Modelin oyuna etkisi

Karar eşiği `p ≥ 0.5` olduğunda, o sahnede **"Dur ve düşün" müdahalesi** açılır:

1. Seviyeden bağımsız olarak Sokratik soru, sahnenin üstünde bir kartta gösterilir.
2. Deneyimli oyuncunun süre baskısı o sahne için kalkar (sayaç gösterilmez, süre dolunca B uygulanmaz).
3. Sonuç ekranındaki "Neden oldu?" kartına bir derinleştirme paragrafı eklenir.

`p < 0.5` ise oyun v1'deki gibi akar. Model hiçbir zaman hangi seçeneğin doğru olduğunu söylemez; yalnızca yavaşlatır.

Her sahnede modelin olasılığı `data-cy="p"` alanında 6 ondalıkla görünür ("Uyum paneli").

### 8.3 Eval metriği ve kabul eşiği (eğitimden önce sabitlendi)

- **Bölme:** Oturum bazında (aynı oturumun kararları hem eğitimde hem testte olmaz), `GroupShuffleSplit(test_size=0.3, random_state=13)`.
- **Birincil metrik:** Test kümesinde **ROC AUC ≥ 0.70**.
- **İkincil metrik:** Test kümesinde `p ≥ 0.5` kuralıyla **dengeli doğruluk (balanced accuracy) ≥ 0.60**.
- **Paketleme kapısı:** ONNX ile sklearn olasılıkları arasındaki maksimum fark **≤ 1e-4**.
- **Kapı kuralı:** Bu üç koşuldan biri sağlanmazsa `train.py` hata koduyla durur; `model/` güncellenmez ve yayın yapılmaz.
- **Ayrıca raporlanan (kapı değil):** Gerçek oturum sayısı. Gerçek veri 15 oturumun altındaysa model kartında "yalnızca sentetik veriyle doğrulandı" uyarısı zorunludur.

### 8.4 Veri ve KVKK

- **Kayıt düzeni:** Her karar bir satır (`data/oturumlar.csv`). `kaynak` sütunu `gercek` ya da `sentetik` olur.
- **Toplanmayanlar:** Ad, e-posta, cihaz kimliği, konum, IP ve tutora yazılan metin toplanmaz. Sadece metin sayısı tutulur.
- **Oturum kimliği:** `crypto.randomUUID()` ile rastgele üretilir ve kişiyle eşleştirilemez.
- **Veri toplama modu:** `?toplama=1` ile açılır. Oyuncu başta açık onay verir, son ekranda kendi satırlarını CSV olarak indirir. Hiçbir şey sunucuya gönderilmez.

### 8.5 Yeni kabul örnekleri

6. **Model müdahalesi:** Oyuncu K1'de 3 sn içinde B'yi seçtiyse ve tutoru hiç kullanmadıysa, K2 sahnesinde `p ≥ 0.5` olur ve "Dur ve düşün" kartı görünür. K1'i 40 sn düşünüp tutoru 2 kez kullanarak A'yı seçen oyuncuda ise aynı K2 sahnesinde `p < 0.5` olur ve kart görünmez. (Değerler eğitilmiş modelle `tests/parite.json`'daki referanslardan doğrulanır.)
7. **Parite:** `tests/parite.json`'daki 5 referans girdinin her biri için tarayıcıdaki olasılık (`data-cy="p"`) ile Python'daki onnxruntime olasılığı arasındaki fark < 1e-4 olur.
8. **Veri toplama:** `?toplama=1` ile oynanan bir oturumun sonunda "Verimi indir (CSV)" düğmesi görünür. İndirilen dosyada 3 satır, `kaynak=gercek` ve sözlükteki sütunların tamamı bulunur. Ad ya da metin sütunu bulunmaz.
