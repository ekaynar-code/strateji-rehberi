// Cloud Function URL'si — musavirlikBultenGetir ile aynı bölge/proje.
const BASE_URL = "https://europe-west1-strateji-rehberi.cloudfunctions.net";

function getApiKey(): string | undefined {
  return process.env.NEXT_PUBLIC_EKONOMI_API_KEY;
}

export interface EkonomiGosterge {
  tarih?: string;
  deger?: number;
  hata?: string;
  detay?: string;
  finalUrl?: string;
  istekUrl?: string;
}

export interface EkonomiVeri {
  politikaFaizi: EkonomiGosterge;
  usdTry: EkonomiGosterge;
  eurTry: EkonomiGosterge;
  enflasyonYillik: EkonomiGosterge;
  disTicaretDengesi: EkonomiGosterge;
  yorumlar: string[];
  guncelleme: string;
}

export function ekonomiApiBagliMi(): boolean {
  return !!getApiKey();
}

export async function ekonomiVerileriGetir(): Promise<EkonomiVeri> {
  const key = getApiKey();
  if (!key) throw new Error("Ekonomi API anahtarı tanımlı değil");

  const res = await fetch(`${BASE_URL}/apiEkonomi?key=${encodeURIComponent(key)}`);
  if (!res.ok) throw new Error(`Ekonomi API isteği başarısız: ${res.status}`);
  return res.json();
}
