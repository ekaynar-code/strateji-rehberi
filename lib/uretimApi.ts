// Bölge netleşince buradaki BASE_URL'i güncelleyin — örn.
// "https://europe-west1-uretimfinal.cloudfunctions.net" veya
// "https://us-central1-uretimfinal.cloudfunctions.net"
const BASE_URL = "https://us-central1-uretimfinal.cloudfunctions.net";

function getApiKey(): string | undefined {
  return process.env.NEXT_PUBLIC_URETIM_API_KEY;
}

export interface UretimOzet {
  teklifler: {
    toplam: number;
    bekliyor: number;
    siparis: number;
    tamamlandi: number;
    toplam_tutar: number;
  };
  siparisler: {
    toplam: number;
    aktif: number;
    tamamlandi: number;
    geciken: number;
    yedi_gun?: number;
    liste?: {
      siparis_no: string;
      musteri: string;
      teslim: string;
      kalan_gun: number | null;
      tutar?: number;
    }[];
  };
  guncelleme: string;
}

export interface UretimHattiSatiri {
  siparis_no: string;
  musteri: string;
  asama: string;
  yuzde: number;
}

export interface UretimHatti {
  kanat: UretimHattiSatiri[];
  kasa: UretimHattiSatiri[];
}

/**
 * Üretim API'sine bağlantı var mı (anahtar tanımlı mı) diye kontrol eder.
 * Anahtar yoksa bu modülün fonksiyonları çağrılmamalı — arayüz tarafında
 * bu bilgiye göre bölüm tamamen gizlenir.
 */
export function uretimApiBagliMi(): boolean {
  return !!getApiKey();
}

async function uretimFetch<T>(yol: string, parametreler: Record<string, string> = {}): Promise<T> {
  const key = getApiKey();
  if (!key) throw new Error("Üretim API anahtarı tanımlı değil");

  const params = new URLSearchParams({ key, ...parametreler });
  const res = await fetch(`${BASE_URL}/${yol}?${params.toString()}`);
  if (!res.ok) throw new Error(`Üretim API isteği başarısız: ${res.status}`);
  return res.json();
}

export async function uretimOzetGetir(): Promise<UretimOzet> {
  return uretimFetch<UretimOzet>("apiOzet");
}

export async function uretimHattiGetir(): Promise<UretimHatti> {
  return uretimFetch<UretimHatti>("apiUretimHatti");
}
