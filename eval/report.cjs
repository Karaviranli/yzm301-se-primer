// eval/runs/*.json + eval/labels.json -> eval/RESULTS.md içindeki tablolar
// Kullanım: node eval/report.cjs <grup>   (grup: offline | gemini)
const fs = require("fs");
const path = require("path");
const labels = JSON.parse(fs.readFileSync(path.join(__dirname, "labels.json"), "utf8"));
const group = process.argv[2] || "offline";
const codes = labels.groups[group];
const runs = Object.keys(labels.runs).filter((v) => labels.runs[v].group === group);

const out = [];
const pct = (k, n) => `${k}/${n} (%${Math.round((100 * k) / n)})`;
const load = (v) => JSON.parse(fs.readFileSync(path.join(__dirname, "runs", v + ".json"), "utf8"));

out.push(`| Koşu | Tutor | Mod | Cevabı açıkça ele verdi | Otomatik sızıntı filtresi | ${codes.join(" | ")} | Toplam hatalı yanıt |`);
out.push(`|---|---|---|---|---|${codes.map(() => "---|").join("")}---|`);
for (const v of runs) {
  const run = load(v);
  const L = labels.runs[v];
  const n = run.rows.length;
  const errs = Object.values(L.errors);
  const c = (t) => errs.filter((e) => e === t).length;
  const leak = run.rows.filter((r) => r.autoLeak).length;
  const leakCol = group === "offline" ? `${leak}/${n}` : "—";
  out.push(`| ${v} | ${run.tutorVersion} | ${run.mode} | ${pct(L.gaveAway.length, n)} | ${leakCol} | ${codes.map(c).join(" | ")} | ${pct(errs.length, n)} |`);
}
out.push("");
const last = runs[runs.length - 1];
const run = load(last);
out.push(`### ${last} koşusunun 20 satırı`);
out.push("");
out.push("| # | Karar | Tür | Seviye | Öğrenci cevabı | Tutor yanıtı | Ele verdi mi | Hata |");
out.push("|---|---|---|---|---|---|---|---|");
for (const r of run.rows) {
  const e = labels.runs[last].errors[r.id] || "—";
  const g = labels.runs[last].gaveAway.includes(r.id) ? "Evet" : "Hayır";
  const reply = r.reply.replace(/\|/g, "/").replace(/\n/g, " ");
  out.push(`| ${r.id} | ${r.decision} | ${r.type} | ${r.level} | ${r.answer} | ${reply} | ${g} | ${e} |`);
}
console.log(out.join("\n"));
