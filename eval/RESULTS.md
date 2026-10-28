# Tutor değerlendirmesi (eval)

**İddia:** Tutor ipucu verir, cevabı (hangi seçeneğin doğru olduğunu) vermez. Bu dosya o iddiayı ölçer.

## Yöntem

- **Girdi:** [`answers.json`](answers.json) — 3 karara dağılmış 20 sentetik öğrenci cevabı. Dağılım: doğru 4, yanlış 4, yarım 4, alakasız 3, "cevabı söyle" diye ısrar eden 5. Seviyeler karışık (yeni / orta / deneyimli).
- **Koşturma:** `node eval/run_eval.cjs <etiket>` cevapları uygulamanın kullandığı `tutor.js` koduna verir. Yanıtlar [`runs/`](runs/) altına aynen kaydedilir.
- **Etiketleme:** Her yanıt okunup iki soruyla etiketlendi: (1) Cevabı ele verdi mi? (2) Ele vermediyse bile pedagojik bir hata var mı? Etiketler [`labels.json`](labels.json) içinde. Ayrıca `tutor.leaks()` adlı otomatik bir düzenli-ifade filtresi de koşar; bu sadece ikinci bir kontroldür, elle etiketin yerini tutmaz.
- **İterasyon:** Her koşudan sonra en sık hata türü bir sonraki değişikliğin hedefi oldu, sonra aynı 20 cevap yeniden koşturuldu.

## Hata türleri

| Kod | Tanım |
|---|---|
| E1 | **Yanlış onay:** riski küçümseyen ya da ödünleşimi kaçıran cevap, anahtar kelime eşleştiği için "Güçlü bir gerekçe" diye övüldü. Örnek (v1, #15): "Ekip zaten hastane çalışanı, sorun olmaz…" → övgü. Neden: "ad" kelimesi "kadar" içinde, "gerek yok" da en-az-veri kavramı olarak eşleşti. |
| E2 | **Israr kaçırıldı:** oyuncu cevabı istedi, tutor fark etmedi. Cevabı vermedi ama reddini de açıklamadı. Örnek (v1, #19): "Doğru seçenek hangisi? Direkt yaz." |
| E3 | **Yarım cevap reddedilmiş gibi:** doğru yöndeki eksik cevaba "farklı bir açıdan bakalım" dendi. Örnek: #3 "Veritabanına bakarım herhalde." |

## Sonuçlar (oran + örnek sayısı, n = 20)

| Koşu | Tutor | Mod | Cevabı ele verdi | Otomatik sızıntı filtresi | E1 | E2 | E3 | Toplam hatalı yanıt |
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

## Değişiklik günlüğü

| Sürüm | Hedeflenen hata | Değişiklik | Etki |
|---|---|---|---|
| v1 → v2 | E1 (3/20, en sık) | Anahtar kelimeler artık kelime başından eşleşiyor; riski küçümseyen kalıplar ("…gerek yok", "sorun olmaz", "vakit kaybı", "N saat") övülmüyor, "Bu varsayımı sınayalım" diye sorgulanıyor. | E1 3 → 0; diğer 17 yanıt değişmedi |
| v2 → v3 | E2 (2/20, en sık) | Israr kalıpları genişletildi: "doğru seçenek", "direkt yaz", "evet ya da hayır", "X miyim Y miyim". | E2 2 → 0; diğer 18 yanıt değişmedi (diff ile kontrol edildi) |

Kalan tek hata E3 (#3). Bir sonraki iterasyonun hedefi bu.

## Sınırlar (dürüst not)

- **Ele verme oranı 3 koşuda da 0/20.** Kural tabanlı tutor cevap üretmediği, şablon kullandığı için bu beklenen bir sonuç. Asıl risk, Gemini modunda (`tutor.js` → `gemini()`). **Gemini modu bu eval'de koşturulmadı**, çünkü bu makinede Gemini API anahtarı yok. Anahtar varsa aynı ölçüm şöyle koşar: `GEMINI_API_KEY=... node eval/run_eval.cjs gemini-v1`. Sonra `labels.json` dosyasına `gemini-v1` etiketleri elle eklenir.
- 20 cevabı ve tutoru aynı taraf yazdı. v2 ve v3 düzeltmeleri bu 20 cevaba aşırı uyum (overfit) riski taşıyor. Yeni, görülmemiş cevaplarla tekrar ölçülmeli. En iyisi, bir arkadaşın yazdığı 20 cevap.
- Etiketler ajan (Claude Code) tarafından önerildi. Öğrenci teslimden önce `labels.json` dosyasını okuyup onaylamalı ya da düzeltmeli.
