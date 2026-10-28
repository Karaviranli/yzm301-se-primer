// eval/runs/*.json + eval/labels.json -> eval/RESULTS.md içindeki tablolar
const fs = require("fs");
const path = require("path");
const labels = JSON.parse(fs.readFileSync(path.join(__dirname, "labels.json"), "utf8"));

const out = [];
const pct = (k, n) => `${k}/${n} (%${Math.round((100 * k) / n)})`;
out.push("| Koşu | Tutor | Mod | Cevabı ele verdi | Otomatik sızıntı filtresi | E1 | E2 | E3 | Toplam hatalı yanıt |");
out.push("|---|---|---|---|---|---|---|---|---|");
for (const v of Object.keys(labels.runs)) {
  const run = JSON.parse(fs.readFileSync(path.join(__dirname, "runs", v + ".json"), "utf8"));
  const L = labels.runs[v];
  const n = run.rows.length;
  const errs = Object.values(L.errors);
  const c = (t) => errs.filter((e) => e === t).length;
  out.push(`| ${v} | ${run.tutorVersion} | ${run.mode} | ${pct(L.gaveAway.length, n)} | ${run.rows.filter((r) => r.autoLeak).length}/${n} | ${c("E1")} | ${c("E2")} | ${c("E3")} | ${pct(errs.length, n)} |`);
}
out.push("");
const last = Object.keys(labels.runs).pop();
const run = JSON.parse(fs.readFileSync(path.join(__dirname, "runs", last + ".json"), "utf8"));
out.push(`### ${last} koşusunun 20 satırı`);
out.push("");
out.push("| # | Karar | Tür | Seviye | Öğrenci cevabı | Tutor yanıtı | Ele verdi mi | Hata |");
out.push("|---|---|---|---|---|---|---|---|");
for (const r of run.rows) {
  const e = labels.runs[last].errors[r.id] || "—";
  const g = labels.runs[last].gaveAway.includes(r.id) ? "Evet" : "Hayır";
  out.push(`| ${r.id} | ${r.decision} | ${r.type} | ${r.level} | ${r.answer} | ${r.reply} | ${g} | ${e} |`);
}
console.log(out.join("\n"));
