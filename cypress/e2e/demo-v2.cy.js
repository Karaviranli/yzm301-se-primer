// v2 demo (60–90 sn): aynı sahnede (K2 · TEST) modelin iki oyuncu için iki farklı karar vermesi.
// Oyuncu 1: K1'de hemen B'ye basar, tutoru kullanmaz → K2'de p yüksek → "Dur ve düşün" + süre baskısı kalkar.
// Oyuncu 2: K1'de tutora iki kez yazar, ~20 sn düşünüp A seçer → K2'de p düşük → oyun v1 gibi akar (sayaç var).
const pause = (ms = 3500) => cy.wait(ms);

function start(level) {
  cy.visit("/");
  pause(3500);
  cy.get(`[data-cy=level-${level}]`).check(); cy.wait(400);
  cy.get("[data-cy=role-backend]").check(); cy.wait(400);
  cy.get("[data-cy=goal-test]").check(); cy.wait(400);
  cy.get("[data-cy=start]").click();
}

function showModel() {
  cy.get("[data-cy=p]").scrollIntoView({ duration: 600 });
  pause(5000);
  cy.scrollTo("top", { duration: 600 });
  pause(1500);
}

describe("Demo v2", () => {
  it("Oyuncu 1: aceleci → K2'de model müdahale eder", () => {
    start("expert");
    cy.get("[data-cy=opt-B]").click();
    pause(2000);
    cy.get("[data-cy=next]").click();
    cy.get("[data-cy=dur-dusun]").should("be.visible");
    pause(5000);
    showModel();
    cy.get("[data-cy=opt-A]").click();
    cy.get("[data-cy=derin]").scrollIntoView({ duration: 600 });
    pause(6000);
  });

  it("Oyuncu 2: düşünceli → aynı K2 sahnesinde müdahale yok", () => {
    start("expert");
    cy.get("[data-cy=tutor-input]").type("Migration geçmişine bakarım.", { delay: 30 });
    cy.get("[data-cy=tutor-send]").click();
    pause(2500);
    cy.get("[data-cy=tutor-input]").type("Kolon silinmiş mi diye sürüm farkına bakarım.", { delay: 30 });
    cy.get("[data-cy=tutor-send]").click();
    pause(14000);
    cy.get("[data-cy=opt-A]").click();
    pause(2000);
    cy.get("[data-cy=next]").click();
    cy.get("[data-cy=timer]").should("be.visible");
    cy.get("[data-cy=dur-dusun]").should("not.exist");
    pause(5000);
    showModel();
  });
});
