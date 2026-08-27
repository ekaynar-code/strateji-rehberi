import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit as fsLimit,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "./firebase";

export interface LogKaydi {
  id: string;
  kullanici: string; // e-postanın @ öncesi kısmı
  eylem: string; // örn. "ekledi", "durumu değiştirdi", "sildi"
  modul: string; // örn. "Satış Fırsatı", "Yapılacak", "Fuar"
  detay?: string; // örn. firma adı, görev başlığı
  createdAt?: Timestamp;
}

const COLLECTION = "degisiklik_loglari";

/**
 * Giriş yapmış kullanıcının e-postasından @ öncesi kısmı çıkarır. Kullanıcı
 * yoksa "bilinmeyen" döner.
 */
export function guncelKullaniciAdi(): string {
  const email = auth.currentUser?.email;
  if (!email) return "bilinmeyen";
  return email.split("@")[0];
}

/**
 * Bir işlem gerçekleştiğinde (ekleme, düzenleme, silme, durum değiştirme vb.)
 * log kaydı düşer. Bu işlem sessizce başarısız olabilir (log yazımı asıl
 * işlemi asla engellememeli) — bu yüzden hata fırlatmaz.
 */
export async function logEkle(eylem: string, modul: string, detay?: string) {
  try {
    await addDoc(collection(db, COLLECTION), {
      kullanici: guncelKullaniciAdi(),
      eylem,
      modul,
      detay: detay || "",
      createdAt: serverTimestamp(),
    });
  } catch {
    // Log yazımı başarısız olursa sessizce geç — asıl işlemi etkilemesin.
  }
}

export function subscribeLoglar(
  callback: (loglar: LogKaydi[]) => void,
  onError: (err: Error) => void,
  adet = 200
) {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"), fsLimit(adet));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as LogKaydi));
      callback(items);
    },
    (err) => onError(err as Error)
  );
}
