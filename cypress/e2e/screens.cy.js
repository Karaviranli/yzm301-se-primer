// Uygulamanın 3 ana mobil ekranının gerçek ekran görüntüleri (docs/screens/ altına kopyalanır).
describe("Ekranlar", () => {
  it("giriş, sahne, son", () => {
    cy.visit("/");
    cy.get("[data-cy=level-beginner]").check();
    cy.get("[data-cy=role-backend]").check();
    cy.get("[data-cy=goal-kvkk]").check();
    cy.screenshot("1-giris", { capture: "fullPage" });
    cy.get("[data-cy=start]").click();
    cy.screenshot("2-sahne", { capture: "fullPage" });
    ["A", "A", "A"].forEach((o) => { cy.get(`[data-cy=opt-${o}]`).click(); cy.get("[data-cy=next]").click(); });
    cy.screenshot("3-son", { capture: "fullPage" });
  });
});
