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
 * HTML olarak ayrıştırır. Tam HTML yapısını (class isimleri vb.) bilmediğimiz için
 * toleranslı bir yaklaşım kullanıyoruz: her "/blog/post/<id>/" linkini bulup,
 * o linkin hemen ardından gelen metni başlık, o linkten sonraki pencere içinde
 * geçen tarihi ve "... Ticaret Müşavirliği" ifadesini müşavirlik adı olarak alıyoruz.
 */
function parseBlogPosts(html, kategoriEtiketi) {
  const posts = [];
  const linkRegex = /href="(\/blog\/post\/(\d+)\/)"[^>]*>([^<]*)</g;

  const gorulenIdler = new Set();
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const [, path, id, rawText] = match;
    if (gorulenIdler.has(id)) continue;

    const title = decodeHtmlEntities(rawText.trim());
    if (title.length < 8) continue;

    gorulenIdler.add(id);

    const pencere = html.slice(match.index, match.index + 800);
    const tarihMatch = pencere.match(/(\d{2}\s+[A-Za-zİıÖöÜüÇçŞşĞğ]{3}\s+\d{4}\s+\d{2}:\d{2})/);
    const musavirlikMatch = pencere.match(/([A-ZİÖÜÇŞĞ][a-zA-Zİıöüçşğ]+\s+Ticaret\s+Müşavirliği)/);

    posts.push({
      title,
      link: `https://dtybs.ticaret.gov.tr${path}`,
      musavirlik: musavirlikMatch ? musavirlikMatch[1] : "",
      tarih: tarihMatch ? tarihMatch[1] : "",
      kategori: kategoriEtiketi,
    });
  }

  return posts;
}

// Sitedeki tüm ilgili kategoriler — hepsini birlikte çekip birleştiriyoruz.
const KATEGORILER = [
  { id: 41, etiket: "İhale" },
  { id: 1, etiket: "Gelişme" },
  { id: 21, etiket: "Mevzuat" },
  { id: 42, etiket: "Fırsat" },
  { id: 22, etiket: "Öneri" },
];

// "21 Ağu 2026 14:14" formatındaki tarihi sıralanabilir bir değere çevirir.
const AY_KISALTMALARI = {
  Oca: 0, Şub: 1, Mar: 2, Nis: 3, May: 4, Haz: 5,
  Tem: 6, Ağu: 7, Eyl: 8, Eki: 9, Kas: 10, Ara: 11,
};
function tarihiSayiyaDon(tarihStr) {
  const m = tarihStr.match(/(\d{2})\s+([A-Za-zİıÖöÜüÇçŞşĞğ]{3})\s+(\d{4})\s+(\d{2}):(\d{2})/);
  if (!m) return 0;
  const [, gun, ay, yil, saat, dakika] = m;
  const ayIndex = AY_KISALTMALARI[ay] ?? 0;
  return new Date(Number(yil), ayIndex, Number(gun), Number(saat), Number(dakika)).getTime();
}

/**
 * HTTP endpoint: ?ulkeler=Bulgaristan,Romanya ile çağrılır. Ticaret Bakanlığı
 * Ticaret Müşavirlikleri blog'undaki TÜM kategorilerden (ihale, gelişme,
 * mevzuat, fırsat, öneri) yazıları çekip, başlıkta/müşavirlik adında geçen
 * ülke adına göre filtreler, en güncelden en eskiye sıralar.
 */
exports.musavirlikBultenGetir = onRequest(
  { cors: true, region: "europe-west1", timeoutSeconds: 30 },
  async (req, res) => {
    const ulkelerParam = String(req.query.ulkeler || "");
    const ulkeler = ulkelerParam
      .split(",")
      .map((u) => u.trim())
      .filter(Boolean);

    try {
      const tumSayfalar = await Promise.all(
        KATEGORILER.map(async (k) => {
          const url = `https://dtybs.ticaret.gov.tr/blog/?kategori=${k.id}`;
          const html = await fetchHtml(url);
          return parseBlogPosts(html, k.etiket);
        })
      );

      let posts = tumSayfalar.flat();
      const debugTotalParsed = posts.length;

      if (ulkeler.length > 0) {
        posts = posts.filter((p) =>
          ulkeler.some(
            (u) =>
              p.musavirlik.toLowerCase().includes(u.toLowerCase()) ||
              p.title.toLowerCase().includes(u.toLowerCase())
          )
        );
      }

      posts.sort((a, b) => tarihiSayiyaDon(b.tarih) - tarihiSayiyaDon(a.tarih));

      res.status(200).json({ items: posts.slice(0, 25), debugTotalParsed });
    } catch (err) {
      res.status(500).json({ error: "Bülten alınamadı", detail: String(err) });
    }
  }
);