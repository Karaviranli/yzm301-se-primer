"""İkinci tüketici (test kahini): model/model.onnx'i Python onnxruntime ile çalıştırır.

    python tests/parite.py           # tests/parite.json'daki 5 referansı yeniden hesaplar, fark ≤ 1e-6 bekler
    python tests/parite.py --yaz     # referans olasılıkları model değişince yeniden yazar
    python tests/parite.py --url URL # aynı 5 girdiyi bir sunucu tüketicisine (bonus: server/) sorar, fark < 1e-4 bekler

Tarayıcı tarafı (onnxruntime-web) cypress/e2e/parite.cy.js ile aynı dosyaya karşı ölçülür.
"""
import argparse
import json
import sys
import urllib.request
from pathlib import Path

import numpy as np
import onnxruntime as ort

KOK = Path(__file__).resolve().parent.parent
PARITE = KOK / "tests" / "parite.json"
MODEL = KOK / "model" / "model.onnx"

# Sıra model/config.json → girdi.ozellikler ile aynıdır.
REFERANS_GIRDILER = [
    {"ad": "K1, deneyimli, geçmiş yok", "x": [2, 1, 0, 15, 0]},
    {"ad": "K1, yeni başlayan, geçmiş yok", "x": [0, 1, 0, 15, 0]},
    {"ad": "K2, K1'de 3 sn'de B, tutor yok (orta)", "x": [1, 2, 1, 3, 0]},
    {"ad": "K2, K1'de 40 sn düşünüp A, 2 tutor mesajı (orta)", "x": [1, 2, 0, 40, 2]},
    {"ad": "K3, iki kez B, son karar 1.5 sn (deneyimli)", "x": [2, 3, 2, 1.5, 0]},
]


def onnx_olasilik(girdiler):
    oturum = ort.InferenceSession(str(MODEL))
    X = np.array([g["x"] for g in girdiler], dtype=np.float32)
    return oturum.run(["probabilities"], {"input": X})[0][:, 1].astype(float)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--yaz", action="store_true")
    ap.add_argument("--url")
    args = ap.parse_args()

    if args.yaz:
        p = onnx_olasilik(REFERANS_GIRDILER)
        kayit = {
            "model": "model/model.onnx",
            "config_surum": json.loads((KOK / "model" / "config.json").read_text(encoding="utf-8"))["surum"],
            "tolerans": 1e-4,
            "kahin": f"Python onnxruntime {ort.__version__}",
            "referanslar": [{**g, "p": float(pi)} for g, pi in zip(REFERANS_GIRDILER, p)],
        }
        PARITE.write_text(json.dumps(kayit, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"✓ {PARITE.name} yazıldı")
        return

    kayit = json.loads(PARITE.read_text(encoding="utf-8"))
    beklenen = np.array([r["p"] for r in kayit["referanslar"]])
    if args.url:
        istek = urllib.request.Request(args.url, data=json.dumps({"x": [r["x"] for r in kayit["referanslar"]]}).encode(),
                                       headers={"Content-Type": "application/json"})
        gelen = np.array(json.loads(urllib.request.urlopen(istek, timeout=60).read())["p"])
        tolerans, kaynak = kayit["tolerans"], args.url
    else:
        gelen, tolerans, kaynak = onnx_olasilik(kayit["referanslar"]), 1e-6, "Python onnxruntime"
    fark = np.abs(gelen - beklenen)
    for r, g, f in zip(kayit["referanslar"], gelen, fark):
        print(f"  {r['ad']:<50} beklenen {r['p']:.8f}  gelen {g:.8f}  fark {f:.1e}")
    if fark.max() > tolerans:
        sys.exit(f"✗ parite bozuk ({kaynak}): maks fark {fark.max():.2e} > {tolerans}")
    print(f"✓ parite tamam ({kaynak}): maks fark {fark.max():.1e} ≤ {tolerans}")


if __name__ == "__main__":
    main()
