import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { mevcutKullaniciAdi } from "./kullaniciAdi";

export interface AktiviteKaydi {
  id: string;
  kullanici: string; // örn. "yonetim"
  eylem: string; // örn. "Satış fırsatı ekledi", "Durumu değiştirdi", "Not ekledi"
  hedef: string; // örn. "Kuzey İnşaat", "Görev: Fuar kaydı"
  modul: string; // örn. "Satış Fırsatları", "Yapılacaklar", "Fuarlar"
  createdAt?: Timestamp;
}

const COLLECTION = "aktivite_log";

/**
 * Bir değişikliği kaydeder. Bu, kullanıcı işlemi (mesaj oluşturma hariç,
 * çünkü o zaten ayrı işaretleniyor) her seferinde çağrılır — kartta
 * "son düzenleyen" göstermek ve Ayarlar'daki tam logu oluşturmak için.
 */
export async function aktiviteKaydet(eylem: string, hedef: string, modul: string) {
  try {
    await addDoc(collection(db, COLLECTION), {
      kullanici: mevcutKullaniciAdi(),
      eylem,
      hedef,
      modul,
      createdAt: serverTimestamp(),
    });
  } catch {
    // Log kaydı başarısız olsa bile asıl işlemi engellemesin.
  }
}

export function subscribeAktiviteLog(
  callback: (kayitlar: AktiviteKaydi[]) => void,
  onError: (err: Error) => void,
  adet = 100
) {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"), limit(adet));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as AktiviteKaydi));
      callback(items);
    },
    (err) => onError(err as Error)
  );
}
