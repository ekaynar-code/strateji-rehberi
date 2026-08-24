import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { MesajDili, MesajTipi } from "./mesajSablonlari";

export interface OzelSablon {
  konu: string;
  govde: string;
}

const COLLECTION = "mesaj_sablonlari";

function belgeId(tip: MesajTipi, dil: MesajDili): string {
  return `${tip}_${dil}`;
}

export async function ozelSablonKaydet(
  tip: MesajTipi,
  dil: MesajDili,
  sablon: OzelSablon
) {
  await setDoc(doc(db, COLLECTION, belgeId(tip, dil)), sablon);
}

export async function ozelSablonSifirla(tip: MesajTipi, dil: MesajDili) {
  await setDoc(doc(db, COLLECTION, belgeId(tip, dil)), { konu: "", govde: "" });
}

export async function ozelSablonGetir(tip: MesajTipi, dil: MesajDili): Promise<OzelSablon | null> {
  const snap = await getDoc(doc(db, COLLECTION, belgeId(tip, dil)));
  if (!snap.exists()) return null;
  const data = snap.data();
  if (!data.konu && !data.govde) return null; // sıfırlanmış demek
  return { konu: data.konu, govde: data.govde };
}
