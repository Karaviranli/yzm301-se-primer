// Oyun durum makinesi: profile -> scene(k1) -> outcome(k1) -> ... -> scene(k3) -> outcome(k3) -> end
// v2: her sahne açılırken uyum modeli (model.js) riskli seçim olasılığını p hesaplar; p >= eşik ise
// "Dur ve düşün" müdahalesi açılır (spec.md §8.2). ?parite=1&x=... yalnızca p'yi gösterir (Cypress parite testi).
// ?toplama=1 veri toplama modudur: onaylı oyuncu kendi karar satırlarını CSV olarak indirir (spec.md §8.4).
(function () {
  const { STORY, ending, clock } = window.Story;
  const app = document.getElementById("app");
  const params = new URLSearchParams(location.search);
  const TIMER_SECONDS = Number(params.get("timer")) || 60; // test için ?timer=3 ile kısaltılabilir
  const COLLECT = params.get("toplama") === "1";
  const APP_VERSION = "2.0.0";
  const K1_DEFAULT_DURATION = 15; // spec.md §8.1: K1'de önceki karar yok, eğitim verisinin medyanı atanır

  const LEVELS = { beginner: "Yeni başladım", mid: "Biraz deneyimim var", expert: "Deneyimliyim" };
  const ROLES = { backend: "Backend geliştirici", test: "Test mühendisi", lead: "Ekip lideri" };
  const GOALS = { mimari: "Mimari kararları öğrenmek", test: "Test alışkanlığı kazanmak", kvkk: "KVKK farkındalığı" };
  const CSV_COLUMNS = [
    "oturum_id", "kaynak", "uygulama_surumu", "karar_no", "seviye", "onceki_riskli",
    "onceki_karar_suresi_sn", "tutor_mesaj_onceki", "karar_suresi_sn", "tutor_mesaj_bu_karar",
    "zaman_asimi", "secim", "riskli",
  ];

  let state;
  let timerId = null;

  function reset() {
    state = {
      screen: "profile", profile: null, step: 0, choices: {}, timedOut: {}, tutorLog: [],
      sessionId: crypto.randomUUID(), sceneStart: 0, scene: null,
      history: { riskyCount: 0, prevDurationSec: K1_DEFAULT_DURATION, tutorCount: 0 },
      tutorThisDecision: 0, rows: [],
    };
  }

  function apiKey() {
    try { return localStorage.getItem("geminiKey") || ""; } catch (e) { return ""; }
  }

  function el(html) {
    app.innerHTML = html;
    window.scrollTo(0, 0);
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  function radioGroup(name, legend, opts) {
    return `<fieldset data-cy="q-${name}"><legend>${legend}</legend>` +
      Object.entries(opts).map(([v, label]) =>
        `<label class="choice"><input type="radio" name="${name}" value="${v}" data-cy="${name}-${v}"> ${label}</label>`).join("") +
      `</fieldset>`;
  }

  function modelPanel(p, intervene, shadow) {
    const value = p === null ? "—" : p.toFixed(6);
    const note = p === null ? "model yüklenemedi; v1 kuralları geçerli"
      : intervene ? "müdahale: Dur ve düşün"
      : shadow ? "gölge modu: yalnızca ölçülüyor" : "müdahale yok";
    return `<p class="muted model-panel">Uyum modeli · P(riskli seçim) = <b data-cy="p">${value}</b> · <span data-cy="mudahale">${note}</span></p>`;
  }

  function renderProfile() {
    const consent = COLLECT
      ? `<label class="choice consent"><input type="checkbox" name="onay" data-cy="onay"> Veri toplama modundayım. Kararlarımın süresi, seçimi ve tutora kaç mesaj yazdığım (metin değil) ders projesi için kaydedilsin; ad, e-posta, cihaz ya da konum kaydedilmez. Dosyayı oyun sonunda kendim indiririm.</label>`
      : "";
    el(`
      <div class="eyebrow">SE Primer v2${COLLECT ? " · Veri toplama modu" : ""}</div>
      <h1>${STORY.title}</h1>
      <p class="muted">Başlamadan üç soru: anlatı sana göre ayarlanacak.</p>
      <form id="profile" class="card">
        ${radioGroup("level", "1. Seviyen?", LEVELS)}
        ${radioGroup("role", "2. Bu nöbette rolün?", ROLES)}
        ${radioGroup("goal", "3. Bu oyundan hedefin?", GOALS)}
        ${consent}
        <button class="primary" type="submit" data-cy="start" disabled>Nöbete başla</button>
      </form>
      <details class="card"><summary>Gelişmiş: Gemini tutor (isteğe bağlı)</summary>
        <p class="muted">Kendi Google AI Studio API anahtarını girersen tutor Gemini ile cevap verir. Anahtar yalnızca bu tarayıcıda saklanır. Boş bırakırsan çevrimdışı tutor çalışır.</p>
        <input id="key" type="password" placeholder="AIza..." value="${esc(apiKey())}" autocomplete="off">
      </details>`);
    const form = document.getElementById("profile");
    const btn = form.querySelector("[data-cy=start]");
    form.addEventListener("change", () => {
      const f = new FormData(form);
      btn.disabled = !(f.get("level") && f.get("role") && f.get("goal") && (!COLLECT || f.get("onay")));
    });
    document.getElementById("key").addEventListener("change", (e) => {
      try { localStorage.setItem("geminiKey", e.target.value.trim()); } catch (err) { /* depolama kapalı */ }
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const f = new FormData(form);
      state.profile = { level: f.get("level"), role: f.get("role"), goal: f.get("goal") };
      state.screen = "scene";
      render();
    });
  }

  async function renderScene() {
    const step = state.step;
    const d = STORY.decisions[step];
    const p = state.profile;
    const x = window.PrimerModel.features(p, step + 1, state.history);
    let prob = null;
    let threshold = 0.5;
    let enabled = true;
    try {
      prob = await window.PrimerModel.predict(x);
      const loaded = await window.PrimerModel.load();
      threshold = loaded.config.karar_esigi;
      enabled = window.PrimerModel.interventionEnabled(loaded.rollout, state.sessionId);
    } catch (e) {
      console.warn("Uyum modeli çalışmadı:", e);
    }
    if (state.step !== step || state.screen !== "scene") return; // bu arada ekran değişti
    const intervene = enabled && prob !== null && prob >= threshold;
    state.scene = { x, prob, intervene, shadow: !enabled };

    const focus = p.goal === d.topic ? `<span class="badge" data-cy="focus">Odak</span>` : "";
    const intro = step === 0
      ? `<div class="card" data-cy="intro"><p>${STORY.intro}</p><p><b>${STORY.roleIntro[p.role]}</b></p></div>` : "";
    const timed = p.level === "expert" && !intervene;
    const timer = timed
      ? `<p class="muted">Süre: <span class="timer" data-cy="timer">${TIMER_SECONDS}</span> sn</p>` : "";
    const autoHint = p.level === "beginner"
      ? `<div class="bubble" data-cy="auto-hint"><b>İpucu:</b> ${d.tutorQuestion}</div>` : "";
    const pause = intervene
      ? `<div class="card pause" data-cy="dur-dusun"><h2>Dur ve düşün</h2><p>Seçmeden önce kendine sor: ${d.tutorQuestion}</p>${p.level === "expert" ? `<p class="muted">Bu sahnede süre baskısı yok.</p>` : ""}</div>`
      : "";
    el(`
      <div class="eyebrow">${d.label} ${focus}</div>
      <h1>${STORY.title}</h1>
      ${intro}
      ${pause}
      <div class="card">
        <h2 data-cy="prompt">${d.prompt}</h2>
        ${timer}
        <button class="opt" data-cy="opt-A"><b>A)</b> ${d.options.A}</button>
        <button class="opt" data-cy="opt-B"><b>B)</b> ${d.options.B}</button>
      </div>
      <div class="card tutor" data-cy="tutor">
        <h2>Tutor</h2>
        <p class="muted">Takıldıysan düşünceni yaz. Tutor cevabı söylemez, soru sorar.</p>
        ${autoHint}
        <textarea data-cy="tutor-input" placeholder="Ne düşünüyorsun?"></textarea>
        <button data-cy="tutor-send" style="margin-top:8px">Tutor'a sor</button>
        <div data-cy="tutor-log"></div>
      </div>
      ${modelPanel(prob, intervene, !enabled)}`);
    state.sceneStart = performance.now();
    state.tutorThisDecision = 0;
    app.querySelector("[data-cy=opt-A]").onclick = () => choose("A");
    app.querySelector("[data-cy=opt-B]").onclick = () => choose("B");
    const send = app.querySelector("[data-cy=tutor-send]");
    send.onclick = async () => {
      const input = app.querySelector("[data-cy=tutor-input]");
      const answer = input.value;
      send.disabled = true;
      const out = await window.Tutor.reply(d, answer, p, { apiKey: apiKey() });
      send.disabled = false;
      state.tutorThisDecision += 1;
      state.tutorLog.push({ decision: d.id, answer, reply: out.text });
      const b = document.createElement("div");
      b.className = "bubble";
      b.setAttribute("data-cy", "tutor-reply");
      b.textContent = out.text + (out.note ? " (" + out.note + ")" : "");
      app.querySelector("[data-cy=tutor-log]").appendChild(b);
      input.value = "";
    };
    if (timed) startTimer();
  }

  function startTimer() {
    let left = TIMER_SECONDS;
    stopTimer();
    timerId = setInterval(() => {
      left -= 1;
      const t = app.querySelector("[data-cy=timer]");
      if (t) t.textContent = left;
      if (left <= 0) {
        state.timedOut[STORY.decisions[state.step].id] = true;
        choose("B");
      }
    }, 1000);
  }

  function stopTimer() {
    if (timerId) clearInterval(timerId);
    timerId = null;
  }

  function recordDecision(d, opt) {
    const duration = Math.min(Math.max((performance.now() - state.sceneStart) / 1000, 1), 120);
    const [level, decisionNo, riskyBefore, prevDuration, tutorBefore] = state.scene.x;
    const risky = opt === "B" ? 1 : 0;
    state.rows.push({
      oturum_id: state.sessionId, kaynak: "gercek", uygulama_surumu: APP_VERSION,
      karar_no: decisionNo, seviye: level, onceki_riskli: riskyBefore,
      onceki_karar_suresi_sn: Number(prevDuration.toFixed(2)), tutor_mesaj_onceki: tutorBefore,
      karar_suresi_sn: Number(duration.toFixed(2)), tutor_mesaj_bu_karar: state.tutorThisDecision,
      zaman_asimi: state.timedOut[d.id] ? 1 : 0, secim: opt, riskli: risky,
    });
    state.history = {
      riskyCount: state.history.riskyCount + risky,
      prevDurationSec: duration,
      tutorCount: state.history.tutorCount + state.tutorThisDecision,
    };
  }

  function choose(opt) {
    stopTimer();
    const d = STORY.decisions[state.step];
    state.choices[d.id] = opt;
    recordDecision(d, opt);
    state.screen = "outcome";
    render();
  }

  function renderOutcome() {
    const d = STORY.decisions[state.step];
    const opt = state.choices[d.id];
    const o = d.outcome[opt];
    const last = state.step === STORY.decisions.length - 1;
    const timeout = state.timedOut[d.id]
      ? `<p class="muted" data-cy="timeout">Süre doldu; karar veremediğin için ekip varsayılanı uyguladı (B).</p>` : "";
    const deep = state.scene && state.scene.intervene ? `<p data-cy="derin">${d.derin}</p>` : "";
    el(`
      <div class="eyebrow">${d.label} · Sonuç</div>
      <h1>Seçimin: ${opt}) ${d.options[opt]}</h1>
      ${timeout}
      <div class="card what" data-cy="what"><h2>Ne oldu?</h2><p>${o.what}</p></div>
      <div class="card why" data-cy="why"><h2>Neden oldu?</h2><p>${o.why}</p>${deep}</div>
      <p class="muted">Saat: <b data-cy="clock">${clock(state.choices)}</b></p>
      <button class="primary" data-cy="next">${last ? "Sonucu gör" : "Devam"}</button>`);
    const next = app.querySelector("[data-cy=next]");
    next.onclick = () => {
      next.disabled = true; // model hesaplanırken çift tıklama adımı atlatmasın
      if (last) state.screen = "end";
      else { state.step += 1; state.screen = "scene"; }
      render();
    };
  }

  function csvText(rows) {
    const lines = [CSV_COLUMNS.join(",")];
    for (const r of rows) lines.push(CSV_COLUMNS.map((c) => r[c]).join(","));
    return lines.join("\n") + "\n";
  }

  function downloadCsv() {
    const blob = new Blob([csvText(state.rows)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `primer-oturum-${state.sessionId.slice(0, 8)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function renderEnd() {
    const e = ending(state.choices);
    const meta = STORY.endings[e];
    const recap = STORY.decisions.map((d) => {
      const c = state.choices[d.id];
      return `<li>${d.label.split("·")[1].trim()}: ${c}) ${d.options[c]}</li>`;
    }).join("");
    const collect = COLLECT
      ? `<div class="card"><p>Teşekkürler. Bu oturumun ${state.rows.length} karar satırını indirip proje sahibine gönderebilirsin. Dosyada adın, metinlerin ya da cihaz bilgin yok.</p><button data-cy="csv-indir">Verimi indir (CSV)</button></div>`
      : "";
    el(`
      <div class="eyebrow" data-cy="ending-title">${meta.title}</div>
      <h1 data-cy="ending">${clock(state.choices)} · ${meta.headline}</h1>
      <div class="card ${e === "A" ? "end-good" : "end-bad"}">
        <h2>Kararların</h2><ol class="recap" data-cy="recap">${recap}</ol>
      </div>
      <div class="card"><p class="muted">${e === "A"
        ? "Hizmeti geri getirdin ve kök neden analizinde hasta verisini korudun."
        : "Hizmet döndü, ama hata logu kişisel verilerle paylaşıldı. Ayakta olan sistem, güvende olan sistem demek değil."}</p></div>
      ${collect}
      <button class="primary" data-cy="restart">Yeniden oyna</button>`);
    if (COLLECT) app.querySelector("[data-cy=csv-indir]").onclick = downloadCsv;
    app.querySelector("[data-cy=restart]").onclick = () => { reset(); render(); };
  }

  async function renderParity() {
    const x = (params.get("x") || "").split(",").map(Number);
    el(`<div class="eyebrow">Parite modu</div><h1>Uyum modeli</h1><p class="muted">Girdi: <code data-cy="x">${esc(x.join(", "))}</code></p><p class="muted">Hesaplanıyor…</p>`);
    let text = "—";
    try { text = (await window.PrimerModel.predict(x)).toFixed(8); } catch (e) { console.warn(e); }
    el(`<div class="eyebrow">Parite modu</div><h1>Uyum modeli</h1><p class="muted">Girdi: <code data-cy="x">${esc(x.join(", "))}</code></p><p>P(riskli seçim) = <b data-cy="p">${text}</b></p>`);
  }

  function render() {
    ({ profile: renderProfile, scene: renderScene, outcome: renderOutcome, end: renderEnd })[state.screen]();
  }

  window.__primer = { rows: () => state.rows, csv: () => csvText(state.rows) };
  window.PrimerModel.load().catch((e) => console.warn("Uyum modeli yüklenemedi:", e));
  reset();
  if (params.get("parite") === "1") renderParity();
  else render();
})();
