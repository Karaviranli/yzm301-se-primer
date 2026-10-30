// Senaryo verisi: kurgusal "Yeşilvadi Devlet Hastanesi" (hayali), sentetik isimler.
// Oyun akışı bir durum makinesidir: intro -> profile -> K1 -> K2 -> K3 -> end(A|B).
(function (root) {
  const STORY = {
    title: "08:00, randevu sistemi çöktü. Nöbetçi sensin.",
    intro:
      "Yeşilvadi Devlet Hastanesi (kurgusal). Dün gece randevu sisteminin yeni sürümü (v2.4) yayına alındı. " +
      "Sabah 08:00: randevu ekranı hata veriyor, bekleme salonunda 300 hasta var.",
    roleIntro: {
      backend: "Backend nöbetçisi sensin; sunuculara ve veritabanına erişimin var.",
      test: "Test mühendisi olarak nöbettesin; CI hattı ve test ortamı senin sorumluluğunda.",
      lead: "Ekip lideri olarak nöbettesin; kararı sen veriyorsun, ekip seni bekliyor.",
    },
    decisions: [
      {
        id: "k1",
        topic: "mimari",
        label: "KARAR 1 · MİMARİ",
        prompt: "Hata v2.4 ile başladı. Ne yaparsın?",
        options: {
          A: "Eski sürüme (v2.3) geri dön",
          B: "Canlıda yama yap",
        },
        outcome: {
          A: {
            what: "Geri dönüş 6 dakikada tamamlandı; randevu ekranı açıldı.",
            why: "v2.4'ün veritabanı değişikliği yalnızca yeni bir kolon ekliyordu (geriye uyumlu migration). Eski sürüm bu kolonu yok sayıp çalışabildi; bu yüzden geri dönüş güvenliydi.",
            minutes: 6,
          },
          B: {
            what: "Canlı yama 19 dakika sürdü, servis iki kez yeniden başlatıldı; bekleyen hasta sayısı 300'den 420'ye çıktı.",
            why: "Canlı ortamda hata ayıklamak, bilinen-iyi bir sürüme dönmekten yavaştır ve her deneme kullanıcıyı etkiler. Geri dönüş seçeneği varken önce hizmeti ayağa kaldırmak, sonra kök nedeni aramak daha güvenlidir.",
            minutes: 19,
          },
        },
        tutorQuestion:
          "Geri dönmeden önce veritabanı şemasının değişip değişmediğini nasıl anlarsın?",
        derin:
          "Derinleştirme: Geri dönüşün güvenli olup olmadığını belirleyen şey kodun değil verinin durumudur. Kolon eklemek (genişletme) eski kodu bozmaz; kolon silmek ya da yeniden adlandırmak bozar. Bu yüzden ekipler 'genişlet → taşı → daralt' (expand/contract) adımlarıyla migration yazar: her adım tek başına geri alınabilir kalır.",
      },
      {
        id: "k2",
        topic: "test",
        label: "KARAR 2 · TEST",
        prompt: "Düzeltme hazır. Yayına almadan önce?",
        options: {
          A: "Önce kısa test koş",
          B: "Hemen yayına al",
        },
        outcome: {
          A: {
            what: "3 dakikalık duman testi (randevu al / iptal et / listele) yeşil geçti; yayın sorunsuz.",
            why: "Kritik kullanıcı akışlarını kapsayan kısa bir test, birkaç dakikaya mal olur ama yeni bir kesintiyi yayından önce yakalar.",
            minutes: 3,
          },
          B: {
            what: "Yayına aldın; ilk 5 dakika randevu iptal ekranı 500 hatası verdi ve tekrar düzeltme gerekti.",
            why: "Test edilmemiş düzeltme, aynı sabah ikinci bir hata riskini doğrudan kullanıcıya taşır. Kesinti sırasında acele etmek, test adımını atlamanın gerekçesi değildir.",
            minutes: 12,
          },
        },
        tutorQuestion:
          "Yayına almadan önce hangi kullanıcı akışının kesinlikle çalıştığından emin olmak istersin ve bunu kaç dakikada kontrol edebilirsin?",
        derin:
          "Derinleştirme: Duman testi tam bir regresyon testi değildir; amacı 'sistem en temel işini yapıyor mu?' sorusunu dakikalar içinde yanıtlamaktır. Kriz anında test süresi ile ikinci bir kesintinin maliyeti tartılır: 3 dakikalık test, 12 dakikalık yeni bir arızadan ucuzdur. Testi atlamak süre kazandırmaz, riski kullanıcıya devreder.",
      },
      {
        id: "k3",
        topic: "kvkk",
        label: "KARAR 3 · KVKK",
        prompt:
          "Kök neden analizi için hata logunu ekiple paylaşacaksın. Logda hasta adı ve T.C. kimlik numarası var.",
        options: {
          A: "Kişisel verileri maskele, sonra paylaş",
          B: "Logu ekibe olduğu gibi gönder",
        },
        outcome: {
          A: {
            what: "Ad ve kimlik numarası maskelendi (ör. A*** Y***, 1234*******); ekip hatayı yine de buldu.",
            why: "Hata ayıklamak için hastanın kim olduğunu bilmek gerekmez. 6698 sayılı KVKK'nın ölçülülük ilkesi, amaç için gereken en az veriyi işlemeyi ister.",
            minutes: 4,
          },
          B: {
            what: "Log, içindeki hasta adları ve kimlik numaralarıyla 14 kişilik sohbet kanalına düştü.",
            why: "Sağlık verisi KVKK'da özel nitelikli kişisel veridir. Amaç için gerekmeyen kişilere açılması bir veri ihlalidir ve bildirim yükümlülüğü doğurabilir.",
            minutes: 1,
          },
        },
        tutorQuestion:
          "Bu logdaki hangi alanlar bir kişiyi tanımlanabilir kılar ve hatayı bulmak için bunlara gerçekten ihtiyaç var mı?",
        derin:
          "Derinleştirme: KVKK'nın 4. maddesi kişisel verinin 'amaçla bağlantılı, sınırlı ve ölçülü' işlenmesini ister. Hata ayıklamanın amacı hatayı bulmaktır; hastanın kim olduğu bu amaca hizmet etmez. Maskeleme, takma ad (pseudonymization) ve en az veri ilkesi tam da bu yüzden vardır: veri işlenebilir ama kişi tanınmaz.",
      },
    ],
    endings: {
      A: { title: "SON A · İYİ", headline: "Sistem ayakta, veri güvende" },
      B: { title: "SON B · KÖTÜ", headline: "Sistem ayakta ama KVKK ihlali" },
    },
  };

  // Son, KVKK kararına göre belirlenir; süre tüm kararların toplamıdır.
  function ending(choices) {
    return choices.k3 === "A" ? "A" : "B";
  }

  function clock(choices) {
    let m = 0;
    for (const d of STORY.decisions) if (choices[d.id]) m += d.outcome[choices[d.id]].minutes;
    const t = 8 * 60 + m;
    return String(Math.floor(t / 60)).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0");
  }

  const api = { STORY, ending, clock };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Story = api;
})(typeof window !== "undefined" ? window : globalThis);
