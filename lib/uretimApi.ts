// Apps Script Web App URL'si — uretimfinal projesindeki tüm üretim/sipariş/
// arıza verisi artık bu tek adresten, ?action=... parametresiyle geliyor.
const BASE_URL =
  "https://script.google.com/macros/s/AKfycbyEA4vkYbqlCMoFIR39JEMgMZGiXmr5Lxy9YVHKZN6d3x02DwPUbNdJdJIS7g_EFvK_Ig/exec";

function getApiKey(): string | undefined {
  return process.env.NEXT_PUBLIC_URETIM_API_KEY;
}

export interface UretimOzet {
  teklifler?: {
    toplam: number;
    bekliyor: number;
    siparis: number;
    tamamlandi: number;
    toplam_tutar: number;
  };
  siparisler?: {
    toplam: number;
    uretimde: number;
    bekleyen: number;
    tamamlandi: number;
    geciken: number;
    sorun_var: number;
    liste?: {
      siparis_no: string;
      musteri: string;
      durum: string;
      teslim: string;
      kalan_gun: number | null;
      tutar?: number;
      alinan_odeme?: number;
      kalan_bakiye?: number;
      para_birimi?: "TRY" | "USD" | "EUR";
    }[];
  };
  sorunlar?: {
    acik: number;
    hat_ariza: number;
    siparis_sorun: number;
    liste: Sorun[];
  };
  guncelleme: string;
}

export interface UretimHattiSatiri {
  siparis_no: string;
  musteri: string;
}

export interface UretimHattiAsama {
  asama: string;
  index: number;
  arizali: boolean;
  siparisler: UretimHattiSatiri[];
}

export interface UretimHatti {
  kanat: UretimHattiAsama[];
  kasa: UretimHattiAsama[];
}

export interface Sorun {
  id: string;
  tip: "hat_ariza" | "siparis_sorun" | string;
  durum: "acik" | "cozuldu" | string;
  hatAdi?: string;
  hatTip?: "kanat" | "kasa" | string;
  siparis_no?: string;
  musteri?: string;
  aciklama?: string;
  cozumNotu?: string;
  cozumTarihi?: string;
  olusturmaTarihi?: string;
}

/**
 * Üretim API'sine bağlantı var mı (anahtar tanımlı mı) diye kontrol eder.
 * Anahtar yoksa bu modülün fonksiyonları çağrılmamalı — arayüz tarafında
 * bu bilgiye göre bölüm tamamen gizlenir.
 */
export function uretimApiBagliMi(): boolean {
  return !!getApiKey();
}

async function uretimFetch<T>(action: string): Promise<T> {
  const key = getApiKey();
  if (!key) throw new Error("Üretim API anahtarı tanımlı değil");

  const params = new URLSearchParams({ key, action });
  const res = await fetch(`${BASE_URL}?${params.toString()}`);
  if (!res.ok) throw new Error(`Üretim API isteği başarısız: ${res.status}`);
  return res.json();
}

export async function uretimOzetGetir(): Promise<UretimOzet> {
  return uretimFetch<UretimOzet>("ozet");
}

export async function uretimHattiGetir(): Promise<UretimHatti> {
  return uretimFetch<UretimHatti>("hat");
}

export async function sorunlarGetir(): Promise<Sorun[]> {
  return uretimFetch<Sorun[]>("sorunlar");
}

/**
 * Bir sorunu "çözüldü" olarak işaretler. Apps Script tarafı bu işlemi
 * POST isteğiyle, gövdede { key, action: "sorun_guncelle", id, cozumNotu }
 * bekliyor.
 */
export async function sorunCozuldu(id: string, cozumNotu: string): Promise<void> {
  const key = getApiKey();
  if (!key) throw new Error("Üretim API anahtarı tanımlı değil");

  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ key, action: "sorun_guncelle", id, cozumNotu }),
  });
  if (!res.ok) throw new Error(`Sorun güncelleme isteği başarısız: ${res.status}`);
  const data = await res.json();
  if (!data.basari) throw new Error(data.hata || "Sorun güncellenemedi");
}
