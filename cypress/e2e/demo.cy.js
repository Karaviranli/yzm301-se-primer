// ~60 sn demo: iki tam oynanış (Son A ve Son B) + tutor, okunabilir hızda.
const pause = () => cy.wait(2200);

function start(level, role, goal) {
  cy.visit("/");
  pause();
  cy.get(`[data-cy=level-${level}]`).check(); cy.wait(600);
  cy.get(`[data-cy=role-${role}]`).check(); cy.wait(600);
  cy.get(`[data-cy=goal-${goal}]`).check(); cy.wait(600);
  cy.get("[data-cy=start]").click();
  pause();
}

function decide(opt) {
  cy.get(`[data-cy=opt-${opt}]`).click();
  pause();
  cy.get("[data-cy=next]").click();
  cy.wait(1500);
}

describe("Demo", () => {
  it("Oynanış 1: yeni başlayan, tutor ile, Son A", () => {
    start("beginner", "backend", "mimari");
    cy.get("[data-cy=tutor-input]").type("Cevabı söyle, A mı B mi?", { delay: 40 });
    cy.get("[data-cy=tutor-send]").click();
    pause(); pause();
    cy.get("[data-cy=tutor-input]").type("Migration geçmişine ve sürüm farkına bakarım.", { delay: 40 });
    cy.get("[data-cy=tutor-send]").click();
    pause(); pause();
    decide("A");
    decide("A");
    decide("A");
    pause(); pause();
    cy.get("[data-cy=ending-title]").should("contain", "SON A");
  });

  it("Oynanış 2: deneyimli, süre baskısı, Son B", () => {
    start("expert", "lead", "kvkk");
    decide("B");
    decide("B");
    decide("B");
    pause(); pause();
    cy.get("[data-cy=ending-title]").should("contain", "SON B");
  });
});
