# Sınav tasarımı — YZM301 vize, klasik soru (1 sayfa)

**Tasarım fikri:** Soru, öğrenciye bir tanım sormaz; ona bir karar verdirir ve kararın gerekçesini yazdırır. Her alt soru, tanımı ezberleyen ama kavramın amacını anlamayan öğrencinin seçeceği yanlış cevaba (çeldiriciye) göre kuruldu. Puan cevaptan değil gerekçeden gelir. Aynı kavramlar, The Primer'ın kendi senaryosuna oturtuldu.

---

## Soru (40 puan, 35 dk)

Bir hastanenin **randevu önceliklendirme** modülü 12 yıllık bir C# kodudur, belgesi yoktur. Ekip modülü Python'a taşıyor; yeni modül bir hastaya 0–1 arası bir "öncelik puanı" veriyor. Elinizde şunlar var:

- Geçen ayın gerçek isteklerinden alınmış, anonimleştirilmiş **300 girdi**.
- Eski sistemin bu girdilere verdiği çıktılar.
- Yeni modülün kaynak kodu.

Eski sistemin çıktıları ile yeni modülün çıktıları 300 girdinin **296'sında 1e-6'dan küçük**, **4'ünde 0.03 ile 0.08 arasında** farklı.

**a) (8p)** Bu karşılaştırmada **test kahini (oracle)** nedir? Burada kahinin kendisinin yanlış olabileceği bir durum yazın.

**b) (8p)** Ekip lideri "Eski kodun ne yaptığını tam bilmiyoruz, ama ne yapıyorsa onu yapsın" diyor. Bu yaklaşımın adı nedir? Hangi durumda bu yaklaşım bir hatayı sonsuza kadar korur?

**c) (8p)** Toleransı neden 0 değil de 1e-4 gibi bir değer seçersiniz? 4 farklı girdiyi "tolerans 0.1'e çıkarılsın, test geçsin" diyerek kapatmak neden yanlış? Kararınızı somut bir çıktı farkıyla gerekçelendirin.

**d) (8p)** Testler geçti. "Yeni modül doğru hastaya öncelik veriyor" diyebilir misiniz? Cevabınızda **doğrulama** ile **geçerleme** ayrımını kullanın.

**e) (8p)** Altı ay sonra yeni modüle bir özellik ekleniyor. 300 girdilik dosya bu noktada hangi test türüne dönüşür? Dosyayı her yeni sürümde körü körüne güncellemenin riski nedir?

---

## Beklenen kavramlar ve çeldiriciler (değerlendirme anahtarı)

| | Beklenen özü | Ezberci çeldirici (puan almaz) |
|---|---|---|
| a | Kahin = eski sistemin çıktıları (**diferansiyel test**: iki uygulama aynı girdiye aynı cevabı vermeli). Kahin yanılabilir: eski sistemin bilinen bir hatası ya da kayan nokta farkı "doğru" diye referans alınır. | "Kahin, testin beklenen sonucudur." Tanım doğru ama bu sistemde *neyin* kahin olduğu söylenmiyor. |
| b | **Karakterizasyon testi** (Feathers): mevcut davranışı belgeler, doğruluğu iddia etmez. Eski kodda bir hata varsa (ör. 65 yaş sınırı ≥ yerine > ile yazılmışsa) test bu hatayı "beklenen" diye kilitler. | "Regresyon testidir." Amaç ve zaman farkı karıştırılmış. |
| c | **Hata toleransı** sayısal gürültü ile anlam farkını ayırır. float32/float64 ve farklı kütüphaneler ~1e-7 düzeyinde fark üretir; 0 tolerans sahte alarm üretir. 0.08'lik fark ise 0.5 eşiğinin iki yanındaki bir hastanın sırasını değiştirebilir, yani anlamlıdır. Toleransı testi geçirmek için büyütmek, hatayı gizlemektir. | "Tolerans her zaman küçük seçilir." Neden küçük olduğu ve 4 girdinin incelenmesi gerektiği söylenmiyor. |
| d | Hayır. Testler **doğrulama**dır (*doğru şeyi mi değil, şeyi doğru mu yaptık*): yeni modül eski modülle aynı. Hastaya doğru önceliğin verilip verilmediği **geçerleme** sorusudur; klinik uzman ve gerçek sonuç verisi gerekir. Eski sistem yanlışsa iki modül birlikte yanlıştır. | "Testlerin hepsi geçti, yani doğru." |
| e | **Regresyon testi**: yeni özellik eski davranışı bozmasın. Referansı her sürümde otomatik yeniden üretmek, kahini test edilen kodun kendisine dönüştürür; testler artık hiçbir zaman kırmızı olmaz. Referans değişikliği ayrı, gerekçeli bir commit olmalıdır. | "Birim testi olur." / "Dosya her zaman güncel tutulmalı." |

**Neden bu soru:** The Primer v2'de `tests/parite.json` tam olarak bu dosyadır. Python onnxruntime kahindir; tarayıcı ve sunucu test edilen uygulamalardır; tolerans 1e-4'tür. Modelin sentetik veride AUC ≥ 0.70 alması ise doğrulamadır; gerçek oyuncularda işe yarayıp yaramadığı henüz geçerlenmedi.
