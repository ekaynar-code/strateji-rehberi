import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

const COLLECTION = "kullanici_pin";

function belgeYolu(uid: string) {
  return doc(db, COLLECTION, uid);
}

/**
 * Basit bir hash — PIN'i düz metin olarak saklamamak için. Gerçek bir
 * kriptografik hash değil (bcrypt gibi bir kütüphane gerektirirdi), ama
 * bu tehdit modelinde (fiziksel erişim, kilit ekranı) amaca yeterli:
 * Firestore verisine bakan biri PIN'i doğrudan okuyamaz.
 */
async function basitHash(pin: string, uid: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + ":" + uid);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function pinBelirlenmisMi(uid: string): Promise<boolean> {
  const snap = await getDoc(belgeYolu(uid));
  return snap.exists();
}

export async function pinKaydet(uid: string, pin: string): Promise<void> {
  const hash = await basitHash(pin, uid);
  await setDoc(belgeYolu(uid), { hash });
}

export async function pinDogrula(uid: string, pin: string): Promise<boolean> {
  const snap = await getDoc(belgeYolu(uid));
  if (!snap.exists()) return false;
  const hash = await basitHash(pin, uid);
  return snap.data().hash === hash;
}
