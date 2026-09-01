import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  collection,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase";

export const MODUL_LISTESI = [
  "genel_bakis",
  "satis_firsatlari",
  "fuarlar",
  "piyasa_nabzi",
  "yapilacaklar",
] as const;

export type ModulAdi = (typeof MODUL_LISTESI)[number];

export const MODUL_LABEL: Record<ModulAdi, string> = {
  genel_bakis: "Genel Bakış",
  satis_firsatlari: "Satış Fırsatları",
  fuarlar: "Fuarlar",
  piyasa_nabzi: "Piyasa Nabzı",
  yapilacaklar: "Yapılacaklar",
};

// Genel Bakış sayfasındaki alt bölümler — modül bazlı yetkiden ayrı olarak,
// her biri tek tek gizlenip gösterilebilir.
export const GENEL_BAKIS_BOLUMU_LISTESI = [
  "ciro_hedefi",
  "personel_durumu",
  "siparis_uretim",
  "ariza_sorunlar",
  "ekonomi_analizi",
  "aksiyon_listesi",
] as const;

export type GenelBakisBolumu = (typeof GENEL_BAKIS_BOLUMU_LISTESI)[number];

export const GENEL_BAKIS_BOLUMU_LABEL: Record<GenelBakisBolumu, string> = {
  ciro_hedefi: "Ciro Hedefi",
  personel_durumu: "Personel Durumu",
  siparis_uretim: "Sipariş/Üretim Durumu",
  ariza_sorunlar: "Arıza ve Sorunlar",
  ekonomi_analizi: "Ekonomi Analizi",
  aksiyon_listesi: "Aksiyon Listesi",
};

export interface KullaniciYetkisi {
  email: string;
  kullaniciAdi: string;
  moduller: ModulAdi[];
  genelBakisBolumleri: GenelBakisBolumu[]; // Genel Bakış modülü içindeki görünür alt bölümler
  onaylandi: boolean;
  ilkGiris?: string;
}

const COLLECTION = "kullanici_yetkileri";

function belgeIdUret(email: string): string {
  return email.replace(/[.#$/[\]]/g, "_");
}

export async function kullaniciKaydiniGarantiEt(email: string) {
  const id = belgeIdUret(email);
  const ref = doc(db, COLLECTION, id);
  const mevcut = await getDoc(ref);
  if (mevcut.exists()) return;

  await setDoc(ref, {
    email,
    kullaniciAdi: email.split("@")[0],
    moduller: [],
    genelBakisBolumleri: [],
    onaylandi: false,
    ilkGiris: new Date().toISOString(),
  });
}

export function subscribeKullaniciYetkisi(
  email: string,
  callback: (yetki: KullaniciYetkisi | null) => void,
  onError: (err: Error) => void
) {
  const id = belgeIdUret(email);
  return onSnapshot(
    doc(db, COLLECTION, id),
    (snap) => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      const data = snap.data();
      callback({
        ...(data as KullaniciYetkisi),
        moduller: data.moduller || [],
        genelBakisBolumleri: data.genelBakisBolumleri || [],
      });
    },
    (err) => onError(err as Error)
  );
}

export function subscribeTumKullanicilar(
  callback: (kullanicilar: KullaniciYetkisi[]) => void,
  onError: (err: Error) => void
) {
  const q = query(collection(db, COLLECTION), orderBy("ilkGiris", "asc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          ...(data as KullaniciYetkisi),
          moduller: data.moduller || [],
          genelBakisBolumleri: data.genelBakisBolumleri || [],
        };
      });
      callback(items);
    },
    (err) => onError(err as Error)
  );
}

export async function kullaniciYetkileriniKaydet(email: string, moduller: ModulAdi[]) {
  const id = belgeIdUret(email);
  await setDoc(
    doc(db, COLLECTION, id),
    { moduller, onaylandi: true },
    { merge: true }
  );
}

export async function kullaniciYetkiKaydiniSil(email: string) {
  const id = belgeIdUret(email);
  await deleteDoc(doc(db, COLLECTION, id));
}

export async function kullaniciGenelBakisBolumleriniKaydet(
  email: string,
  bolumler: GenelBakisBolumu[]
) {
  const id = belgeIdUret(email);
  await setDoc(
    doc(db, COLLECTION, id),
    { genelBakisBolumleri: bolumler, onaylandi: true },
    { merge: true }
  );
}

export const YONETIM_EMAIL = "yonetim@pimetri.com";

export function moduleErisimiVarMi(
  yetki: KullaniciYetkisi | null,
  modul: ModulAdi,
  kullaniciEmail: string | null | undefined
): boolean {
  if (kullaniciEmail === YONETIM_EMAIL) return true;
  if (!yetki) return false;
  return yetki.moduller.includes(modul);
}

export function genelBakisBolumuErisimiVarMi(
  yetki: KullaniciYetkisi | null,
  bolum: GenelBakisBolumu,
  kullaniciEmail: string | null | undefined
): boolean {
  if (kullaniciEmail === YONETIM_EMAIL) return true;
  if (!yetki) return false;
  return yetki.genelBakisBolumleri.includes(bolum);
}
