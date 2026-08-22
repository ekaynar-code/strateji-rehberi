const { onRequest } = require("firebase-functions/v2/https");
const https = require("https");

// Başlıkta geçtiğinde haberi "önemli/dikkat" olarak işaretleyen kelimeler.
const ONEM_ANAHTAR_KELIMELERI = [
  "yönetmelik", "yönetmenlik", "mevzuat", "yasak", "gümrük", "vergi",
  "teşvik", "ihale", "fuar", "yatırım", "artış", "kriz", "sertifika",
  "standart", "regulation", "tariff", "investment", "exhibition", "certification",
];

function haberOnemliMi(title) {
  const lower = title.toLowerCase();
  return ONEM_ANAHTAR_KELIMELERI.some((k) => lower.includes(k));
}

function extractSource(title) {
  const parts = title.split(" - ");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

function cleanTitle(title) {
  const parts = title.split(" - ");
  return parts.length > 1 ? parts.slice(0, -1).join(" - ") : title;
}

function decodeHtmlEntities(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

/** Basit regex tabanlı RSS <item> ayrıştırıcı — harici kütüphane gerektirmez. */
function parseRssItems(xml, limit = 8) {
  const items = [];
  const itemBlocks = xml.split("<item>").slice(1, limit + 1);

  for (const block of itemBlocks) {
    const titleMatch = block.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/s);
    const linkMatch = block.match(/<link>(.*?)<\/link>/s);
    const pubDateMatch = block.match(/<pubDate>(.*?)<\/pubDate>/s);

    const rawTitle = decodeHtmlEntities((titleMatch?.[1] || "").trim());
    const link = (linkMatch?.[1] || "").trim();
    const pubDate = (pubDateMatch?.[1] || "").trim();

    if (!rawTitle) continue;

    items.push({
      title: cleanTitle(rawTitle),
      link,
      pubDate,
      source: extractSource(rawTitle),
      onemliMi: haberOnemliMi(rawTitle),
    });
  }

  return items;
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Encoding": "identity",
            "Accept-Language": "tr-TR,tr;q=0.9",
          },
        },
        (res) => {
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            // Google News bazen yönlendirme yapabilir, takip edelim.
            fetchUrl(res.headers.location).then(resolve).catch(reject);
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

/**
 * HTTP endpoint: ?q=arama+terimi ile çağrılır, o terimle Google News RSS'ini
 * sunucu tarafında çekip JSON olarak döner. Tarayıcıdan çağrıldığında CORS
 * sorunu olmaz çünkü istek sunucudan sunucuya gidiyor.
 */
exports.haberleriGetir = onRequest(
  { cors: true, region: "europe-west1", timeoutSeconds: 20 },
  async (req, res) => {
    const sorgu = req.query.q;
    if (!sorgu || typeof sorgu !== "string") {
      res.status(400).json({ error: "q parametresi gerekli" });
      return;
    }

    try {
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(
        sorgu
      )}&hl=tr&gl=TR&ceid=TR:tr`;
      const xml = await fetchUrl(rssUrl);
      const items = parseRssItems(xml, 8);

      if (items.length === 0) {
        // Teşhis için: hiç haber bulunamadıysa ham yanıtın başını da dönelim.
        res.status(200).json({ items, debugRawStart: xml.slice(0, 300) });
        return;
      }

      res.status(200).json({ items });
    } catch (err) {
      res.status(500).json({ error: "RSS alınamadı", detail: String(err) });
    }
  }
);
