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

export interface HaberSorgusu {
  id: string;
  baslik: string; // kullanıcıya gösterilen kısa isim, ör. "Körfez otel projeleri"
  sorgu: string; // arama terimi, ör. "Körfez otel projeleri inşaat"
  createdAt?: Timestamp;
}

const COLLECTION = "haber_sorgulari";

export const VARSAYILAN_SORGULAR: Omit<HaberSorgusu, "id" | "createdAt">[] = [
  { baslik: "Yangın kapısı yönetmeliği", sorgu: "yangın kapısı yönetmeliği" },
  { baslik: "Balkanlar inşaat sektörü", sorgu: "Balkanlar inşaat sektörü" },
  { baslik: "Körfez otel projeleri", sorgu: "Körfez otel projeleri inşaat" },
  { baslik: "Afrika inşaat yatırımı", sorgu: "Afrika inşaat yatırımı" },
];

export function subscribeHaberSorgulari(
  callback: (items: HaberSorgusu[]) => void,
  onError: (err: Error) => void
) {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "asc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as HaberSorgusu));
      callback(items);
    },
    (err) => onError(err as Error)
  );
}

export async function addHaberSorgusu(baslik: string, sorgu: string) {
  await addDoc(collection(db, COLLECTION), {
    baslik,
    sorgu,
    createdAt: serverTimestamp(),
  });
}

export async function deleteHaberSorgusu(id: string) {
  await deleteDoc(doc(db, COLLECTION, id));
}
