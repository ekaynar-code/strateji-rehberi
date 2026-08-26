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
import type { ParaBirimi } from "./distributors";

export interface ManuelCiroKaydi {
  id: string;
  tutar: number;
  paraBirimi: ParaBirimi;
  not: string;
  tarih: string; // YYYY-MM-DD, satışın gerçekleştiği tarih
  kaynakSiparisNo?: string; // otomatik eklenen kayıtlarda, mükerrer eklemeyi önlemek için
  createdAt?: Timestamp;
}

const COLLECTION = "manuel_ciro";

export function subscribeManuelCiro(
  callback: (items: ManuelCiroKaydi[]) => void,
  onError: (err: Error) => void
) {
  const q = query(collection(db, COLLECTION), orderBy("tarih", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ManuelCiroKaydi));
      callback(items);
    },
    (err) => onError(err as Error)
  );
}

export async function manuelCiroEkle(
  tutar: number,
  paraBirimi: ParaBirimi,
  not: string,
  tarih: string,
  kaynakSiparisNo?: string
) {
  await addDoc(collection(db, COLLECTION), {
    tutar,
    paraBirimi,
    not,
    tarih,
    ...(kaynakSiparisNo ? { kaynakSiparisNo } : {}),
    createdAt: serverTimestamp(),
  });
}

export async function manuelCiroSil(id: string) {
  await deleteDoc(doc(db, COLLECTION, id));
}
