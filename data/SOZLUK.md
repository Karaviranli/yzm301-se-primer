# Veri sözlüğü — `data/oturumlar.csv`

Her satır **bir karardır**; bir oturum 3 satırdır (K1, K2, K3). Ayraç virgül, kodlama UTF-8, ondalık ayracı nokta.

| Sütun | Tip | Değerler | Anlamı | Modelde |
|---|---|---|---|---|
| `oturum_id` | metin (UUID v4) | rastgele | Oturum kimliği. Tarayıcıda `crypto.randomUUID()` ile üretilir, kişiyle eşleştirilemez. Eğitim/test bölmesi bu sütuna göre yapılır. | Hayır (gruplama) |
| `kaynak` | metin | `gercek` \| `sentetik` | `gercek`: gerçek bir insanın veri toplama modunda (`?toplama=1`) oynadığı oturum. `sentetik`: `scripts/sentetik_uret.py` çıktısı. **Zorunlu.** | Hayır |
| `uygulama_surumu` | metin | `2.0.0`, `sentetik-1` | Satırı üreten uygulama ya da üretici sürümü | Hayır |
| `karar_no` | tam sayı | 1, 2, 3 | Karar sırası (K1 mimari, K2 test, K3 KVKK) | **Evet** (2.) |
| `seviye` | tam sayı | 0, 1, 2 | Girişteki seviye cevabı: 0 = Yeni başladım, 1 = Biraz deneyimim var, 2 = Deneyimliyim | **Evet** (1.) |
| `onceki_riskli` | tam sayı | 0–2 | Bu karardan önce bu oturumda seçilen B sayısı | **Evet** (3.) |
| `onceki_karar_suresi_sn` | ondalık | 1–120 | Bir önceki kararda sahnenin açılmasından seçime kadar geçen süre (sn). K1'de önceki karar olmadığı için sabit **15** yazılır (spec §8.1). | **Evet** (4.) |
| `tutor_mesaj_onceki` | tam sayı | ≥ 0 | Bu karardan önceki kararlarda tutora gönderilen mesaj **sayısı** (metin kaydedilmez) | **Evet** (5.) |
| `karar_suresi_sn` | ondalık | 1–120 | Bu kararda sahnenin açılmasından seçime kadar geçen süre. 1–120 aralığına kırpılır. | Hayır (karar anında bilinmez; bir sonraki satırın `onceki_karar_suresi_sn`'si olur) |
| `tutor_mesaj_bu_karar` | tam sayı | ≥ 0 | Bu kararda tutora gönderilen mesaj sayısı | Hayır (aynı neden) |
| `zaman_asimi` | 0/1 | | Deneyimli oyuncuda süre dolup B'nin otomatik uygulanması | Hayır |
| `secim` | metin | `A` \| `B` | Oyuncunun seçimi | Hayır |
| `riskli` | 0/1 | | **Etiket.** `secim = B` ise 1 | Hedef |

## Toplanmayanlar (KVKK, 6698 s. Kanun md. 4 — ölçülülük)

Aşağıdakiler hiçbir sütunda tutulmaz:

- Ad, e-posta, öğrenci numarası.
- Cihaz kimliği, IP, konum, tarayıcı bilgisi.
- Tutora yazılan metin.
- Rol ve hedef cevapları. Model bunları kullanmadığı için toplanmaz.

Veri tarayıcıdan sunucuya gönderilmez. Oyuncu CSV'yi kendisi indirir ve proje sahibine kendisi verir.

## Satırların kaynağı (bu sürüm)

| Kaynak | Oturum | Satır | Nasıl üretildi |
|---|---|---|---|
| `sentetik` | 1000 | 3000 | `python scripts/sentetik_uret.py`, tohum 13. Kural README'de ve betiğin başında. |
| `gercek` | **0** | 0 | Henüz toplanmadı. Toplama modu hazır: `https://karaviranli.github.io/yzm301-se-primer/?toplama=1` |

Gerçek CSV'ler gelince `python scripts/csv_ekle.py indirilenler/*.csv` komutu satırları bu dosyaya ekler. Komut sütunları sözlüğe göre doğrular ve `kaynak=gercek` olmayan satırı reddeder.
