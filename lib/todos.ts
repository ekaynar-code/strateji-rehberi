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

export interface Todo {
  id: string;
  baslik: string;
  tamamlandi: boolean;
  ekleyen?: string;
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

export async function addTodo(baslik: string, ekleyen?: string) {
  await addDoc(collection(db, COLLECTION), {
    baslik,
    tamamlandi: false,
    ekleyen: ekleyen || undefined,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function toggleTodo(id: string, tamamlandi: boolean) {
  await updateDoc(doc(db, COLLECTION, id), {
    tamamlandi,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTodo(id: string) {
  await deleteDoc(doc(db, COLLECTION, id));
}
