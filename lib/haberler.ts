export interface MusavirlikYazisi {
  title: string;
  link: string;
  musavirlik: string;
  tarih: string;
}

const FUNCTION_URL =
  "https://europe-west1-strateji-rehberi.cloudfunctions.net/musavirlikBultenGetir";

const ONBELLEK_SURESI_MS = 3 * 60 * 1000;
const onbellek = new Map<string, { veri: MusavirlikYazisi[]; zaman: number }>();

export async function musavirlikBultenGetir(
  kategori: "ihaleler" | "guncel",
  ulkeler: string[],
  zorlaYenile = false
): Promise<MusavirlikYazisi[]> {
  const onbellekAnahtari = `${kategori}:${ulkeler.join(",")}`;
  const onbellekteki = onbellek.get(onbellekAnahtari);
  if (!zorlaYenile && onbellekteki && Date.now() - onbellekteki.zaman < ONBELLEK_SURESI_MS) {
    return onbellekteki.veri;
  }

  const params = new URLSearchParams({ kategori, ulkeler: ulkeler.join(",") });
  const res = await fetch(`${FUNCTION_URL}?${params.toString()}`);
  if (!res.ok) throw new Error("Bülten alınamadı");

  const data = await res.json();
  if (!Array.isArray(data.items)) throw new Error("Beklenmeyen yanıt formatı");

  const sonuc: MusavirlikYazisi[] = data.items;
  onbellek.set(onbellekAnahtari, { veri: sonuc, zaman: Date.now() });
  return sonuc;
}