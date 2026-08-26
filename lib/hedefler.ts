import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

export interface Hedef {
  baslangic: string;
  bitis: string;
  hedefTry: number;
}

const COLLECTION = "ayarlar";
const DOC_ID = "yillik_hedef";

function belgeYolu() {
  return doc(db, COLLECTION, DOC_ID);
}

export function subscribeHedef(
  callback: (hedef: Hedef | null) => void,
  onError: (err: Error) => void
) {
  return onSnapshot(
    belgeYolu(),
    (snap) => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      const data = snap.data();
      callback({ baslangic: data.baslangic, bitis: data.bitis, hedefTry: data.hedefTry });
    },
    (err) => onError(err as Error)
  );
}

export async function hedefKaydet(baslangic: string, bitis: string, hedefTry: number) {
  await setDoc(belgeYolu(), { baslangic, bitis, hedefTry });
}

export async function hedefGetir(): Promise<Hedef | null> {
  const snap = await getDoc(belgeYolu());
  if (!snap.exists()) return null;
  const data = snap.data();
  return { baslangic: data.baslangic, bitis: data.bitis, hedefTry: data.hedefTry };
}