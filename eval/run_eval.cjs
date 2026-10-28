// Tutor değerlendirmesi: 20 öğrenci cevabını tutor'a verir, yanıtları kaydeder.
// Kullanım: node eval/run_eval.cjs <etiket>      (çevrimdışı tutor)
//           GEMINI_API_KEY=... node eval/run_eval.cjs <etiket>   (Gemini tutor)
// Çıktı: eval/runs/<etiket>.json — elle etiketleme için labels alanı boş gelir.
const fs = require("fs");
const path = require("path");
const { STORY } = require("../story.js");
const Tutor = require("../tutor.js");

async function main() {
  const label = process.argv[2] || "run";
  const answers = JSON.parse(fs.readFileSync(path.join(__dirname, "answers.json"), "utf8"));
  const key = process.env.GEMINI_API_KEY || "";
  const rows = [];
  for (const a of answers) {
    const d = STORY.decisions.find((x) => x.id === a.decision);
    const out = await Tutor.reply(d, a.answer, { level: a.level }, { apiKey: key });
    rows.push({
      ...a,
      reply: out.text,
      tutorKind: out.kind,
      autoLeak: Tutor.leaks(a.decision, out.text),
      label: { gaveAway: null, errorType: null, note: null },
    });
  }
  const dir = path.join(__dirname, "runs");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, label + ".json");
  fs.writeFileSync(file, JSON.stringify({ tutorVersion: Tutor.VERSION, mode: key ? "gemini" : "offline", date: new Date().toISOString(), rows }, null, 2));
  for (const r of rows) console.log(`#${r.id} [${r.decision}/${r.type}/${r.level}] ${r.answer}\n   -> (${r.tutorKind}) ${r.reply}\n`);
  console.log("Yazıldı:", file);
}

main();
