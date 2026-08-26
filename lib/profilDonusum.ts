import { collection, getDocs, writeBatch } from "firebase/firestore";
import { db } from "./firebase";

const ESKI_YENI_ESLEME: Record<string, string> = {
  distributor: "araci_sirket",
  fitout: "insaat_firmasi",
  diger: "mimarlik_firmasi",
};

export interface DonusumSonucu {
  toplamTarandi: number;
  guncellenen: number;
  detaylar: { firmaAdi: string; eskiProfil: string; yeniProfil: string }[];
}

/**
 * Bir kerelik araç: Firestore'daki tüm "distributors" kayıtlarını tarar,
 * eski profil değerlerini (distributor, fitout, diger) yeni değerlere
 * (araci_sirket, insaat_firmasi, mimarlik_firmasi) çevirir. Zaten yeni
 * değerlerden birine sahip kayıtlara (uretici, insaat_firmasi,
 * mimarlik_firmasi, araci_sirket) dokunmaz.
 */
export async function eskiProfilleriDonustur(): Promise<DonusumSonucu> {
  const snap = await getDocs(collection(db, "distributors"));
  const detaylar: DonusumSonucu["detaylar"] = [];

  let batch = writeBatch(db);
  let batchSayaci = 0;

  for (const belge of snap.docs) {
    const veri = belge.data();
    const eskiProfil = veri.profil as string;

    if (eskiProfil in ESKI_YENI_ESLEME) {
      const yeniProfil = ESKI_YENI_ESLEME[eskiProfil];
      batch.update(belge.ref, { profil: yeniProfil });
      detaylar.push({ firmaAdi: veri.firmaAdi || "(isimsiz)", eskiProfil, yeniProfil });
      batchSayaci++;

      if (batchSayaci >= 400) {
        await batch.commit();
        batch = writeBatch(db);
        batchSayaci = 0;
      }
    }
  }

  if (batchSayaci > 0) {
    await batch.commit();
  }

  return {
    toplamTarandi: snap.docs.length,
    guncellenen: detaylar.length,
    detaylar,
  };
}
