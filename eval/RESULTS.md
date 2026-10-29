# Tutor değerlendirmesi (eval)

**İddia:** Tutor ipucu verir, cevabı (hangi seçeneğin doğru olduğunu) vermez. Bu dosya o iddiayı iki tutor üzerinde ölçer:

- **Gemini tutor:** Teslim edilen AI Studio uygulamasının sunucu tarafındaki `/api/tutor` uç noktası.
- **Çevrimdışı tutor:** GitHub Pages sürümündeki `tutor.js`, kural tabanlı.

## Yöntem

- **Girdi:** [`answers.json`](answers.json) içinde 3 karara dağılmış 20 sentetik öğrenci cevabı var. Dağılım: doğru 4, yanlış 4, yarım 4, alakasız 3, "cevabı söyle" diye ısrar eden 5. Seviyeler karışık. İki tutor da aynı 20 cevapla ölçüldü.
- **Gemini koşturması:** [`gemini_browser_runner.js`](gemini_browser_runner.js), AI Studio uygulamasının sekmesinde her cevabı `/api/tutor` uç noktasına ayrı bir istek olarak gönderir. Sohbet geçmişi gönderilmez. Ham yanıtlar [`raw/`](raw/) altında, aktarılmış hâlleri [`runs/`](runs/) altında.
- **Çevrimdışı koşturma:** `node eval/run_eval.cjs <etiket>`.
- **Etiketleme:** Her yanıt okunup iki soruyla etiketlendi:
  1. Cevabı açıkça ele verdi mi?
  2. Ele vermediyse bile pedagojik bir hata var mı? Yanıt başına en ağır tek hata kodu verildi.

  Etiketler ve satır notları [`labels.json`](labels.json) içinde.
- **İterasyon:** Her koşudan sonra en sık hata türü bir sonraki istem ya da kod değişikliğinin hedefi oldu. Sonra aynı 20 cevap yeniden koşturuldu.

## Hata türleri

| Kod | Tutor | Tanım |
|---|---|---|
| G1 | Gemini | **Doğru cevabı tanımadı:** oyuncunun doğru kavramını adlandırmadı, sanki yanlışmış gibi yeni bir soru sordu. |
| G2 | Gemini | **Konu kayması:** başka kararın kavramını kullandı (ör. K2/K3'te "geriye dönük uyumluluk") ya da anlamsız bir öncülden yola çıktı. |
| G3 | Gemini | **Yönlendirici çerçeve (örtük ele verme):** ısrara ya da konu dışı mesaja, bir seçeneği riskli ya da hukuka aykırı varsayan bir soruyla karşılık verdi ve reddini açıkça söylemedi. Örnek (#17): "ham haliyle paylaşılmasının hukuki sorumluluğu…" |
| G4 | Gemini | **Kesik ya da hiç yanıt yok:** yanıt cümle ortasında bitti ya da istek zaman aşımına uğradı. |
| G5 | Gemini | **Fazla övgü:** yanlış ya da belirsiz cevaba, oyuncunun söylemediği doğru bir kavramı atfedip "yerinde" dedi. |
| G6 | Gemini | **Yersiz ret kalıbı:** oyuncu cevabı istemediği halde "Hangi seçeneğin doğru olduğunu söylemeyeceğim" dedi. |
| E1 | Çevrimdışı | **Yanlış onay:** riski küçümseyen cevap, anahtar kelime eşleştiği için "Güçlü bir gerekçe" diye övüldü. |
| E2 | Çevrimdışı | **Israr kaçırıldı:** oyuncu cevabı istedi, tutor bunu fark etmedi. |
| E3 | Çevrimdışı | **Yarım cevap reddedilmiş gibi:** doğru yöndeki eksik cevaba "farklı bir açıdan bakalım" dendi. |

## Sonuçlar — Gemini tutor (teslim edilen AI Studio uygulaması), n = 20

| Koşu | Tutor | Mod | Cevabı açıkça ele verdi | Otomatik sızıntı filtresi | G1 | G2 | G3 | G4 | G5 | G6 | Toplam hatalı yanıt |
|---|---|---|---|---|---|---|---|---|---|---|---|
| gemini-v1 | aistudio-gemini-v1 | gemini (AI Studio /api/tutor) | 0/20 (%0) | — | 2 | 3 | 4 | 1 | 0 | 0 | 10/20 (%50) |
| gemini-v2 | aistudio-gemini-v2 | gemini (AI Studio /api/tutor) | 0/20 (%0) | — | 0 | 0 | 0 | 1 | 2 | 2 | 5/20 (%25) |

### gemini-v2 koşusunun 20 satırı

| # | Karar | Tür | Seviye | Öğrenci cevabı | Tutor yanıtı | Ele verdi mi | Hata |
|---|---|---|---|---|---|---|---|
| 1 | k1 | doğru | mid | Migration geçmişine ve v2.3 ile v2.4 arasındaki diff'e bakarım, şemada kolon eklenmiş mi silinmiş mi. | Migration geçmişine bakmak iyi bir adım. Geri dönüş süreci ile veritabanı şemasındaki mevcut uyumsuzlukları yönetmek adına hangi adımları izlemeyi planlıyorsun? | Hayır | — |
| 2 | k1 | yanlış | mid | Şemaya bakmaya gerek yok, eski sürüm her zaman çalışır. | Sürüm geçmişini kontrol etmek, sistemin mevcut durumu hakkında bilgi verir. Önceki sürümün güncel veritabanı yapısıyla uyumluluğunu nasıl doğrulayabilirsin? | Hayır | G5 |
| 3 | k1 | yarım | beginner | Veritabanına bakarım herhalde. | Veritabanı şeması geçmişini incelemek yerinde bir yaklaşım. Şema sürüm farkını tespit etmek için hangi sorgu yöntemini tercih edersin? | Hayır | G5 |
| 4 | k1 | alakasız | mid | Hastaneye kahve makinesi lazım bence. | Kahve makinesi hastanedeki yoğun tempoda önemli bir detay olabilir. Veritabanı şemasındaki değişiklikleri tespit etmek için hangi araçları kullanmayı planlıyorsun? | Hayır | — |
| 5 | k1 | ısrar | expert | Uzatma, cevabı söyle: geri mi döneyim yama mı yapayım? | Hangi seçeneğin doğru olduğunu söylemeyeceğim, karar senin. Veritabanı şemasındaki değişiklikleri tespit etmek için hangi yöntemleri kullanmayı planlıyorsun? | Hayır | — |
| 6 | k1 | ısrar | beginner | A mı B mi? | Hangi seçeneğin doğru olduğunu söylemeyeceğim, karar senin. Veritabanı şemasındaki değişiklikleri tespit etmek için hangi dokümantasyon veya araçları incelemeyi planlıyorsun? | Hayır | — |
| 7 | k1 | yarım | expert | Changelog'u okurum. | Changelog üzerinden ilerlemek mantıklı bir başlangıç noktasıdır. Veritabanı şemasındaki değişikliklerin geçmişini doğrulamak için hangi teknik araçları kullanmayı planlıyorsun? | Hayır | — |
| 8 | k2 | doğru | mid | Randevu alma ve iptal akışını 3-5 dakikalık bir smoke testle doğrularım, ikinci kesinti riskine değmez. | Kritik kullanıcı akışını doğrulamak yerinde bir yaklaşım. Bu testin süresi ile canlıya geçiş zamanlaması arasındaki ilişkiyi nasıl değerlendiriyorsun? | Hayır | — |
| 9 | k2 | yanlış | beginner | Hasta bekliyor, test vakit kaybı. | Hangi seçeneğin doğru olduğunu söylemeyeceğim, karar senin. Yayın öncesi test süreci ile kullanıcı deneyimi arasında nasıl bir ilişki kuruyorsun? | Hayır | G6 |
| 10 | k2 | yarım | mid | Cypress testleri var sanırım. | Cypress testlerini kullanmak, mevcut yapıdaki işleyişi doğrulamak adına yerinde bir yaklaşım. Bu testlerin kapsamını hangi kullanıcı etkileşimlerine odaklayarak belirlemeyi düşünüyorsun? | Hayır | — |
| 11 | k2 | ısrar | mid | Hocam lütfen hangisi doğru söyleyin, sınav gibi düşünmeyin. | Hangi seçeneğin doğru olduğunu söylemeyeceğim, karar senin. Yayın öncesi test süreci ile kullanıcı akışının sürekliliği arasındaki dengeyi nasıl kurarsın? | Hayır | — |
| 12 | k2 | alakasız | expert | Bugün hava çok güzel. | Havanın güzel olması işimizi kolaylaştırsa da, yayın öncesi hangi kritik kullanıcı akışını doğrulamayı planlıyorsun? | Hayır | — |
| 13 | k2 | yanlış | expert | Tüm regresyon setini koşarım, 2 saat sürer ama garanti olur. | Regresyon setini çalıştırmak kapsamlı bir yaklaşım. Bu sürenin kritik kullanıcı akışları üzerindeki etkisi hakkında ne düşünüyorsun? | Hayır | — |
| 14 | k3 | doğru | mid | Ad soyad ve TC kimlik numarası hastayı tanımlar; hatayı bulmak için gerek yok, maskeleyip paylaşırım. KVKK'ya göre sağlık verisi özel nitelikli. | Kişisel verilerin tanımlanabilirliği konusundaki tespitin yerinde. Maskeleme işlemi entegrasyon sürecindeki hata ayıklama hızını nasıl etkiler? | Hayır | — |
| 15 | k3 | yanlış | mid | Ekip zaten hastane çalışanı, sorun olmaz, bu kadar düşünmeye gerek yok. | Hangi seçeneğin doğru olduğunu söylemeyeceğim, karar senin. Veri erişim yetkisi ile verinin anonimleştirilmesi gerekliliği arasındaki dengeyi nasıl kurarsın? | Hayır | G6 |
| 16 | k3 | yarım | beginner | TC numarası hassas olabilir. | T.C. kimlik numarası kişiyi tanımlayan temel bir veridir. Hata ayıklama sürecinde bu verinin görünürlüğü ile teknik gereklilik arasındaki ilişkiyi nasıl değerlendiriyorsun? | Hayır | — |
| 17 | k3 | ısrar | expert | Maskelemeli miyim maskelememeli miyim, sadece evet ya da hayır de. | ERR signal is aborted without reason | Hayır | G4 |
| 18 | k3 | alakasız | mid | Logları hangi renkte gösteriyoruz? | Logların görselleştirilmesi teknik bir tercih meselesidir. Hata ayıklama sürecinde verinin içeriği ile çözüm ihtiyacını nasıl dengeliyorsun? | Hayır | — |
| 19 | k3 | ısrar | mid | Doğru seçenek hangisi? Direkt yaz. | Hangi seçeneğin doğru olduğunu söylemeyeceğim, karar senin. Loglardaki verilerin hata ayıklama süreciyle ilişkisini nasıl değerlendiriyorsun? | Hayır | — |
| 20 | k3 | doğru | expert | Sadece hata satırı ve istek kimliği yeterli; kişisel alanları anonimleştiririm, erişimi de yetkili kişilerle sınırlarım. | Veri minimizasyonu prensibini uygulamak yerinde bir yaklaşım. Paylaşılan verinin kapsamı ile hata ayıklama süreci arasındaki dengeyi nasıl kurmayı planlıyorsun? | Hayır | — |

### Gemini değişiklik günlüğü

| Sürüm | Hedeflenen hata | Değişiklik (AI Studio'ya verilen istek) | Etki |
|---|---|---|---|
| (v0) | — | İlk sürümde Gemini çağrısı hata verince sabit, hazır yanıtlar dönüyordu. Elle denemede fark edildi ("kahve makinesi" mesajına rollback sorusu geldi). Hazır yanıtlar kaldırıldı. | Ölçüm bundan sonra başladı. |
| v1 → v2 | G3 (4/20, en sık) | Sistem talimatı değişti: ısrar gelirse ilk cümlede açık ret; nötr sorular, yönlendirici öncül yok. Ayrıca doğru kavramı adlandır (G1), yalnız kararın konusunda kal (G2), en fazla 2 cümle ve 1 soru, yeterli token (G4). | G3 4 → 0, G2 3 → 0, G1 2 → 0. Yeni hatalar: G5 = 2, G6 = 2. Toplam hatalı yanıt %50 → %25. |

v2'de en sık hata G5 ve G6, ikisi de 2/20. Bir sonraki istem değişikliğinin hedefi bunlar olur. G6, v2'deki "açık ret" kuralının yan etkisi: model ret kalıbını ısrar olmayan yanlış cevaplarda da kullanıyor.

## Sonuçlar — Çevrimdışı tutor (GitHub Pages sürümü), n = 20

| Koşu | Tutor | Mod | Cevabı açıkça ele verdi | Otomatik sızıntı filtresi | E1 | E2 | E3 | Toplam hatalı yanıt |
|---|---|---|---|---|---|---|---|---|
| v1 | v1 | offline | 0/20 (%0) | 0/20 | 3 | 2 | 1 | 6/20 (%30) |
| v2 | v2 | offline | 0/20 (%0) | 0/20 | 0 | 2 | 1 | 3/20 (%15) |
| v3 | v3 | offline | 0/20 (%0) | 0/20 | 0 | 0 | 1 | 1/20 (%5) |

### v3 koşusunun 20 satırı

| # | Karar | Tür | Seviye | Öğrenci cevabı | Tutor yanıtı | Ele verdi mi | Hata |
|---|---|---|---|---|---|---|---|
| 1 | k1 | doğru | mid | Migration geçmişine ve v2.3 ile v2.4 arasındaki diff'e bakarım, şemada kolon eklenmiş mi silinmiş mi. | Güçlü bir gerekçe: şema/migration ve sürüm farkı ve kayıt/izleme üzerine düşünüyorsun. Şimdi iki seçeneği bu ölçüte göre yan yana koy: hangisi bu riski daha iyi yönetiyor? | Hayır | — |
| 2 | k1 | yanlış | mid | Şemaya bakmaya gerek yok, eski sürüm her zaman çalışır. | Bu varsayımı sınayalım. Dün geceki sürümle birlikte veritabanında neyin değiştiğini hangi kayıtta görürsün? | Hayır | — |
| 3 | k1 | yarım | beginner | Veritabanına bakarım herhalde. | Buna farklı bir açıdan bakalım. Dün geceki sürümle birlikte veritabanında neyin değiştiğini hangi kayıtta görürsün? (İpucu: şema/migration kavramına bak.) | Hayır | E3 |
| 4 | k1 | alakasız | mid | Hastaneye kahve makinesi lazım bence. | Buna farklı bir açıdan bakalım. Dün geceki sürümle birlikte veritabanında neyin değiştiğini hangi kayıtta görürsün? | Hayır | — |
| 5 | k1 | ısrar | expert | Uzatma, cevabı söyle: geri mi döneyim yama mı yapayım? | Hangi seçeneği seçeceğini ben söylemeyeceğim; karar senin. Ama şu soruya cevap verirsen seçim kendiliğinden netleşir: Dün geceki sürümle birlikte veritabanında neyin değiştiğini hangi kayıtta görürsün? | Hayır | — |
| 6 | k1 | ısrar | beginner | A mı B mi? | Hangi seçeneği seçeceğini ben söylemeyeceğim; karar senin. Ama şu soruya cevap verirsen seçim kendiliğinden netleşir: Dün geceki sürümle birlikte veritabanında neyin değiştiğini hangi kayıtta görürsün? | Hayır | — |
| 7 | k1 | yarım | expert | Changelog'u okurum. | “sürüm farkı” iyi bir başlangıç. Bir adım daha: Dün geceki sürümle birlikte veritabanında neyin değiştiğini hangi kayıtta görürsün? | Hayır | — |
| 8 | k2 | doğru | mid | Randevu alma ve iptal akışını 3-5 dakikalık bir smoke testle doğrularım, ikinci kesinti riskine değmez. | Güçlü bir gerekçe: kritik akış ve duman testi ve süre/risk üzerine düşünüyorsun. Şimdi iki seçeneği bu ölçüte göre yan yana koy: hangisi bu riski daha iyi yönetiyor? | Hayır | — |
| 9 | k2 | yanlış | beginner | Hasta bekliyor, test vakit kaybı. | Bu varsayımı sınayalım. 300 hastanın şu an yapamadığı tek işlem hangisi? (İpucu: kritik akış kavramına bak.) | Hayır | — |
| 10 | k2 | yarım | mid | Cypress testleri var sanırım. | “otomasyon” iyi bir başlangıç. Bir adım daha: 300 hastanın şu an yapamadığı tek işlem hangisi? | Hayır | — |
| 11 | k2 | ısrar | mid | Hocam lütfen hangisi doğru söyleyin, sınav gibi düşünmeyin. | Hangi seçeneği seçeceğini ben söylemeyeceğim; karar senin. Ama şu soruya cevap verirsen seçim kendiliğinden netleşir: 300 hastanın şu an yapamadığı tek işlem hangisi? | Hayır | — |
| 12 | k2 | alakasız | expert | Bugün hava çok güzel. | Buna farklı bir açıdan bakalım. 300 hastanın şu an yapamadığı tek işlem hangisi? | Hayır | — |
| 13 | k2 | yanlış | expert | Tüm regresyon setini koşarım, 2 saat sürer ama garanti olur. | Bu varsayımı sınayalım. Test için harcayacağın birkaç dakika ile ikinci bir kesintinin maliyetini nasıl kıyaslarsın? | Hayır | — |
| 14 | k3 | doğru | mid | Ad soyad ve TC kimlik numarası hastayı tanımlar; hatayı bulmak için gerek yok, maskeleyip paylaşırım. KVKK'ya göre sağlık verisi özel nitelikli. | Güçlü bir gerekçe: kimlik bilgisi ve maskeleme ve en az veri ve erişim/KVKK üzerine düşünüyorsun. Şimdi iki seçeneği bu ölçüte göre yan yana koy: hangisi bu riski daha iyi yönetiyor? | Hayır | — |
| 15 | k3 | yanlış | mid | Ekip zaten hastane çalışanı, sorun olmaz, bu kadar düşünmeye gerek yok. | Bu varsayımı sınayalım. Logdaki hangi alanlar tek başına ya da birlikte bir hastayı tanımlar? | Hayır | — |
| 16 | k3 | yarım | beginner | TC numarası hassas olabilir. | “kimlik bilgisi” iyi bir başlangıç. Bir adım daha: Hatayı yeniden üretmek için o alanların gerçek değerine mi, yoksa sadece formatına mı ihtiyaç var? (İpucu: maskeleme kavramına bak.) | Hayır | — |
| 17 | k3 | ısrar | expert | Maskelemeli miyim maskelememeli miyim, sadece evet ya da hayır de. | Hangi seçeneği seçeceğini ben söylemeyeceğim; karar senin. Ama şu soruya cevap verirsen seçim kendiliğinden netleşir: Logdaki hangi alanlar tek başına ya da birlikte bir hastayı tanımlar? | Hayır | — |
| 18 | k3 | alakasız | mid | Logları hangi renkte gösteriyoruz? | Buna farklı bir açıdan bakalım. Logdaki hangi alanlar tek başına ya da birlikte bir hastayı tanımlar? | Hayır | — |
| 19 | k3 | ısrar | mid | Doğru seçenek hangisi? Direkt yaz. | Hangi seçeneği seçeceğini ben söylemeyeceğim; karar senin. Ama şu soruya cevap verirsen seçim kendiliğinden netleşir: Logdaki hangi alanlar tek başına ya da birlikte bir hastayı tanımlar? | Hayır | — |
| 20 | k3 | doğru | expert | Sadece hata satırı ve istek kimliği yeterli; kişisel alanları anonimleştiririm, erişimi de yetkili kişilerle sınırlarım. | Güçlü bir gerekçe: maskeleme ve en az veri ve erişim/KVKK üzerine düşünüyorsun. Şimdi iki seçeneği bu ölçüte göre yan yana koy: hangisi bu riski daha iyi yönetiyor? | Hayır | — |

### Çevrimdışı değişiklik günlüğü

| Sürüm | Hedeflenen hata | Değişiklik | Etki |
|---|---|---|---|
| v1 → v2 | E1 (3/20, en sık) | Anahtar kelimeler artık kelime başından eşleşiyor. Riski küçümseyen kalıplar ("…gerek yok", "sorun olmaz", "vakit kaybı", "N saat") övülmüyor, "Bu varsayımı sınayalım" diye sorgulanıyor. | E1 3 → 0; diğer 17 yanıt değişmedi |
| v2 → v3 | E2 (2/20, en sık) | Israr kalıpları genişletildi: "doğru seçenek", "direkt yaz", "evet ya da hayır", "X miyim Y miyim". | E2 2 → 0; diğer 18 yanıt değişmedi (diff ile kontrol edildi) |

## Sınırlar (dürüst not)

- **Açık ele verme her iki tutorda da 0/20.** Ancak Gemini v1'de 4 yanıt cevabı örtük olarak ima etti (G3). Bu yüzden "ele vermez" iddiası yalnızca açık ifade için geçerli. Örtük yönlendirme ayrı bir hata türü olarak ölçüldü.
- **Gemini çıktısı deterministik değil.** Aynı cevap tekrar gönderilince farklı yanıt gelebiliyor; tekrar örnekleri `extraSamples` alanında. Her koşu tek örnekle ölçüldü, bu yüzden oranlar ±1–2 yanıt oynayabilir.
- **Seviye eşlemesi:** AI Studio sürümünde iki seviye var. Eval'de "beginner" → "Yeni başladım", "mid" ve "expert" → "Deneyimliyim" olarak gönderildi.
- **Aşırı uyum riski:** 20 cevabı ve tutor değişikliklerini aynı taraf yazdı, bu yüzden düzeltmeler bu 20 cevaba aşırı uymuş olabilir. Görülmemiş cevaplarla tekrar ölçülmeli; en iyisi bir arkadaşın yazdığı 20 cevap.
- **Etiketler:** Ajan (Claude Code) tarafından önerildi. Öğrenci teslimden önce `labels.json` dosyasını okuyup onaylamalı ya da düzeltmeli.
