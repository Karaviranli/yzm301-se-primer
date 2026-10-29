// AI Studio'daki Gemini tutorunun ham çıktısını (eval/raw/<etiket>.raw.json) run formatına çevirir.
// Ham çıktı, tarayıcıda gemini_browser_runner.js ile uygulamanın /api/tutor uç noktasından alınır.
// Aynı id için birden fazla yanıt varsa ilki (ana koşu) kullanılır, diğerleri "extraSamples" alanına yazılır.
// Kullanım: node eval/import_gemini.cjs gemini-v1
const fs = require("fs");
const path = require("path");
const label = process.argv[2];
const raw = JSON.parse(fs.readFileSync(path.join(__dirname, "raw", label + ".raw.json"), "utf8"));
const answers = JSON.parse(fs.readFileSync(path.join(__dirname, "answers.json"), "utf8"));
const rows = answers.map((a) => {
  const hits = raw.rows.filter((r) => r.id === a.id);
  return {
    ...a,
    reply: hits[0].reply,
    httpStatus: hits[0].status,
    extraSamples: hits.slice(1).map((h) => h.reply),
    label: { gaveAway: null, errorType: null, note: null },
  };
});
const out = { tutorVersion: raw.tutorVersion, mode: raw.mode, date: raw.date, rows };
fs.writeFileSync(path.join(__dirname, "runs", label + ".json"), JSON.stringify(out, null, 2));
console.log("Yazıldı:", label, rows.length, "satır");
