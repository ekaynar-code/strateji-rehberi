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

export type Bolge = "korfez" | "balkanlar" | "afrika";
export type Profil = "distributor" | "fitout" | "uretici" | "diger";
export type Durum = "arastirmada" | "temas_edildi" | "yanit_bekleniyor" | "gorusme_planlandi" | "anlasma" | "olumsuz";

export interface Distributor {
  id: string;
  firmaAdi: string;
  ulke: string;
  bolge: Bolge;
  profil: Profil;
  durum: Durum;
  iletisimKisisi?: string;
  iletisimBilgisi?: string;
  notlar?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export const BOLGE_LABEL: Record<Bolge, string> = {
  korfez: "Körfez / Orta Doğu",
  balkanlar: "Balkanlar / Doğu Avrupa",
  afrika: "Afrika",
};

export const PROFIL_LABEL: Record<Profil, string> = {
  distributor: "Distribütör",
  fitout: "Fit-out kontraktörü",
  uretici: "Üretici (rakip/referans)",
  diger: "Diğer",
};

export const DURUM_LABEL: Record<Durum, string> = {
  arastirmada: "Araştırmada",
  temas_edildi: "Temas edildi",
  yanit_bekleniyor: "Yanıt bekleniyor",
  gorusme_planlandi: "Görüşme planlandı",
  anlasma: "Anlaşma",
  olumsuz: "Olumsuz sonuçlandı",
};

const COLLECTION = "distributors";

export function subscribeDistributors(
  callback: (items: Distributor[]) => void,
  onError: (err: Error) => void
) {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Distributor));
      callback(items);
    },
    (err) => onError(err as Error)
  );
}

export async function addDistributor(data: Omit<Distributor, "id" | "createdAt" | "updatedAt">) {
  await addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateDistributor(id: string, data: Partial<Omit<Distributor, "id">>) {
  await updateDoc(doc(db, COLLECTION, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteDistributor(id: string) {
  await deleteDoc(doc(db, COLLECTION, id));
}
