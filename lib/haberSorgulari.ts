import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface TakipEdilenUlke {
  id: string;
  ulkeAdi: string; // Ticaret Bakanlığı sitesindeki ülke adıyla birebir eşleşmeli
  createdAt?: Timestamp;
}

const COLLECTION = "takip_edilen_ulkeler";

export const VARSAYILAN_ULKELER = [
  "Suudi Arabistan",
  "Birleşik Arap Emirlikleri",
  "Bulgaristan",
  "Romanya",
  "Sırbistan",
  "Mısır",
  "Fas",
  "Nijerya",
];

export function subscribeTakipEdilenUlkeler(
  callback: (items: TakipEdilenUlke[]) => void,
  onError: (err: Error) => void
) {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "asc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as TakipEdilenUlke));
      callback(items);
    },
    (err) => onError(err as Error)
  );
}

export async function ulkeEkle(ulkeAdi: string) {
  await addDoc(collection(db, COLLECTION), {
    ulkeAdi,
    createdAt: serverTimestamp(),
  });
}

export async function ulkeSil(id: string) {
  await deleteDoc(doc(db, COLLECTION, id));
}
