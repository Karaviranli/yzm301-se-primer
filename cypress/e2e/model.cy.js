// v2 kabul örnekleri (spec.md §8.5): model kararı oyunu değiştirir; veri toplama modu.
function profile(level = "mid", query = "") {
  cy.visit("/" + query);
  cy.get(`[data-cy=level-${level}]`).check();
  cy.get("[data-cy=role-backend]").check();
  cy.get("[data-cy=goal-mimari]").check();
}

describe("Model müdahalesi (kabul örneği 6)", () => {
  it("K1'de hızla B seçen, tutorsuz oyuncu: K2'de p ≥ 0.5, 'Dur ve düşün' açılır, derinleştirme gelir", () => {
    profile();
    cy.get("[data-cy=start]").click();
    cy.get("[data-cy=opt-B]").click();
    cy.get("[data-cy=next]").click();
    cy.get("[data-cy=prompt]").should("contain", "Düzeltme hazır");
    cy.get("[data-cy=p]").invoke("text").then(parseFloat).should("be.gte", 0.5);
    cy.get("[data-cy=dur-dusun]").should("be.visible");
    cy.get("[data-cy=opt-A]").click();
    cy.get("[data-cy=derin]").should("contain", "Derinleştirme");
  });

  it("K1'de 40 sn düşünüp 2 kez tutora yazan ve A seçen oyuncu: K2'de p < 0.5, müdahale yok", () => {
    profile();
    cy.get("[data-cy=start]").click();
    cy.get("[data-cy=tutor-input]").type("Migration geçmişine bakarım.");
    cy.get("[data-cy=tutor-send]").click();
    cy.get("[data-cy=tutor-input]").type("Şemada kolon silinmiş mi diye diff'e bakarım.");
    cy.get("[data-cy=tutor-send]").click();
    cy.get("[data-cy=tutor-reply]").should("have.length", 2);
    cy.wait(40000);
    cy.get("[data-cy=opt-A]").click();
    cy.get("[data-cy=next]").click();
    cy.get("[data-cy=prompt]").should("contain", "Düzeltme hazır");
    cy.get("[data-cy=p]").invoke("text").then(parseFloat).should("be.lt", 0.5);
    cy.get("[data-cy=dur-dusun]").should("not.exist");
  });

  it("Deneyimli oyuncuda müdahale süre baskısını kaldırır", () => {
    profile("expert");
    cy.get("[data-cy=start]").click();
    cy.get("[data-cy=timer]").should("be.visible");
    cy.get("[data-cy=opt-B]").click();
    cy.get("[data-cy=next]").click();
    cy.get("[data-cy=dur-dusun]").should("contain", "süre baskısı yok");
    cy.get("[data-cy=timer]").should("not.exist");
  });
});

describe("Veri toplama modu (kabul örneği 8)", () => {
  it("Onay olmadan başlamaz; oturum sonunda 3 satırlık, kişisel veri içermeyen CSV verir", () => {
    profile("beginner", "?toplama=1");
    cy.get("[data-cy=start]").should("be.disabled");
    cy.get("[data-cy=onay]").check();
    cy.get("[data-cy=start]").should("be.enabled").click();
    ["A", "B", "A"].forEach((o, i) => {
      cy.get(`[data-cy=opt-${o}]`).click();
      cy.get("[data-cy=next]").should("contain", i === 2 ? "Sonucu gör" : "Devam").click();
    });
    cy.get("[data-cy=csv-indir]").should("be.visible");
    cy.window().then((win) => {
      const lines = win.__primer.csv().trim().split("\n");
      expect(lines[0]).to.eq("oturum_id,kaynak,uygulama_surumu,karar_no,seviye,onceki_riskli,onceki_karar_suresi_sn,tutor_mesaj_onceki,karar_suresi_sn,tutor_mesaj_bu_karar,zaman_asimi,secim,riskli");
      expect(lines).to.have.length(4);
      lines.slice(1).forEach((l, i) => {
        const c = l.split(",");
        expect(c[1]).to.eq("gercek");
        expect(c[3]).to.eq(String(i + 1));
      });
      expect(lines.slice(1).map((l) => l.split(",")[11])).to.deep.eq(["A", "B", "A"]);
    });
  });

  it("Toplama modu kapalıyken indirme düğmesi yok", () => {
    profile();
    cy.get("[data-cy=start]").click();
    ["A", "A", "A"].forEach(() => { cy.get("[data-cy=opt-A]").click(); cy.get("[data-cy=next]").click(); });
    cy.get("[data-cy=ending-title]").should("exist");
    cy.get("[data-cy=csv-indir]").should("not.exist");
  });
});

describe("Yayılım anahtarı (RELEASE.md: Shadow → Canary → Progressive)", () => {
  const kaynak = (yayilim) => cy.intercept("GET", "**/model/kaynak.json", { url: "model/model.onnx", yayilim });

  it("Gölge modunda p hesaplanır ama oyun değişmez", () => {
    kaynak({ mod: "golge", oran: 0 });
    profile("expert");
    cy.get("[data-cy=start]").click();
    cy.get("[data-cy=opt-B]").click();
    cy.get("[data-cy=next]").click();
    cy.get("[data-cy=p]").invoke("text").then(parseFloat).should("be.gte", 0.5);
    cy.get("[data-cy=mudahale]").should("contain", "gölge modu");
    cy.get("[data-cy=dur-dusun]").should("not.exist");
    cy.get("[data-cy=timer]").should("be.visible");
  });

  it("Kanarya %0'da kimseye müdahale yok, %100'de herkese", () => {
    kaynak({ mod: "kanarya", oran: 0 });
    profile();
    cy.get("[data-cy=start]").click();
    cy.get("[data-cy=opt-B]").click();
    cy.get("[data-cy=next]").click();
    cy.get("[data-cy=p]").should("exist");
    cy.get("[data-cy=dur-dusun]").should("not.exist");

    kaynak({ mod: "kanarya", oran: 1 });
    profile();
    cy.get("[data-cy=start]").click();
    cy.get("[data-cy=opt-B]").click();
    cy.get("[data-cy=next]").click();
    cy.get("[data-cy=dur-dusun]").should("be.visible");
  });
});
