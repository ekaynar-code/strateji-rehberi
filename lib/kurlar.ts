export interface KurVeri {
  usdTry: number | null;
  eurTry: number | null;
}

/**
 * Güncel USD/TRY ve EUR/TRY kurlarını çeker. Ücretsiz, anahtarsız bir servis
 * kullanır (open.er-api.com). Herhangi bir para birimi tutarını TRY'ye çevirmek
 * için kullanılabilir.
 */
export async function kurlariGetir(): Promise<KurVeri> {
  const res = await fetch("https://open.er-api.com/v6/latest/USD");
  if (!res.ok) throw new Error("Kur verisi alınamadı");

  const data = await res.json();
  const usdTry: number | undefined = data?.rates?.TRY;
  const usdEur: number | undefined = data?.rates?.EUR;

  if (!usdTry || !usdEur) throw new Error("Kur verisi eksik");

  const eurTry = usdTry / usdEur;
  return { usdTry, eurTry };
}

/**
 * Verilen tutarı ve para birimini TRY'ye çevirir. TRY ise doğrudan döner.
 */
export function tryyeCevir(
  tutar: number,
  paraBirimi: "TRY" | "USD" | "EUR",
  kur: KurVeri
): number | null {
  if (paraBirimi === "TRY") return tutar;
  if (paraBirimi === "USD") return kur.usdTry !== null ? tutar * kur.usdTry : null;
  if (paraBirimi === "EUR") return kur.eurTry !== null ? tutar * kur.eurTry : null;
  return null;
}
