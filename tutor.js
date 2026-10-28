// Sokratik tutor: ipucu verir, cevabı (hangi seçeneğin doğru olduğunu) söylemez.
// İki mod: "offline" (kural tabanlı, anahtar gerektirmez) ve "gemini" (kullanıcının kendi API anahtarıyla).
// Her iki modda da çıktı leaks() filtresinden geçer; cevabı ele veren yanıt yerine güvenli yanıt döner.
(function (root) {
  const VERSION = "v3";

  const KB = {
    k1: {
      concepts: {
        "şema/migration": ["şema", "migration", "migrasyon", "kolon", "sütun", "tablo", "alter", "ddl"],
        "sürüm farkı": ["diff", "fark", "changelog", "sürüm notu", "commit", "değişiklik listesi", "release not"],
        "geriye uyumluluk": ["geriye uyumlu", "uyumlu", "backward", "eski sürüm okuyabilir", "geri alınabilir"],
        "kayıt/izleme": ["flyway", "liquibase", "schema_version", "migration tablosu", "migration geçmişi", "versiyon tablosu"],
      },
      probes: {
        "şema/migration": "Dün geceki sürümle birlikte veritabanında neyin değiştiğini hangi kayıtta görürsün?",
        "sürüm farkı": "v2.3 ile v2.4 arasındaki farkı nereden okuyabilirsin?",
        "geriye uyumluluk": "Eski kod, yeni şemayla karşılaşırsa ne olur? Hangi tür değişiklikler eski kodu bozar?",
        "kayıt/izleme": "Veritabanı hangi migration'ların uygulandığını nerede tutuyor olabilir?",
      },
      giveaway: [/geri\s*dön(meli|melisin|mek doğru|men doğru)/, /rollback\s*(yap(malısın|meli)|doğru)/, /\b(a|b)\s*(seçeneği|şıkkı)\s*(doğru|daha iyi|seç)/, /canlıda yama (yapmalısın|doğru)/, /doğru cevap/],
    },
    k2: {
      concepts: {
        "kritik akış": ["randevu al", "randevu oluştur", "iptal", "kritik akış", "ana akış", "mutlu yol", "happy path", "giriş ekranı"],
        "duman testi": ["duman", "smoke", "sanity", "kısa test", "hızlı test"],
        "otomasyon": ["otomatik", "e2e", "uçtan uca", "cypress", "ci", "pipeline", "test suite", "regresyon"],
        "süre/risk": ["dakika", "süre", "risk", "maliyet", "ikinci kesinti", "geri alma"],
      },
      probes: {
        "kritik akış": "300 hastanın şu an yapamadığı tek işlem hangisi?",
        "duman testi": "Tam test yerine birkaç dakikada neyi doğrulayabilirsin?",
        "otomasyon": "Elinde hazır otomatik bir test var mı, yoksa elle mi bakacaksın?",
        "süre/risk": "Test için harcayacağın birkaç dakika ile ikinci bir kesintinin maliyetini nasıl kıyaslarsın?",
      },
      giveaway: [/test (koşmalısın|etmelisin|yapmalısın)/, /hemen yayına al(malısın|)\b/, /\b(a|b)\s*(seçeneği|şıkkı)\s*(doğru|daha iyi|seç)/, /doğru cevap/],
    },
    k3: {
      concepts: {
        "kimlik bilgisi": ["ad", "isim", "soyad", "tc", "t.c", "kimlik", "tckn", "telefon", "adres", "doğum"],
        "maskeleme": ["maske", "maskele", "anonim", "takma ad", "pseudonim", "hash", "kırp", "gizle", "yıldız"],
        "en az veri": ["gerek yok", "gerekmez", "ihtiyaç yok", "ölçülü", "en az", "minimum", "amaçla sınırlı", "sadece hata"],
        "erişim/KVKK": ["kvkk", "yetki", "erişim", "özel nitelikli", "sağlık verisi", "ihlal", "rıza", "6698"],
      },
      probes: {
        "kimlik bilgisi": "Logdaki hangi alanlar tek başına ya da birlikte bir hastayı tanımlar?",
        "maskeleme": "Hatayı yeniden üretmek için o alanların gerçek değerine mi, yoksa sadece formatına mı ihtiyaç var?",
        "en az veri": "Kök nedeni bulmak için hangi alanlar gerçekten şart?",
        "erişim/KVKK": "Bu logu görecek 14 kişinin hepsinin bu verilere erişim yetkisi var mı?",
      },
      giveaway: [/maskele(melisin|meli)\b/, /olduğu gibi (gönder|at)(melisin|)/, /\b(a|b)\s*(seçeneği|şıkkı)\s*(doğru|daha iyi|seç)/, /doğru cevap/],
    },
  };

  // v3: soru sırasından bağımsız ısrar kalıpları ("doğru seçenek hangisi", "evet ya da hayır de", "X miyim Y miyim").
  const INSIST = new RegExp([
    "(cevab|cevap|hangisi|hangisini|söyle|direkt|doğrudan|şık|seçenek).*(söyle|ver|doğru|seç|ne|mi)",
    "^(a mı b mi|a mı|b mi)\\b",
    "lütfen.*söyle",
    "doğru (seçenek|şık|olan)",
    "(direkt|doğrudan) (yaz|söyle|ver)",
    "evet (ya da|veya) hayır",
    "\\S+ miyim .*\\S+ miyim",
  ].join("|"));

  function norm(s) {
    return String(s || "").toLocaleLowerCase("tr").replace(/\s+/g, " ").trim();
  }

  // v2: kelime başından eşleştir ("ad" artık "kadar" içinde eşleşmez).
  const LETTERS = "a-zçğıöşü0-9";
  function has(text, w) {
    const safe = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp("(^|[^" + LETTERS + "])" + safe).test(text);
  }

  function matchConcepts(text, kb) {
    const hits = [];
    for (const [name, words] of Object.entries(kb.concepts)) {
      if (words.some((w) => has(text, w))) hits.push(name);
    }
    return hits;
  }

  // v2: kavram geçse bile riski küçümseyen ya da ödünleşimi kaçıran cevap övülmez, sorgulanır.
  const RED_FLAGS = [
    { re: /(bakmaya|düşünmeye|test etmeye|uğraşmaya|kontrol etmeye) gerek yok/, probe: null },
    { re: /sorun olmaz|her zaman çalışır|vakit kaybı|zaman kaybı|boş ver/, probe: null },
    { re: /\d+\s*saat/, probe: "süre/risk" },
  ];

  function leaks(decisionId, reply) {
    const r = norm(reply);
    return KB[decisionId].giveaway.some((re) => re.test(r));
  }

  function offline(decisionId, answer, profile) {
    const kb = KB[decisionId];
    const t = norm(answer);
    const beginner = profile && profile.level === "beginner";
    const missing = (hits) => Object.keys(kb.concepts).find((c) => !hits.includes(c));

    if (!t) return { kind: "empty", text: "Bir cümleyle düşünceni yaz; birlikte bakalım." };

    if (INSIST.test(t)) {
      const first = Object.keys(kb.probes)[0];
      return {
        kind: "insist",
        text: "Hangi seçeneği seçeceğini ben söylemeyeceğim; karar senin. Ama şu soruya cevap verirsen seçim kendiliğinden netleşir: " + kb.probes[first],
      };
    }

    const flag = RED_FLAGS.find((f) => f.re.test(t));
    if (flag) {
      const key = flag.probe && kb.probes[flag.probe] ? flag.probe : Object.keys(kb.probes)[0];
      return {
        kind: "challenge",
        text: "Bu varsayımı sınayalım. " + kb.probes[key] + (beginner ? " (İpucu: " + key + " kavramına bak.)" : ""),
      };
    }

    const hits = matchConcepts(t, kb);
    if (hits.length >= 2) {
      return {
        kind: "strong",
        text: "Güçlü bir gerekçe: " + hits.join(" ve ") + " üzerine düşünüyorsun. Şimdi iki seçeneği bu ölçüte göre yan yana koy: hangisi bu riski daha iyi yönetiyor?",
      };
    }
    if (hits.length === 1) {
      const m = missing(hits);
      return {
        kind: "partial",
        text: "“" + hits[0] + "” iyi bir başlangıç. Bir adım daha: " + kb.probes[m] + (beginner ? " (İpucu: " + m + " kavramına bak.)" : ""),
      };
    }
    return {
      kind: "redirect",
      text: "Buna farklı bir açıdan bakalım. " + kb.probes[Object.keys(kb.probes)[0]] + (beginner ? " (İpucu: " + Object.keys(kb.concepts)[0] + " kavramına bak.)" : ""),
    };
  }

  const SYSTEM_PROMPT =
    "Sen bir yazılım mühendisliği oyununda Sokratik bir tutorsun. Oyuncu bir hastane yazılımı krizinde iki seçenek arasında karar veriyor. " +
    "KURALLAR: (1) Hangi seçeneğin doğru olduğunu ASLA söyleme, seçenek harfi (A/B) önerme, 'şunu yapmalısın' deme. " +
    "(2) Oyuncunun cevabındaki doğru kavramı kısaca adlandır, eksik olanı tek bir soruyla sor. " +
    "(3) Oyuncu cevabı isterse kibarca reddet ve düşünmesini sağlayacak bir soru sor. " +
    "(4) En fazla 2 cümle, Türkçe. (5) Gerçek hasta verisi isteme veya üretme.";

  async function gemini(apiKey, decision, answer, profile) {
    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + encodeURIComponent(apiKey);
    const user =
      "Karar: " + decision.prompt + " Seçenekler: A) " + decision.options.A + " B) " + decision.options.B +
      ". Tutor sorusu: " + decision.tutorQuestion + " Oyuncu seviyesi: " + (profile && profile.level) +
      ". Oyuncunun cevabı: " + answer;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
      }),
    });
    if (!res.ok) throw new Error("Gemini HTTP " + res.status);
    const j = await res.json();
    return j.candidates[0].content.parts.map((p) => p.text).join("").trim();
  }

  async function reply(decision, answer, profile, opts) {
    let out;
    if (opts && opts.apiKey) {
      try {
        out = { kind: "gemini", text: await gemini(opts.apiKey, decision, answer, profile) };
      } catch (e) {
        out = offline(decision.id, answer, profile);
        out.note = "Gemini'ye ulaşılamadı, çevrimdışı tutor kullanıldı.";
      }
    } else {
      out = offline(decision.id, answer, profile);
    }
    if (leaks(decision.id, out.text)) {
      out = { kind: "filtered", text: "Cevabı ben vermeyeceğim. " + decision.tutorQuestion };
    }
    return out;
  }

  const api = { VERSION, KB, offline, reply, leaks, SYSTEM_PROMPT };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Tutor = api;
})(typeof window !== "undefined" ? window : globalThis);
