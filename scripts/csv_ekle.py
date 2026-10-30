"""Veri toplama modundan indirilen CSV'leri data/oturumlar.csv'ye ekler.

Kullanım: python scripts/csv_ekle.py indirilenler/primer-oturum-*.csv

Kurallar (data/SOZLUK.md):
  - Başlık satırı sözlükteki sütunlarla birebir aynı olmalı (fazla sütun = olası kişisel veri → red).
  - Her satır kaynak=gercek olmalı; oturum 3 karardan oluşmalı.
  - Aynı oturum_id ikinci kez eklenmez.
Sonra modeli yeniden eğitmek için: python train.py
"""
import csv
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from sentetik_uret import CSV_YOLU, SUTUNLAR  # noqa: E402


def main(dosyalar):
    with CSV_YOLU.open(encoding="utf-8", newline="") as f:
        mevcut = list(csv.DictReader(f))
    bilinen = {r["oturum_id"] for r in mevcut}
    yeni = []
    for yol in dosyalar:
        with open(yol, encoding="utf-8", newline="") as f:
            okuyucu = csv.DictReader(f)
            if okuyucu.fieldnames != SUTUNLAR:
                sys.exit(f"✗ {yol}: sütunlar sözlükle aynı değil: {okuyucu.fieldnames}")
            satirlar = list(okuyucu)
        if any(r["kaynak"] != "gercek" for r in satirlar):
            sys.exit(f"✗ {yol}: kaynak=gercek olmayan satır var")
        oturumlar = {r["oturum_id"] for r in satirlar}
        for o in oturumlar:
            if sorted(r["karar_no"] for r in satirlar if r["oturum_id"] == o) != ["1", "2", "3"]:
                sys.exit(f"✗ {yol}: {o} oturumu 3 karar içermiyor")
        if oturumlar & bilinen:
            print(f"  {yol}: zaten ekli, atlandı")
            continue
        bilinen |= oturumlar
        yeni += satirlar
        print(f"  {yol}: {len(oturumlar)} oturum eklendi")
    with CSV_YOLU.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=SUTUNLAR, lineterminator="\n")
        w.writeheader()
        w.writerows([r for r in mevcut if r["kaynak"] == "gercek"] + yeni + [r for r in mevcut if r["kaynak"] != "gercek"])
    toplam = len({r["oturum_id"] for r in mevcut + yeni if r["kaynak"] == "gercek"})
    print(f"✓ gerçek oturum sayısı: {toplam} (hedef ≥ 15). Şimdi: python train.py")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(sys.argv[1:])
