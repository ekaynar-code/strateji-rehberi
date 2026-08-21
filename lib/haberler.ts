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

function parseXmlItems(xmlText: string): { title: string; link: string; pubDate: string }[] {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, "text/xml");

  if (xml.querySelector("parsererror")) throw new Error("RSS ayrıştırılamadı");

  const items = Array.from(xml.querySelectorAll("item")).slice(0, 8);
  return items.map((item) => ({
    title: item.querySelector("title")?.textContent?.trim() || "",
    link: item.querySelector("link")?.textContent?.trim() || "",
    pubDate: item.querySelector("pubDate")?.textContent?.trim() || "",
  }));
}

// Birden fazla ücretsiz CORS proxy servisi tanımlıyoruz; biri geçici olarak
// çöktüğünde/erişilemez olduğunda diğerine otomatik geçilir. Her fonksiyon,
// verilen RSS URL'sinden ham XML metnini döndürür.
const PROXY_STRATEJILERI: ((rssUrl: string) => Promise<string>)[] = [
  async (rssUrl) => {
    const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`);
    if (!res.ok) throw new Error("allorigins get başarısız");
    const data = await res.json();
    if (!data?.contents) throw new Error("allorigins get boş içerik");
    return data.contents as string;
  },
  async (rssUrl) => {
    const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`);
    if (!res.ok) throw new Error("allorigins raw başarısız");
    return await res.text();
  },
  async (rssUrl) => {
    const res = await fetch(`https://corsproxy.io/?url=${encodeURIComponent(rssUrl)}`);
    if (!res.ok) throw new Error("corsproxy.io başarısız");
    return await res.text();
  },
  async (rssUrl) => {
    const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(rssUrl)}`);
    if (!res.ok) throw new Error("codetabs başarısız");
    return await res.text();
  },
];

/**
 * Belirli bir arama sorgusu için Google News RSS'ten (Türkçe, Türkiye bölgesi)
 * haberleri çeker. Google News RSS'in CORS izni olmadığı için birkaç farklı
 * ücretsiz proxy servisi sırayla denenir — biri çökerse diğerine geçilir.
 */
export async function haberleriGetir(sorgu: string, sorguBasligi: string): Promise<HaberOgesi[]> {
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(sorgu)}&hl=tr&gl=TR&ceid=TR:tr`;

  let sonHata: unknown = null;

  for (const proxyDene of PROXY_STRATEJILERI) {
    try {
      const xmlText = await proxyDene(rssUrl);
      const items = parseXmlItems(xmlText);
      return items.map((item): HaberOgesi => ({
        title: cleanTitle(item.title),
        link: item.link,
        pubDate: item.pubDate,
        source: extractSource(item.title),
        sorguBasligi,
        onemliMi: haberOnemliMi(item.title),
      }));
    } catch (err) {
      sonHata = err;
      // Bu proxy başarısız oldu, sıradakini dene.
      continue;
    }
  }

  throw sonHata instanceof Error ? sonHata : new Error("Tüm RSS kaynakları başarısız oldu");
}
