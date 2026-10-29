// AI Studio uygulamasının Gemini tutorunu ölçmek için tarayıcı konsolunda çalıştırılan kod.
// Uygulama sekmesinde (ais-dev-....run.app) çalışır; /api/tutor sunucu tarafında Gemini'yi çağırır.
// Her istek bağımsızdır (sohbet geçmişi gönderilmez). Bittiğinde <etiket>.json indirir.
// Seviye eşlemesi: AI Studio sürümünde yalnızca iki seviye var; beginner -> "Yeni başladım", mid/expert -> "Deneyimliyim".
async function runTutorEval(label, answers) {
  const Q = {
    K1: "Geri dönmeden önce veritabanı şemasının değişip değişmediğini nasıl anlarsın?",
    K2: "Yayına almadan önce hangi kullanıcı akışının kesinlikle çalıştığından emin olmak istersin?",
    K3: "Bu logdaki hangi alanlar bir kişiyi tanımlanabilir kılar ve hatayı bulmak için bunlara gerçekten ihtiyaç var mı?",
  };
  const rows = [];
  for (const a of answers) {
    const step = a.decision.toUpperCase();
    const r = await fetch("/api/tutor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        step,
        userMessage: a.answer,
        initialQuestion: Q[step],
        role: "Nöbetçi SRE",
        experience: a.level === "beginner" ? "Yeni başladım" : "Deneyimliyim",
      }),
    });
    const j = await r.json();
    rows.push({ id: a.id, status: r.status, reply: j.reply ?? JSON.stringify(j) });
  }
  const data = { tutorVersion: "aistudio-" + label, mode: "gemini (AI Studio /api/tutor)", date: new Date().toISOString(), rows };
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  link.download = label + ".raw.json";
  link.click();
}
