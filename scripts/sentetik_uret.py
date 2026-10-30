"""Sentetik oturum üreticisi: data/oturumlar.csv içindeki kaynak=sentetik satırları üretir.

Kural (README'de de yazılı):
  - Her oturum için gizli bir "acelecilik" eğilimi u ~ N(0, 1) çekilir (CSV'ye yazılmaz).
  - seviye ∈ {0, 1, 2} eşit olasılıkla.
  - Her kararda tutora gönderilen mesaj sayısı m ~ Poisson(0.7 · e^(-0.5u) · (1.4 yeni başlayansa, değilse 1)).
  - Karar süresi t = e^(2.7 - 0.55u + N(0, 0.35)) + 6·m saniye, [1, 120] aralığına kırpılır.
  - Riskli seçim (B) olasılığı = sigmoid(-0.6 + 1.0u + 0.7·önceki_riskli - 0.35·önceki_tutor_mesajı - 0.3·seviye).
  - Deneyimli oyuncuda t > 60 ise süre dolar: zaman_asimi = 1, seçim B, t = 60.
  - K1 için önceki karar süresi yoktur; spec 8.1 gereği 15 sn atanır.
Mevcut kaynak=gercek satırlar korunur, sentetik satırlar baştan yazılır.

Kullanım: python scripts/sentetik_uret.py [--oturum 1000]
"""
import argparse
import csv
import math
import uuid
from pathlib import Path

import numpy as np

SEED = 13
KOK = Path(__file__).resolve().parent.parent
CSV_YOLU = KOK / "data" / "oturumlar.csv"
SUTUNLAR = [
    "oturum_id", "kaynak", "uygulama_surumu", "karar_no", "seviye", "onceki_riskli",
    "onceki_karar_suresi_sn", "tutor_mesaj_onceki", "karar_suresi_sn", "tutor_mesaj_bu_karar",
    "zaman_asimi", "secim", "riskli",
]
K1_VARSAYILAN_SURE = 15.0


def sigmoid(x):
    return 1.0 / (1.0 + math.exp(-x))


def uret(n_oturum):
    rng = np.random.default_rng(SEED)
    satirlar = []
    for _ in range(n_oturum):
        oturum = str(uuid.UUID(bytes=rng.bytes(16), version=4))
        u = rng.normal()
        seviye = int(rng.integers(0, 3))
        onceki_riskli, onceki_sure, tutor_toplam = 0, K1_VARSAYILAN_SURE, 0
        for karar_no in (1, 2, 3):
            lam = 0.7 * math.exp(-0.5 * u) * (1.4 if seviye == 0 else 1.0)
            m = int(rng.poisson(lam))
            t = math.exp(2.7 - 0.55 * u + rng.normal(0, 0.35)) + 6 * m
            t = min(max(t, 1.0), 120.0)
            p = sigmoid(-0.6 + 1.0 * u + 0.7 * onceki_riskli - 0.35 * tutor_toplam - 0.3 * seviye)
            riskli = int(rng.random() < p)
            zaman_asimi = 0
            if seviye == 2 and t > 60:
                zaman_asimi, riskli, t = 1, 1, 60.0
            satirlar.append({
                "oturum_id": oturum, "kaynak": "sentetik", "uygulama_surumu": "sentetik-1",
                "karar_no": karar_no, "seviye": seviye, "onceki_riskli": onceki_riskli,
                "onceki_karar_suresi_sn": round(onceki_sure, 2), "tutor_mesaj_onceki": tutor_toplam,
                "karar_suresi_sn": round(t, 2), "tutor_mesaj_bu_karar": m, "zaman_asimi": zaman_asimi,
                "secim": "B" if riskli else "A", "riskli": riskli,
            })
            onceki_riskli += riskli
            onceki_sure = t
            tutor_toplam += m
    return satirlar


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--oturum", type=int, default=1000)
    args = ap.parse_args()

    gercek = []
    if CSV_YOLU.exists():
        with CSV_YOLU.open(encoding="utf-8", newline="") as f:
            gercek = [r for r in csv.DictReader(f) if r["kaynak"] == "gercek"]

    CSV_YOLU.parent.mkdir(exist_ok=True)
    with CSV_YOLU.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=SUTUNLAR, lineterminator="\n")
        w.writeheader()
        w.writerows(gercek)
        w.writerows(uret(args.oturum))
    print(f"✓ {CSV_YOLU.name}: {len(gercek)} gerçek satır korundu, {args.oturum * 3} sentetik satır yazıldı (tohum {SEED})")


if __name__ == "__main__":
    main()
