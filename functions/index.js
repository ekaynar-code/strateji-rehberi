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
 * o linkin hemen ardından gelen metni başlık, o linkten sonraki 400 karakter
 * içinde geçen "XX Ay YYYY SS:DD" formatındaki ilk tarihi ve "... Ticaret
 * Müşavirliği" formatındaki ilk ifadeyi müşavirlik adı olarak alıyoruz.
 */
function parseBlogPosts(html) {
  const posts = [];
  const linkRegex = /href="(\/blog\/post\/(\d+)\/)"[^>]*>([^<]*)</g;

  const gorulenIdler = new Set();
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const [, path, id, rawText] = match;
    if (gorulenIdler.has(id)) continue;

    const title = decodeHtmlEntities(rawText.trim());
    // Çok kısa veya boş metinler (görsel alt metni, buton yazısı vb.) başlık değildir.
    if (title.length < 8) continue;

    gorulenIdler.add(id);

    // Bu linkten sonraki 600 karakterlik pencerede tarih ve müşavirlik adını ara.
    const pencere = html.slice(match.index, match.index + 800);
    const tarihMatch = pencere.match(/(\d{2}\s+[A-Za-zİıÖöÜüÇçŞşĞğ]{3}\s+\d{4}\s+\d{2}:\d{2})/);
    const musavirlikMatch = pencere.match(/([A-ZİÖÜÇŞĞ][a-zA-Zİıöüçşğ]+\s+Ticaret\s+Müşavirliği)/);

    posts.push({
      title,
      link: `https://dtybs.ticaret.gov.tr${path}`,
      musavirlik: musavirlikMatch ? musavirlikMatch[1] : "",
      tarih: tarihMatch ? tarihMatch[1] : "",
    });
  }

  return posts;
}

const KATEGORILER = { ihaleler: 41, guncel: 1 };

/**
 * HTTP endpoint: ?ulkeler=Bulgaristan,Romanya&kategori=ihaleler (veya guncel)
 * ile çağrılır. Ticaret Bakanlığı Ticaret Müşavirlikleri blog'undan ilgili
 * kategorideki son yazıları çekip, başlıkta/müşavirlik adında geçen ülke adına
 * göre filtreler.
 */
exports.musavirlikBultenGetir = onRequest(
  { cors: true, region: "europe-west1", timeoutSeconds: 25 },
  async (req, res) => {
    const kategoriParam = String(req.query.kategori || "ihaleler");
    const kategoriId = KATEGORILER[kategoriParam] || KATEGORILER.ihaleler;
    const ulkelerParam = String(req.query.ulkeler || "");
    const ulkeler = ulkelerParam
      .split(",")
      .map((u) => u.trim())
      .filter(Boolean);

    try {
      const url = `https://dtybs.ticaret.gov.tr/blog/?kategori=${kategoriId}`;
      const html = await fetchHtml(url);
      let posts = parseBlogPosts(html);
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

      res.status(200).json({ items: posts.slice(0, 15), debugTotalParsed });
    } catch (err) {
      res.status(500).json({ error: "Bülten alınamadı", detail: String(err) });
    }
  }
);
