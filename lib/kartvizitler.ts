import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface Kartvizit {
  id: string;
  adSoyad: string;
  unvan?: string;
  sirket?: string;
  telefon?: string;
  eposta?: string;
  web?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

const COLLECTION = "kartvizitler";

export function subscribeKartvizitler(
  callback: (items: Kartvizit[]) => void,
  onError: (err: Error) => void
) {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Kartvizit));
      callback(items);
    },
    (err) => onError(err as Error)
  );
}

export async function kartvizitEkle(data: Omit<Kartvizit, "id" | "createdAt" | "updatedAt">) {
  const temiz: Record<string, unknown> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== "") temiz[key] = value;
  });

  await addDoc(collection(db, COLLECTION), {
    ...temiz,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function kartvizitGuncelle(id: string, data: Partial<Omit<Kartvizit, "id">>) {
  const temiz: Record<string, unknown> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) temiz[key] = value;
  });

  await updateDoc(doc(db, COLLECTION, id), {
    ...temiz,
    updatedAt: serverTimestamp(),
  });
}

export async function kartvizitSil(id: string) {
  await deleteDoc(doc(db, COLLECTION, id));
}

/**
 * Bir kartvizit kaydını standart vCard 3.0 formatına çevirir. Bu metin QR koda
 * gömülür — okuyan telefon kamerası bunu otomatik olarak "kişi ekle" önerisine
 * çevirir (iOS ve Android'de yerleşik destek).
 *
 * Not: vCard 3.0'da N (yapılandırılmış isim: Soyad;Ad;...) alanı FN (görünen
 * tam isim) ile birlikte zorunludur. Sadece FN eklemek Apple'da genelde sorun
 * çıkarmaz ama Android/Google Contacts'ta ismin hiç görünmemesine yol açabilir
 * — bu yüzden ikisini de dolduruyoruz.
 */
export function vCardOlustur(kart: Kartvizit): string {
  const parcalar = kart.adSoyad.trim().split(/\s+/);
  const soyad = parcalar.length > 1 ? parcalar[parcalar.length - 1] : "";
  const ad = parcalar.length > 1 ? parcalar.slice(0, -1).join(" ") : parcalar[0] || "";

  const satirlar = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${soyad};${ad};;;`,
    `FN:${kart.adSoyad}`,
  ];

  if (kart.sirket) satirlar.push(`ORG:${kart.sirket}`);
  if (kart.unvan) satirlar.push(`TITLE:${kart.unvan}`);
  if (kart.telefon) satirlar.push(`TEL;TYPE=WORK,VOICE:${kart.telefon}`);
  if (kart.eposta) satirlar.push(`EMAIL:${kart.eposta}`);
  if (kart.web) satirlar.push(`URL:${kart.web}`);

  satirlar.push("END:VCARD");
  return satirlar.join("\n");
}
