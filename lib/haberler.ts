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

/**
 * Belirli bir arama sorgusu için Google News RSS'ten (Türkçe, Türkiye bölgesi)
 * haberleri çeker ve rss2json üzerinden JSON'a çevirir.
 */
export async function haberleriGetir(sorgu: string, sorguBasligi: string): Promise<HaberOgesi[]> {
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(sorgu)}&hl=tr&gl=TR&ceid=TR:tr`;
  const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&count=8`;

  const res = await fetch(proxyUrl);
  if (!res.ok) throw new Error("RSS alınamadı");

  const data = await res.json();
  if (data.status !== "ok" || !Array.isArray(data.items)) {
    throw new Error("RSS verisi geçersiz");
  }

  return data.items.map(
    (item: { title: string; link: string; pubDate: string }): HaberOgesi => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      source: extractSource(item.title),
      sorguBasligi,
      onemliMi: haberOnemliMi(item.title),
    })
  );
}

// Google News başlıkları genelde "Haber Başlığı - Kaynak Adı" formatında gelir.
function extractSource(title: string): string {
  const parts = title.split(" - ");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}
