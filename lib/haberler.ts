export interface HaberOgesi {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  sorguBasligi: string;
  onemliMi: boolean; // anahtar kelime eşleşmesine göre öne çıkarılsın mı
}

// Cloud Function'ın URL'si. Bölge europe-west1, proje ID'si strateji-rehberi
// olduğu için Firebase'in standart HTTP function adres formatı kullanılıyor.
const FUNCTION_URL =
  "https://europe-west1-strateji-rehberi.cloudfunctions.net/haberleriGetir";

const ONBELLEK_SURESI_MS = 3 * 60 * 1000; // 3 dakika
const onbellek = new Map<string, { veri: HaberOgesi[]; zaman: number }>();

/**
 * Belirli bir arama sorgusu için haberleri, Firebase Cloud Function üzerinden
 * (sunucu tarafında) çeker. Sunucudan sunucuya istek olduğu için CORS sorunu
 * yaşanmaz — üçüncü parti proxy servislerine bağımlılık ortadan kalkar.
 * Aynı sorgu kısa süre içinde tekrar istenirse önbellekten döner.
 */
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

  const res = await fetch(`${FUNCTION_URL}?q=${encodeURIComponent(sorgu)}`);
  if (!res.ok) throw new Error("Haberler alınamadı");

  const data = await res.json();
  if (!Array.isArray(data.items)) throw new Error("Beklenmeyen yanıt formatı");

  const sonuc: HaberOgesi[] = data.items.map(
    (item: { title: string; link: string; pubDate: string; source: string; onemliMi: boolean }) => ({
      ...item,
      sorguBasligi,
    })
  );

  onbellek.set(onbellekAnahtari, { veri: sonuc, zaman: Date.now() });
  return sonuc;
}
