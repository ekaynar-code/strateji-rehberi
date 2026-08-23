const { onRequest } = require("firebase-functions/v2/https");
const https = require("https");

function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        },
        (res) => {
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            fetchHtml(res.headers.location).then(resolve).catch(reject);
            return;
          }
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => resolve(data));
        }
      )
      .on("error", reject);
  });
}

function decodeHtmlEntities(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

/**
 * T.C. Ticaret Bakanlığı Ticaret Müşavirlikleri blog sayfasını (dtybs.ticaret.gov.tr)
 * HTML olarak ayrıştırır.
 */
function parseBlogPosts(html) {
  const posts = [];
  // Gerçek yapı: <a href="/blog/post/ID/"><h3 class="h4">Başlık...</h3></a>
  // Link ile başlık arasında img'li bir <a> bloğu daha var (görsel), o yüzden
  // doğrudan "href sonrası <h3" kalıbını arıyoruz.
  const postRegex = /href="(\/blog\/post\/(\d+)\/)">\s*<h3[^>]*>([\s\S]*?)<\/h3>/g;

  const gorulenIdler = new Set();
  let match;
  while ((match = postRegex.exec(html)) !== null) {
    const [, path, id, rawTitle] = match;
    if (gorulenIdler.has(id)) continue;
    gorulenIdler.add(id);

    const title = decodeHtmlEntities(rawTitle.replace(/<[^>]+>/g, "").trim());
    if (!title) continue;

    // Başlıktan önceki pencerede (görsel bloğu dahil) müşavirlik adı
    // genelde img alt metninde geçiyor.
    const oncekiPencere = html.slice(Math.max(0, match.index - 400), match.index);
    const musavirlikMatch = oncekiPencere.match(/alt="([^"]*Ticaret\s+Müşavirliği)"/);

    // Tarih, başlıktan sonra bir saat ikonunun yanında geçiyor — geniş bir
    // pencerede arayıp ilk "GG Ay YYYY SS:DD" kalıbını alıyoruz.
    const sonrakiPencere = html.slice(match.index, match.index + 1200);
    const tarihMatch = sonrakiPencere.match(/(\d{1,2}\s+[A-Za-zİıÖöÜüÇçŞşĞğ]{3}\s+\d{4}\s+\d{2}:\d{2})/);

    posts.push({
      title,
      link: `https://dtybs.ticaret.gov.tr${path}`,
      musavirlik: musavirlikMatch ? musavirlikMatch[1] : "",
      tarih: tarihMatch ? tarihMatch[1] : "",
      sektorleIlgili: sektorleIlgiliMi(title),
    });
  }

  return posts;
}

// Ticaret Müşavirlikleri, bulundukları ülkenin başkenti/büyük şehri adıyla
// anılıyor (örn. "Sofya Ticaret Müşavirliği" = Bulgaristan). Kullanıcı ülke
// adı girdiğinde bu haritayı kullanarak şehir bazlı müşavirlik adlarını
// doğru ülkeyle eşleştiriyoruz.
const SEHIR_ULKE_ESLEME = {
  Sofya: "Bulgaristan",
  Bükreş: "Romanya",
  Belgrad: "Sırbistan",
  Kahire: "Mısır",
  Rabat: "Fas",
  Kazablanka: "Fas",
  Lagos: "Nijerya",
  Abuja: "Nijerya",
  Riyad: "Suudi Arabistan",
  Cidde: "Suudi Arabistan",
  Dubai: "Birleşik Arap Emirlikleri",
  "Abu Dabi": "Birleşik Arap Emirlikleri",
  Kigali: "Ruanda",
  Zagrep: "Hırvatistan",
  Kito: "Ekvador",
  Nairobi: "Kenya",
  Cezayir: "Cezayir",
  Tunus: "Tunus",
  Trablus: "Libya",
  Amman: "Ürdün",
  Beyrut: "Lübnan",
  Kuveyt: "Kuveyt",
  Doha: "Katar",
  Manama: "Bahreyn",
  Maskat: "Umman",
};

function musavirlikUlkesi(musavirlikAdi) {
  const sehir = musavirlikAdi.replace(" Ticaret Müşavirliği", "").trim();
  return SEHIR_ULKE_ESLEME[sehir] || sehir;
}

// Sektörle (ahşap iç kapı, yangın kapısı, doğrama, otel/okul/işyeri projeleri)
// ilgili anahtar kelimeler — başlıkta geçtiğinde yazı "sektörle ilgili" sayılır.
const SEKTOR_ANAHTAR_KELIMELERI = [
  // Ürün / malzeme
  "kapı", "kapılar", "doğrama", "ahşap", "yangın", "cam", "cephe",
  "pencere", "mobilya", "mdf", "kereste", "panel",
  // Proje tipi
  "otel", "okul", "hastane", "konut", "villa", "rezidans", "ofis",
  "alışveriş merkezi", "avm",
  // İnşaat / sektör genel
  "inşaat", "yapı", "yüklenici", "müteahhit", "restorasyon", "renovasyon",
  "tadilat", "dekorasyon", "iç mimari",
  // Mevzuat / süreç
  "yönetmelik", "standart", "sertifika", "ihale", "teklif", "fuar",
  "ithalat", "ihracat", "gümrük",
];

function sektorleIlgiliMi(title) {
  const lower = title.toLowerCase();
  return SEKTOR_ANAHTAR_KELIMELERI.some((k) => lower.includes(k));
}

const KATEGORILER = { ihaleler: 41, guncel: 1 };

/**
 * HTTP endpoint: ?ulkeler=Bulgaristan,Romanya&kategori=ihaleler (veya guncel)
 * ile çağrılır. Ticaret Bakanlığı Ticaret Müşavirlikleri blog'undan ilgili
 * kategorideki son yazıları çekip, başlıkta/müşavirlik adında geçen ülke adına
 * göre filtreler.
 */
exports.musavirlikBultenGetir = onRequest(
  { cors: true, region: "europe-west1", timeoutSeconds: 40 },
  async (req, res) => {
    const kategoriParam = String(req.query.kategori || "ihaleler");
    const kategoriId = KATEGORILER[kategoriParam] || KATEGORILER.ihaleler;
    const ulkelerParam = String(req.query.ulkeler || "");
    const ulkeler = ulkelerParam
      .split(",")
      .map((u) => u.trim())
      .filter(Boolean);

    try {
      // Sitede sayfalama var (?page=2, 3, ...) — sadece ilk sayfa çok az yazı
      // döndürdüğü için ilk 6 sayfayı paralel çekip birleştiriyoruz.
      const SAYFA_SAYISI = 6;
      const sayfaUrlleri = Array.from({ length: SAYFA_SAYISI }, (_, i) => {
        const sayfaNo = i + 1;
        const base = `https://dtybs.ticaret.gov.tr/blog/?kategori=${kategoriId}`;
        return sayfaNo === 1 ? base : `${base}&page=${sayfaNo}`;
      });

      const htmlSayfalari = await Promise.all(sayfaUrlleri.map((u) => fetchHtml(u).catch(() => "")));
      const tumPosts = [];
      const gorulenLinkler = new Set();
      for (const html of htmlSayfalari) {
        if (!html) continue;
        for (const post of parseBlogPosts(html)) {
          if (gorulenLinkler.has(post.link)) continue;
          gorulenLinkler.add(post.link);
          tumPosts.push(post);
        }
      }
      const debugTotalParsed = tumPosts.length;

      let posts = tumPosts;
      if (ulkeler.length > 0) {
        posts = posts.filter((p) => {
          const ulke = musavirlikUlkesi(p.musavirlik);
          return ulkeler.some(
            (u) =>
              ulke.toLowerCase().includes(u.toLowerCase()) ||
              u.toLowerCase().includes(ulke.toLowerCase()) ||
              p.title.toLowerCase().includes(u.toLowerCase())
          );
        });
      }

      res.status(200).json({ items: posts.slice(0, 20), debugTotalParsed });
    } catch (err) {
      res.status(500).json({ error: "Bülten alınamadı", detail: String(err) });
    }
  }
);
