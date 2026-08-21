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

// Her proxy denemesine makul bir zaman aşımı koyuyoruz — yanıt vermeyen bir
// proxy'de sonsuza kadar beklemek yerine hızlıca bir sonrakine geçilir.
const PROXY_TIMEOUT_MS = 6000;

async function fetchWithTimeout(url: string, timeoutMs = PROXY_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// Birden fazla ücretsiz CORS proxy servisi tanımlıyoruz; biri geçici olarak
// çöktüğünde/yavaş kaldığında diğerine otomatik geçilir. Her fonksiyon,
// verilen RSS URL'sinden ham XML metnini döndürür.
const PROXY_STRATEJILERI: ((rssUrl: string) => Promise<string>)[] = [
  async (rssUrl) => {
    const res = await fetchWithTimeout(`https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`);
    if (!res.ok) throw new Error("allorigins get başarısız");
    const data = await res.json();
    if (!data?.contents) throw new Error("allorigins get boş içerik");
    return data.contents as string;
  },
  async (rssUrl) => {
    const res = await fetchWithTimeout(`https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`);
    if (!res.ok) throw new Error("allorigins raw başarısız");
    return await res.text();
  },
  async (rssUrl) => {
    const res = await fetchWithTimeout(`https://corsproxy.io/?url=${encodeURIComponent(rssUrl)}`);
    if (!res.ok) throw new Error("corsproxy.io başarısız");
    return await res.text();
  },
  async (rssUrl) => {
    const res = await fetchWithTimeout(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(rssUrl)}`);
    if (!res.ok) throw new Error("codetabs başarısız");
    return await res.text();
  },
];

/**
 * Belirli bir arama sorgusu için Google News RSS'ten (Türkçe, Türkiye bölgesi)
 * haberleri çeker. Google News RSS'in CORS izni olmadığı için birkaç farklı
 * ücretsiz proxy servisi sırayla denenir — biri çökerse/yavaş kalırsa diğerine geçilir.
 * Aynı sorgu kısa süre içinde tekrar istenirse (örn. Genel Bakış ve Piyasa Nabzı
 * sayfaları aynı anda aynı konuyu çekiyorsa) önbellekten döner, tekrar ağa gitmez.
 */
const ONBELLEK_SURESI_MS = 3 * 60 * 1000; // 3 dakika
const onbellek = new Map<string, { veri: HaberOgesi[]; zaman: number }>();

export async function haberleriGetir(
  sorgu: string,
  sorguBasligi: string,
  zorlaYenile = false
): Promise<HaberOgesi[]> {
  const onbellekAnahtari = sorgu;
  const onbellekteki = onbellek.get(onbellekAnahtari);
  if (!zorlaYenile && onbellekteki && Date.now() - onbellekteki.zaman < ONBELLEK_SURESI_MS) {
    return onbellekteki.veri;
  }

  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(sorgu)}&hl=tr&gl=TR&ceid=TR:tr`;

  let sonHata: unknown = null;

  for (const proxyDene of PROXY_STRATEJILERI) {
    try {
      const xmlText = await proxyDene(rssUrl);
      const items = parseXmlItems(xmlText);
      const sonuc = items.map((item): HaberOgesi => ({
        title: cleanTitle(item.title),
        link: item.link,
        pubDate: item.pubDate,
        source: extractSource(item.title),
        sorguBasligi,
        onemliMi: haberOnemliMi(item.title),
      }));
      onbellek.set(onbellekAnahtari, { veri: sonuc, zaman: Date.now() });
      return sonuc;
    } catch (err) {
      sonHata = err;
      // Bu proxy başarısız oldu, sıradakini dene.
      continue;
    }
  }

  throw sonHata instanceof Error ? sonHata : new Error("Tüm RSS kaynakları başarısız oldu");
}
