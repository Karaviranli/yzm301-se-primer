// Oyun durum makinesi: profile -> scene(k1) -> outcome(k1) -> ... -> scene(k3) -> outcome(k3) -> end
(function () {
  const { STORY, ending, clock } = window.Story;
  const app = document.getElementById("app");
  const params = new URLSearchParams(location.search);
  const TIMER_SECONDS = Number(params.get("timer")) || 60; // test için ?timer=3 ile kısaltılabilir

  const LEVELS = { beginner: "Yeni başladım", mid: "Biraz deneyimim var", expert: "Deneyimliyim" };
  const ROLES = { backend: "Backend geliştirici", test: "Test mühendisi", lead: "Ekip lideri" };
  const GOALS = { mimari: "Mimari kararları öğrenmek", test: "Test alışkanlığı kazanmak", kvkk: "KVKK farkındalığı" };

  let state;
  let timerId = null;

  function reset() {
    state = { screen: "profile", profile: null, step: 0, choices: {}, timedOut: {}, tutorLog: [] };
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

  function renderProfile() {
    el(`
      <div class="eyebrow">SE Primer</div>
      <h1>${STORY.title}</h1>
      <p class="muted">Başlamadan üç soru: anlatı sana göre ayarlanacak.</p>
      <form id="profile" class="card">
        ${radioGroup("level", "1. Seviyen?", LEVELS)}
        ${radioGroup("role", "2. Bu nöbette rolün?", ROLES)}
        ${radioGroup("goal", "3. Bu oyundan hedefin?", GOALS)}
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
      btn.disabled = !(f.get("level") && f.get("role") && f.get("goal"));
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

  function renderScene() {
    const d = STORY.decisions[state.step];
    const p = state.profile;
    const focus = p.goal === d.topic ? `<span class="badge" data-cy="focus">Odak</span>` : "";
    const intro = state.step === 0
      ? `<div class="card" data-cy="intro"><p>${STORY.intro}</p><p><b>${STORY.roleIntro[p.role]}</b></p></div>` : "";
    const timer = p.level === "expert"
      ? `<p class="muted">Süre: <span class="timer" data-cy="timer">${TIMER_SECONDS}</span> sn</p>` : "";
    const autoHint = p.level === "beginner"
      ? `<div class="bubble" data-cy="auto-hint"><b>İpucu:</b> ${d.tutorQuestion}</div>` : "";
    el(`
      <div class="eyebrow">${d.label} ${focus}</div>
      <h1>${STORY.title}</h1>
      ${intro}
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
      </div>`);
    app.querySelector("[data-cy=opt-A]").onclick = () => choose("A");
    app.querySelector("[data-cy=opt-B]").onclick = () => choose("B");
    const send = app.querySelector("[data-cy=tutor-send]");
    send.onclick = async () => {
      const input = app.querySelector("[data-cy=tutor-input]");
      const answer = input.value;
      send.disabled = true;
      const out = await window.Tutor.reply(d, answer, p, { apiKey: apiKey() });
      send.disabled = false;
      state.tutorLog.push({ decision: d.id, answer, reply: out.text });
      const b = document.createElement("div");
      b.className = "bubble";
      b.setAttribute("data-cy", "tutor-reply");
      b.textContent = out.text + (out.note ? " (" + out.note + ")" : "");
      app.querySelector("[data-cy=tutor-log]").appendChild(b);
      input.value = "";
    };
    if (p.level === "expert") startTimer();
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

  function choose(opt) {
    stopTimer();
    const d = STORY.decisions[state.step];
    state.choices[d.id] = opt;
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
    el(`
      <div class="eyebrow">${d.label} · Sonuç</div>
      <h1>Seçimin: ${opt}) ${d.options[opt]}</h1>
      ${timeout}
      <div class="card what" data-cy="what"><h2>Ne oldu?</h2><p>${o.what}</p></div>
      <div class="card why" data-cy="why"><h2>Neden oldu?</h2><p>${o.why}</p></div>
      <p class="muted">Saat: <b data-cy="clock">${clock(state.choices)}</b></p>
      <button class="primary" data-cy="next">${last ? "Sonucu gör" : "Devam"}</button>`);
    app.querySelector("[data-cy=next]").onclick = () => {
      if (last) state.screen = "end";
      else { state.step += 1; state.screen = "scene"; }
      render();
    };
  }

  function renderEnd() {
    const e = ending(state.choices);
    const meta = STORY.endings[e];
    const recap = STORY.decisions.map((d) => {
      const c = state.choices[d.id];
      return `<li>${d.label.split("·")[1].trim()}: ${c}) ${d.options[c]}</li>`;
    }).join("");
    el(`
      <div class="eyebrow" data-cy="ending-title">${meta.title}</div>
      <h1 data-cy="ending">${clock(state.choices)} · ${meta.headline}</h1>
      <div class="card ${e === "A" ? "end-good" : "end-bad"}">
        <h2>Kararların</h2><ol class="recap" data-cy="recap">${recap}</ol>
      </div>
      <div class="card"><p class="muted">${e === "A"
        ? "Hizmeti geri getirdin ve kök neden analizinde hasta verisini korudun."
        : "Hizmet döndü, ama hata logu kişisel verilerle paylaşıldı. Ayakta olan sistem, güvende olan sistem demek değil."}</p></div>
      <button class="primary" data-cy="restart">Yeniden oyna</button>`);
    app.querySelector("[data-cy=restart]").onclick = () => { reset(); render(); };
  }

  function render() {
    ({ profile: renderProfile, scene: renderScene, outcome: renderOutcome, end: renderEnd })[state.screen]();
  }

  reset();
  render();
})();
