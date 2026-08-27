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
import { logEkle, guncelKullaniciAdi } from "./degisiklikLog";

export interface Todo {
  id: string;
  baslik: string;
  tamamlandi: boolean;
  ekleyen?: string;
  sonDegistiren?: string;
  tamamlayan?: string;
  sonTarih?: string; // YYYY-MM-DD formatında, opsiyonel deadline
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

const COLLECTION = "todos";

export function subscribeTodos(
  callback: (items: Todo[]) => void,
  onError: (err: Error) => void
) {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Todo));
      callback(items);
    },
    (err) => onError(err as Error)
  );
}

export async function addTodo(baslik: string, ekleyen?: string, sonTarih?: string) {
  const kullanici = guncelKullaniciAdi();
  await addDoc(collection(db, COLLECTION), {
    baslik,
    tamamlandi: false,
    ekleyen: ekleyen || kullanici,
    sonDegistiren: kullanici,
    ...(sonTarih ? { sonTarih } : {}),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await logEkle("ekledi", "Yapılacak", baslik);
}

export async function toggleTodo(id: string, tamamlandi: boolean, baslik?: string) {
  const kullanici = guncelKullaniciAdi();
  await updateDoc(doc(db, COLLECTION, id), {
    tamamlandi,
    sonDegistiren: kullanici,
    ...(tamamlandi ? { tamamlayan: kullanici } : {}),
    updatedAt: serverTimestamp(),
  });
  await logEkle(tamamlandi ? "tamamlandı olarak işaretledi" : "tekrar açtı", "Yapılacak", baslik);
}

export async function deleteTodo(id: string, baslik?: string) {
  await deleteDoc(doc(db, COLLECTION, id));
  await logEkle("sildi", "Yapılacak", baslik);
}

// --- Alt notlar (bir göreve bağlı, zaman damgalı küçük notlar) ---

export interface TodoNotu {
  id: string;
  metin: string;
  ekleyen?: string;
  createdAt?: Timestamp;
}

function notlarKoleksiyonu(todoId: string) {
  return collection(db, COLLECTION, todoId, "notlar");
}

export function subscribeTodoNotlari(
  todoId: string,
  callback: (notlar: TodoNotu[]) => void,
  onError: (err: Error) => void
) {
  const q = query(notlarKoleksiyonu(todoId), orderBy("createdAt", "asc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const notlar = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as TodoNotu));
      callback(notlar);
    },
    (err) => onError(err as Error)
  );
}

export async function todoNotuEkle(todoId: string, metin: string, gorevBasligi?: string) {
  await addDoc(notlarKoleksiyonu(todoId), {
    metin,
    ekleyen: guncelKullaniciAdi(),
    createdAt: serverTimestamp(),
  });
  await logEkle("not ekledi", "Yapılacak", gorevBasligi);
}

export async function todoNotuSil(todoId: string, notId: string) {
  await deleteDoc(doc(db, COLLECTION, todoId, "notlar", notId));
}

/** Bugünden itibaren kalan gün sayısı (negatifse geçmiş demektir). */
export function todoKalanGun(sonTarih: string): number {
  const hedef = new Date(sonTarih + "T00:00:00");
  const bugun = new Date();
  bugun.setHours(0, 0, 0, 0);
  const fark = hedef.getTime() - bugun.getTime();
  return Math.round(fark / (1000 * 60 * 60 * 24));
}
