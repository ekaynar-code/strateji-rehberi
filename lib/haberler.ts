export interface HaberOgesi {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  sorguBasligi: string;
  onemliMi: boolean; // anahtar kelime eşleşmesine göre öne çıkarılsın mı
}

// Başlıkta geçtiğinde haberi "önemli/dikkat" olarak işaretleyen kelimeler.
// Bunlar iş fırsatı, mevzuat değişikliği veya kriz sinyali taşıyan terimler.
const ONEM_ANAHTAR_KELIMELERI = [
  "yönetmelik",
  "yönetmenlik",
  "mevzuat",
  "yasak",
  "gümrük",
  "vergi",
  "teşvik",
  "ihale",
  "fuar",
  "yatırım",
  "artış",
  "kriz",
  "sertifika",
  "standart",
  "regulation",
  "tariff",
  "investment",
  "exhibition",
  "certification",
];

function haberOnemliMi(title: string): boolean {
  const lower = title.toLowerCase();
  return ONEM_ANAHTAR_KELIMELERI.some((k) => lower.includes(k));
}

// Google News başlıkları genelde "Haber Başlığı - Kaynak Adı" formatında gelir.
function extractSource(title: string): string {
  const parts = title.split(" - ");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

function cleanTitle(title: string): string {
  const parts = title.split(" - ");
  return parts.length > 1 ? parts.slice(0, -1).join(" - ") : title;
}

/**
 * Belirli bir arama sorgusu için Google News RSS'ten (Türkçe, Türkiye bölgesi)
 * haberleri çeker. Google News RSS'in CORS izni olmadığı için AllOrigins proxy'si
 * üzerinden XML çekilip tarayıcının yerleşik DOMParser'ı ile ayrıştırılır.
 */
export async function haberleriGetir(sorgu: string, sorguBasligi: string): Promise<HaberOgesi[]> {
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(sorgu)}&hl=tr&gl=TR&ceid=TR:tr`;
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`;

  const res = await fetch(proxyUrl);
  if (!res.ok) throw new Error("RSS alınamadı");

  const data = await res.json();
  const xmlText: string | undefined = data?.contents;
  if (!xmlText) throw new Error("RSS içeriği boş");

  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, "text/xml");

  const parseError = xml.querySelector("parsererror");
  if (parseError) throw new Error("RSS ayrıştırılamadı");

  const items = Array.from(xml.querySelectorAll("item")).slice(0, 8);

  return items.map((item): HaberOgesi => {
    const rawTitle = item.querySelector("title")?.textContent?.trim() || "";
    const link = item.querySelector("link")?.textContent?.trim() || "";
    const pubDate = item.querySelector("pubDate")?.textContent?.trim() || "";

    return {
      title: cleanTitle(rawTitle),
      link,
      pubDate,
      source: extractSource(rawTitle),
      sorguBasligi,
      onemliMi: haberOnemliMi(rawTitle),
    };
  });
}
