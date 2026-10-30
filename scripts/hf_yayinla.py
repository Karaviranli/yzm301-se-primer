"""model/ klasörünü Hugging Face'te public model reposuna yayınlar ve sürümü commit'e sabitler.

Önkoşul (bir kez): hf auth login        (write yetkili token; token bu repoya yazılmaz)
Kullanım:          python scripts/hf_yayinla.py [--repo primer-riskli-secim]

Yaptıkları:
  1. Kapıdan geçmiş artefakt var mı kontrol eder (model/config.json metrikleri ≥ kabul eşikleri).
  2. <kullanıcı>/<repo> public model reposunu oluşturur (varsa kullanır) ve model.onnx, config.json,
     config.schema.json, README.md (model kartı) dosyalarını tek commit'le yükler.
  3. Commit'e sabit URL'den model.onnx'i geri indirip SHA-256'sını yerel dosyayla karşılaştırır.
  4. model/kaynak.json'u bu sabit URL'ye çevirir (uygulama modeli artık Hub'dan çeker) ve
     RELEASE.md'deki <HF_REPO> / <HF_COMMIT> yer tutucularını doldurur.
"""
import argparse
import hashlib
import json
import sys
import urllib.request
from pathlib import Path

from huggingface_hub import HfApi

KOK = Path(__file__).resolve().parent.parent
MODEL_DIR = KOK / "model"
YUKLENECEK = ["model.onnx", "config.json", "config.schema.json", "README.md"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", default="primer-riskli-secim")
    args = ap.parse_args()

    config = json.loads((MODEL_DIR / "config.json").read_text(encoding="utf-8"))
    m, e = config["metrikler"], config["kabul_esikleri"]
    if m["roc_auc"] < e["roc_auc"] or m["balanced_accuracy"] < e["balanced_accuracy"]:
        sys.exit("✗ model kabul eşiğinin altında; yayınlanmaz (spec.md §8.3)")

    api = HfApi()
    try:
        kullanici = api.whoami()["name"]
    except Exception:
        sys.exit("✗ Hugging Face girişi yok. Önce: hf auth login")
    repo = args.repo if "/" in args.repo else f"{kullanici}/{args.repo}"

    api.create_repo(repo, repo_type="model", private=False, exist_ok=True)
    commit = api.upload_folder(
        repo_id=repo, repo_type="model", folder_path=MODEL_DIR, allow_patterns=YUKLENECEK,
        commit_message=f"v{config['surum']}: AUC {m['roc_auc']}, dengeli doğruluk {m['balanced_accuracy']}, veri {config['veri']['sha256'][:12]}",
    )
    sha = commit.oid
    url = f"https://huggingface.co/{repo}/resolve/{sha}/model.onnx"

    uzak = urllib.request.urlopen(url, timeout=60).read()
    if hashlib.sha256(uzak).hexdigest() != hashlib.sha256((MODEL_DIR / "model.onnx").read_bytes()).hexdigest():
        sys.exit(f"✗ Hub'daki model.onnx yerel dosyayla aynı değil: {url}")

    kaynak = json.loads((MODEL_DIR / "kaynak.json").read_text(encoding="utf-8"))
    kaynak.update({"url": url, "repo": repo, "commit": sha, "surum": config["surum"]})
    (MODEL_DIR / "kaynak.json").write_text(json.dumps(kaynak, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    release = KOK / "RELEASE.md"
    release.write_text(release.read_text(encoding="utf-8").replace("<HF_REPO>", repo).replace("<HF_COMMIT>", sha), encoding="utf-8")

    print(f"✓ yayınlandı: https://huggingface.co/{repo}/tree/{sha}")
    print(f"  commit'e sabit model: {url}")
    print("  model/kaynak.json ve RELEASE.md güncellendi → git add -A && git commit -m 'v2.0 HF yayını' && git push")


if __name__ == "__main__":
    main()
