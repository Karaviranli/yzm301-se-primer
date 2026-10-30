// Parite (diferansiyel test): tarayıcıdaki onnxruntime-web olasılığı (data-cy="p") ile
// Python onnxruntime kahininin tests/parite.json'daki referansı arasındaki fark < 1e-4 olmalı.
describe("Parite: onnxruntime-web ↔ Python onnxruntime", () => {
  it("5 referans girdinin hepsinde fark < 1e-4", () => {
    cy.readFile("tests/parite.json").then((kayit) => {
      kayit.referanslar.forEach((r) => {
        cy.visit(`/?parite=1&x=${r.x.join(",")}`);
        cy.get("[data-cy=p]").should(($p) => {
          const p = parseFloat($p.text());
          expect(p, r.ad).to.be.a("number").and.not.be.NaN;
          expect(Math.abs(p - r.p), `${r.ad}: |${p} - ${r.p}|`).to.be.lessThan(kayit.tolerans);
        });
      });
    });
  });

  it("Oyun içindeki p, aynı özelliklerle parite referansına eşit (K1, deneyimli)", () => {
    cy.readFile("tests/parite.json").then((kayit) => {
      const ref = kayit.referanslar[0]; // [2, 1, 0, 15, 0]
      cy.visit("/");
      cy.get("[data-cy=level-expert]").check();
      cy.get("[data-cy=role-backend]").check();
      cy.get("[data-cy=goal-mimari]").check();
      cy.get("[data-cy=start]").click();
      cy.get("[data-cy=p]").should(($p) => {
        expect(Math.abs(parseFloat($p.text()) - ref.p)).to.be.lessThan(kayit.tolerans);
      });
    });
  });
});
