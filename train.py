"""The Primer v2 — "riskli seçime gidecek mi?" modelini eğitir, ölçer, kapıdan geçirir ve paketler.

Tek komut:  python train.py
Girdi:   data/oturumlar.csv
Çıktı:   model/model.onnx, model/config.json, model/README.md (model kartı)

Kabul eşiği spec.md §8.3'te eğitimden önce yazıldı. Eşik sağlanmazsa betik hata koduyla durur
ve model/ klasörüne dokunmaz (artefakt yayınlanmaz).
"""
import hashlib
import json
import shutil
import sys
import tempfile
from datetime import date
from pathlib import Path

import jsonschema
import numpy as np
import onnxruntime as ort
import pandas as pd
import sklearn
from skl2onnx import to_onnx
from skl2onnx.common.data_types import FloatTensorType
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, balanced_accuracy_score, brier_score_loss, roc_auc_score
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

SEED = 13
KOK = Path(__file__).resolve().parent
VERI = KOK / "data" / "oturumlar.csv"
MODEL_DIR = KOK / "model"

OZELLIKLER = ["seviye", "karar_no", "onceki_riskli", "onceki_karar_suresi_sn", "tutor_mesaj_onceki"]
HEDEF = "riskli"
KARAR_ESIGI = 0.5

# spec.md §8.3 — eğitimden önce sabitlendi
ESIK_AUC = 0.70
ESIK_DENGELI_DOGRULUK = 0.60
ESIK_ONNX_FARK = 1e-4
GERCEK_OTURUM_HEDEFI = 15


def onnx_aktar(model, X_ornek, yol):
    onx = to_onnx(model, initial_types=[("input", FloatTensorType([None, X_ornek.shape[1]]))],
                  options={id(model): {"zipmap": False}}, target_opset=17)
    yol.write_bytes(onx.SerializeToString())
    oturum = ort.InferenceSession(str(yol))
    p_onnx = oturum.run(["probabilities"], {"input": X_ornek.astype(np.float32)})[0]
    return float(np.abs(p_onnx - model.predict_proba(X_ornek)).max())


def main():
    veri = pd.read_csv(VERI)
    veri_ozeti = hashlib.sha256(VERI.read_bytes()).hexdigest()
    kaynak_sayilari = {k: int(veri.loc[veri.kaynak == k, "oturum_id"].nunique()) for k in ("gercek", "sentetik")}

    X = veri[OZELLIKLER].to_numpy(np.float64)
    y = veri[HEDEF].to_numpy()
    bolucu = GroupShuffleSplit(n_splits=1, test_size=0.3, random_state=SEED)
    egitim, test = next(bolucu.split(X, y, groups=veri["oturum_id"]))

    model = Pipeline([("scaler", StandardScaler()), ("lr", LogisticRegression(random_state=SEED, class_weight="balanced"))])
    model.fit(X[egitim], y[egitim])

    p_test = model.predict_proba(X[test])[:, 1]
    tahmin = (p_test >= KARAR_ESIGI).astype(int)
    metrikler = {
        "roc_auc": round(float(roc_auc_score(y[test], p_test)), 4),
        "balanced_accuracy": round(float(balanced_accuracy_score(y[test], tahmin)), 4),
        "accuracy": round(float(accuracy_score(y[test], tahmin)), 4),
        "brier": round(float(brier_score_loss(y[test], p_test)), 4),
        "test_satir": int(len(test)),
        "egitim_satir": int(len(egitim)),
        "pozitif_orani_test": round(float(y[test].mean()), 4),
    }

    # Gerçek veri varsa onun üzerindeki performans ayrıca raporlanır (kapı değil).
    gercek_test = test[veri.iloc[test]["kaynak"].to_numpy() == "gercek"]
    if len(gercek_test) and len(set(y[gercek_test])) == 2:
        metrikler["roc_auc_gercek_test"] = round(float(roc_auc_score(y[gercek_test], model.predict_proba(X[gercek_test])[:, 1])), 4)

    print("Test metrikleri:", json.dumps(metrikler, ensure_ascii=False))
    print("Oturum sayıları:", kaynak_sayilari)

    hatalar = []
    if metrikler["roc_auc"] < ESIK_AUC:
        hatalar.append(f"ROC AUC {metrikler['roc_auc']} < {ESIK_AUC}")
    if metrikler["balanced_accuracy"] < ESIK_DENGELI_DOGRULUK:
        hatalar.append(f"dengeli doğruluk {metrikler['balanced_accuracy']} < {ESIK_DENGELI_DOGRULUK}")

    gecici = Path(tempfile.mkdtemp())
    fark = onnx_aktar(model, X[test], gecici / "model.onnx")
    metrikler["onnx_sklearn_maks_fark"] = float(f"{fark:.2e}")
    if fark > ESIK_ONNX_FARK:
        hatalar.append(f"ONNX-sklearn farkı {fark:.2e} > {ESIK_ONNX_FARK}")

    if hatalar:
        shutil.rmtree(gecici)
        sys.exit("✗ KAPI GEÇİLEMEDİ, model yayınlanmaz: " + "; ".join(hatalar))

    yalniz_sentetik = kaynak_sayilari["gercek"] < GERCEK_OTURUM_HEDEFI
    config = {
        "$schema": "./config.schema.json",
        "model_adi": "primer-riskli-secim",
        "surum": "2.0.0",
        "amac": "Karar sahnesi açılırken oyuncunun riskli seçeneğe (B) gitme olasılığını tahmin eder; p >= karar_esigi ise oyun 'Dur ve düşün' müdahalesi açar.",
        "girdi": {
            "ad": "input", "tip": "float32", "sekil": [None, len(OZELLIKLER)],
            "ozellikler": [
                {"ad": "seviye", "tip": "integer", "aralik": [0, 2], "aciklama": "0 Yeni başladım, 1 Biraz deneyimim var, 2 Deneyimliyim"},
                {"ad": "karar_no", "tip": "integer", "aralik": [1, 3]},
                {"ad": "onceki_riskli", "tip": "integer", "aralik": [0, 2], "aciklama": "Bu oturumda önceki B seçimi sayısı"},
                {"ad": "onceki_karar_suresi_sn", "tip": "number", "aralik": [1, 120], "aciklama": "Önceki kararın süresi; K1 için 15"},
                {"ad": "tutor_mesaj_onceki", "tip": "integer", "aralik": [0, 50], "aciklama": "Önceki kararlarda tutora gönderilen mesaj sayısı"},
            ],
        },
        "cikti": {"ad": "probabilities", "tip": "float32", "sekil": [None, 2], "sinif_sirasi": [int(c) for c in model.classes_]},
        "sinif_etiketleri": {"0": "güvenli seçim (A)", "1": "riskli seçim (B)"},
        "karar_esigi": KARAR_ESIGI,
        "kabul_esikleri": {"roc_auc": ESIK_AUC, "balanced_accuracy": ESIK_DENGELI_DOGRULUK, "onnx_sklearn_maks_fark": ESIK_ONNX_FARK},
        "metrikler": metrikler,
        "veri": {
            "dosya": "data/oturumlar.csv", "sha256": veri_ozeti, "satir": int(len(veri)),
            "oturum": kaynak_sayilari, "yalniz_sentetik_dogrulandi": yalniz_sentetik,
        },
        "egitim": {
            "algoritma": "StandardScaler -> LogisticRegression", "random_state": SEED,
            "bolme": "GroupShuffleSplit(test_size=0.3) oturum bazında",
            "sklearn": sklearn.__version__, "onnxruntime": ort.__version__,
            "python": f"{sys.version_info.major}.{sys.version_info.minor}", "tarih": date.today().isoformat(),
        },
        "katsayilar_olcekli": dict(zip(OZELLIKLER, [round(float(c), 4) for c in model.named_steps["lr"].coef_[0]])),
    }
    # Sözleşme kapısı: config.json, tüketicilerin dayandığı şemaya uymazsa artefakt yazılmaz.
    sema = json.loads((MODEL_DIR / "config.schema.json").read_text(encoding="utf-8"))
    try:
        jsonschema.validate(config, sema)
    except jsonschema.ValidationError as e:
        shutil.rmtree(gecici)
        sys.exit(f"✗ config.json sözleşmeye uymuyor: {e.message}")
    (gecici / "config.json").write_text(json.dumps(config, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    MODEL_DIR.mkdir(exist_ok=True)
    for ad in ("model.onnx", "config.json"):
        shutil.copy(gecici / ad, MODEL_DIR / ad)
    shutil.rmtree(gecici)
    print(f"✓ kapı geçildi → model/model.onnx, model/config.json (ONNX farkı {fark:.1e})")
    if yalniz_sentetik:
        print(f"⚠ gerçek oturum {kaynak_sayilari['gercek']} < {GERCEK_OTURUM_HEDEFI}: model kartında 'yalnızca sentetik veriyle doğrulandı' uyarısı geçerli")


if __name__ == "__main__":
    main()
