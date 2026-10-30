// Uyum modeli (v2): model/kaynak.json'daki adresten model.onnx'i indirir ve onnxruntime-web ile
// "oyuncu bu kararda riskli seçeneğe (B) gidecek mi?" olasılığını hesaplar.
// Girdi sözleşmesi model/config.json'dadır: float32 [1, 5], sıra
// seviye, karar_no, onceki_riskli, onceki_karar_suresi_sn, tutor_mesaj_onceki.
(function (root) {
  const LEVEL_CODE = { beginner: 0, mid: 1, expert: 2 };
  let loading = null;

  async function getJson(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(url + " HTTP " + res.status);
    return res.json();
  }

  function load() {
    if (loading) return loading;
    loading = (async () => {
      const config = await getJson("model/config.json");
      let source = {};
      try { source = await getJson("model/kaynak.json"); } catch (e) { /* yerel kopya kullanılır */ }
      const url = source.url || "model/model.onnx";
      // Yayılım (RELEASE.md): "golge" = p hesaplanır ama oyunu değiştirmez; "kanarya" = oturumların
      // yalnızca `oran` kadarında müdahale; "tam" = herkese.
      const rollout = source.yayilim || { mod: "tam", oran: 1 };
      root.ort.env.wasm.numThreads = 1;
      const session = await root.ort.InferenceSession.create(url);
      return { session, config, url, rollout };
    })();
    return loading;
  }

  // Oyun durumundan modelin 5 özelliğini üretir (yalnızca karar anından önce bilinenler).
  function features(profile, decisionNo, history) {
    return [
      LEVEL_CODE[profile.level],
      decisionNo,
      history.riskyCount,
      history.prevDurationSec,
      history.tutorCount,
    ];
  }

  async function predict(x) {
    const { session } = await load();
    const input = new root.ort.Tensor("float32", Float32Array.from(x), [1, x.length]);
    const out = await session.run({ input });
    return out.probabilities.data[1];
  }

  // Oturum kimliğinden [0, 1) aralığında kararlı bir sayı: aynı oturum hep aynı kanarya grubunda kalır.
  function bucket(sessionId) {
    let h = 2166136261;
    for (const ch of sessionId) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    return (h >>> 0) / 4294967296;
  }

  function interventionEnabled(rollout, sessionId) {
    if (rollout.mod === "golge") return false;
    if (rollout.mod === "kanarya") return bucket(sessionId) < rollout.oran;
    return true;
  }

  root.PrimerModel = { load, features, predict, interventionEnabled };
})(window);
