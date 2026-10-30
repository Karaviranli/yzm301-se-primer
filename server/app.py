"""Üçüncü tüketici (bonus): aynı model.onnx'i sunucuda çalıştıran FastAPI servisi.

Yerel:   uvicorn server.app:app --port 8000
Render:  render.yaml (ücretsiz web servisi). MODEL_URL ortam değişkeni verilirse model commit'e
         sabit Hugging Face URL'sinden indirilir; verilmezse repodaki model/model.onnx kullanılır.
Parite:  python tests/parite.py --url http://localhost:8000/tahmin
"""
import os
import urllib.request
from pathlib import Path

import numpy as np
import onnxruntime as ort
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

YEREL_MODEL = Path(__file__).resolve().parent.parent / "model" / "model.onnx"
MODEL_URL = os.environ.get("MODEL_URL")

model_bayt = urllib.request.urlopen(MODEL_URL, timeout=60).read() if MODEL_URL else YEREL_MODEL.read_bytes()
oturum = ort.InferenceSession(model_bayt)

app = FastAPI(title="Primer uyum modeli")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


class Istek(BaseModel):
    x: list[list[float]] = Field(description="[n, 5]: seviye, karar_no, onceki_riskli, onceki_karar_suresi_sn, tutor_mesaj_onceki")


@app.get("/")
def saglik():
    return {"durum": "ok", "model": MODEL_URL or "model/model.onnx", "onnxruntime": ort.__version__}


@app.post("/tahmin")
def tahmin(istek: Istek):
    p = oturum.run(["probabilities"], {"input": np.asarray(istek.x, dtype=np.float32)})[0][:, 1]
    return {"p": [float(v) for v in p]}
