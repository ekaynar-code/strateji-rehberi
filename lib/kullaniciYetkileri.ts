import {
  doc,
  getDoc,
  setDoc,
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

export interface KullaniciYetkisi {
  email: string;
  kullaniciAdi: string;
  moduller: ModulAdi[];
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
      callback(snap.data() as KullaniciYetkisi);
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
      const items = snapshot.docs.map((d) => d.data() as KullaniciYetkisi);
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
