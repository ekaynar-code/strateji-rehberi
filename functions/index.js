const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const https = require("https");

const CURRENTS_API_KEY = defineSecret("CURRENTS_API_KEY");

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

function fetchJson(url, headers) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers }, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
          } catch {
            reject(new Error("JSON ayrıştırılamadı: " + data.slice(0, 200)));
          }
        });
      })
      .on("error", reject);
  });
}

/**
 * HTTP endpoint: ?q=arama+terimi ile çağrılır, o terimle Currents API'yi
 * (https://currentsapi.services) sunucu tarafında çekip JSON olarak döner.
 * Tarayıcıdan çağrıldığında CORS sorunu olmaz çünkü istek sunucudan
 * sunucuya gidiyor; ayrıca API anahtarı hiçbir zaman tarayıcıya sızmaz.
 */
exports.haberleriGetir = onRequest(
  { cors: true, region: "europe-west1", timeoutSeconds: 20, secrets: [CURRENTS_API_KEY] },
  async (req, res) => {
    const sorgu = req.query.q;
    if (!sorgu || typeof sorgu !== "string") {
      res.status(400).json({ error: "q parametresi gerekli" });
      return;
    }

    const apiKey = CURRENTS_API_KEY.value();
    if (!apiKey) {
      res.status(500).json({ error: "CURRENTS_API_KEY tanımlı değil" });
      return;
    }

    try {
      const url = `https://api.currentsapi.services/v1/search?keywords=${encodeURIComponent(
        sorgu
      )}&page_size=8`;

      const { statusCode, body } = await fetchJson(url, { Authorization: `Bearer ${apiKey}` });

      if (statusCode !== 200 || body.status !== "ok" || !Array.isArray(body.news)) {
        res.status(200).json({ items: [], debugRaw: body, debugStatusCode: statusCode });
        return;
      }

      const items = body.news.map((n) => ({
        title: n.title,
        link: n.url,
        pubDate: n.published,
        source: (() => {
          try {
            return new URL(n.url).hostname.replace(/^www\./, "");
          } catch {
            return "";
          }
        })(),
        onemliMi: haberOnemliMi(n.title),
      }));

      if (items.length === 0) {
        // Teşhis için: sorgu başarılı ama sonuç boşsa ham yanıtı da dönelim.
        res.status(200).json({ items, debugRaw: body, debugStatusCode: statusCode });
        return;
      }

      res.status(200).json({ items });
    } catch (err) {
      res.status(500).json({ error: "Haberler alınamadı", detail: String(err) });
    }
  }
);
