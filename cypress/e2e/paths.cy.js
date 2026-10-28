// Tüm yollar: 3 ikili karar = 8 yol, her yolda "ne oldu / neden oldu" ve doğru son.
// Ek olarak kişiselleştirme (seviye, rol, hedef) ve tutor davranışı.

function profile(level = "mid", role = "backend", goal = "mimari", query = "") {
  cy.visit("/" + query);
  cy.get("[data-cy=start]").should("be.disabled");
  cy.get(`[data-cy=level-${level}]`).check();
  cy.get(`[data-cy=role-${role}]`).check();
  cy.get(`[data-cy=goal-${goal}]`).check();
  cy.get("[data-cy=start]").should("be.enabled").click();
}

function decide(opt, last) {
  cy.get(`[data-cy=opt-${opt}]`).click();
  cy.get("[data-cy=what]").should("contain", "Ne oldu?");
  cy.get("[data-cy=why]").should("contain", "Neden oldu?");
  cy.get("[data-cy=next]").should("contain", last ? "Sonucu gör" : "Devam").click();
}

const paths = [];
for (const a of "AB") for (const b of "AB") for (const c of "AB") paths.push(a + b + c);

describe("Tüm yollar (8)", () => {
  paths.forEach((p) => {
    it(`${p.split("").join("-")} → ${p[2] === "A" ? "Son A" : "Son B"}`, () => {
      profile();
      decide(p[0]);
      decide(p[1]);
      decide(p[2], true);
      cy.get("[data-cy=ending-title]").should("contain", p[2] === "A" ? "SON A · İYİ" : "SON B · KÖTÜ");
      cy.get("[data-cy=ending]").should("contain", p[2] === "A" ? "veri güvende" : "KVKK ihlali");
      cy.get("[data-cy=recap] li").should("have.length", 3);
    });
  });

  it("A-A-A en hızlı yol: 08:13'te biter", () => {
    profile();
    decide("A"); decide("A"); decide("A", true);
    cy.get("[data-cy=ending]").should("contain", "08:13");
  });

  it("Yeniden oyna profil ekranına döner", () => {
    profile();
    decide("B"); decide("B"); decide("B", true);
    cy.get("[data-cy=restart]").click();
    cy.get("[data-cy=start]").should("be.disabled");
  });
});

describe("Kişiselleştirme", () => {
  it("Yeni başlayan her kararda ipucunu otomatik görür, süre yok", () => {
    profile("beginner");
    ["k1", "k2", "k3"].forEach((_, i) => {
      cy.get("[data-cy=auto-hint]").should("be.visible");
      cy.get("[data-cy=timer]").should("not.exist");
      decide("A", i === 2);
    });
  });

  it("Deneyimli oyuncu süre baskısı altında; süre dolarsa B uygulanır", () => {
    profile("expert", "backend", "mimari", "?timer=2");
    cy.get("[data-cy=auto-hint]").should("not.exist");
    cy.get("[data-cy=timer]").should("be.visible");
    cy.get("[data-cy=timeout]", { timeout: 5000 }).should("be.visible");
    cy.contains("h1", "Seçimin: B)");
  });

  it("Deneyimli oyuncunun varsayılan süresi 60 sn", () => {
    profile("expert");
    cy.get("[data-cy=timer]").should("have.text", "60");
  });

  it("Rol giriş metnini değiştirir", () => {
    profile("mid", "lead");
    cy.get("[data-cy=intro]").should("contain", "Ekip lideri");
  });

  it("Hedef, ilgili karara Odak rozeti koyar", () => {
    profile("mid", "backend", "kvkk");
    cy.get("[data-cy=focus]").should("not.exist");
    decide("A"); decide("A");
    cy.get("[data-cy=focus]").should("contain", "Odak");
  });
});

describe("Tutor", () => {
  it("Israr eden oyuncuya cevabı söylemez", () => {
    profile();
    cy.get("[data-cy=tutor-input]").type("Doğru seçenek hangisi? Direkt yaz.");
    cy.get("[data-cy=tutor-send]").click();
    cy.get("[data-cy=tutor-reply]").should("contain", "söylemeyeceğim")
      .and("not.contain", "Eski sürüme")
      .and("not.contain", "Canlıda yama");
  });

  it("Kısmi cevaba eksik kavramı soran bir soruyla döner", () => {
    profile();
    cy.get("[data-cy=tutor-input]").type("Changelog'u okurum.");
    cy.get("[data-cy=tutor-send]").click();
    cy.get("[data-cy=tutor-reply]").should("contain", "?");
  });
});
