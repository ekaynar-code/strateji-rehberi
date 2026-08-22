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

export type FuarBolge = "korfez" | "balkanlar" | "afrika" | "yurt_ici" | "diger";
export type FuarDurum = "izleniyor" | "katilim_planlandi" | "katilim_kesin" | "katilinmayacak" | "tamamlandi";

export interface Fuar {
  id: string;
  ad: string;
  lokasyon: string;
  bolge: FuarBolge;
  tarih: string; // YYYY-MM-DD formatında, etkinliğin başlangıç tarihi
  durum: FuarDurum;
  notlar?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export const FUAR_BOLGE_LABEL: Record<FuarBolge, string> = {
  korfez: "Körfez / Orta Doğu",
  balkanlar: "Balkanlar / Doğu Avrupa",
  afrika: "Afrika",
  yurt_ici: "Yurt içi",
  diger: "Diğer",
};

export const FUAR_DURUM_LABEL: Record<FuarDurum, string> = {
  izleniyor: "İzleniyor",
  katilim_planlandi: "Katılım planlandı",
  katilim_kesin: "Katılım kesin",
  katilinmayacak: "Katılınmayacak",
  tamamlandi: "Tamamlandı",
};

const COLLECTION = "fuarlar";

export function subscribeFuarlar(
  callback: (items: Fuar[]) => void,
  onError: (err: Error) => void
) {
  const q = query(collection(db, COLLECTION), orderBy("tarih", "asc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Fuar));
      callback(items);
    },
    (err) => onError(err as Error)
  );
}

export async function addFuar(data: Omit<Fuar, "id" | "createdAt" | "updatedAt">) {
  const temiz: Record<string, unknown> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) temiz[key] = value;
  });

  await addDoc(collection(db, COLLECTION), {
    ...temiz,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateFuar(id: string, data: Partial<Omit<Fuar, "id">>) {
  const temiz: Record<string, unknown> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) temiz[key] = value;
  });

  await updateDoc(doc(db, COLLECTION, id), {
    ...temiz,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteFuar(id: string) {
  await deleteDoc(doc(db, COLLECTION, id));
}

import { csvAyristir } from "./csv";

/** Bugünden itibaren kalan gün sayısı (negatifse geçmiş demektir). */
export function kalanGun(tarih: string): number {
  const hedef = new Date(tarih + "T00:00:00");
  const bugun = new Date();
  bugun.setHours(0, 0, 0, 0);
  const fark = hedef.getTime() - bugun.getTime();
  return Math.round(fark / (1000 * 60 * 60 * 24));
}

const FUAR_CSV_BASLIKLARI = ["ad", "lokasyon", "bolge", "tarih", "notlar"] as const;
const GECERLI_FUAR_BOLGELER: FuarBolge[] = ["korfez", "balkanlar", "afrika", "yurt_ici", "diger"];

export interface FuarCsvSatirSonucu {
  satirNo: number;
  ad: string;
  basarili: boolean;
  hata?: string;
}

/**
 * CSV metnini fuar kayıtlarına çevirip Firestore'a tek tek ekler.
 * Beklenen başlıklar: ad, lokasyon, bolge, tarih (YYYY-MM-DD), notlar
 * (notlar opsiyonel; bolge geçerli değerlerden biri, tarih YYYY-MM-DD olmalı).
 */
export async function fuarCsvIceAktar(csvMetin: string): Promise<FuarCsvSatirSonucu[]> {
  const satirlar = csvAyristir(csvMetin.trim());
  if (satirlar.length === 0) return [];

  const baslikSatiri = satirlar[0].map((h) => h.trim());
  const veriSatirlari = satirlar.slice(1);

  const sonuclar: FuarCsvSatirSonucu[] = [];

  for (let i = 0; i < veriSatirlari.length; i++) {
    const satirNo = i + 2;
    const hucreler = veriSatirlari[i];
    const kayit: Record<string, string> = {};
    baslikSatiri.forEach((baslik, idx) => {
      kayit[baslik] = (hucreler[idx] || "").trim();
    });

    const ad = kayit["ad"] || "";
    const lokasyon = kayit["lokasyon"] || "";
    const bolge = kayit["bolge"] as FuarBolge;
    const tarih = kayit["tarih"] || "";

    if (!ad || !lokasyon) {
      sonuclar.push({ satirNo, ad: ad || "(boş)", basarili: false, hata: "Etkinlik adı veya lokasyon eksik" });
      continue;
    }
    if (!GECERLI_FUAR_BOLGELER.includes(bolge)) {
      sonuclar.push({ satirNo, ad, basarili: false, hata: `Geçersiz bölge: "${kayit["bolge"]}"` });
      continue;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tarih)) {
      sonuclar.push({ satirNo, ad, basarili: false, hata: `Geçersiz tarih formatı (YYYY-MM-DD olmalı): "${tarih}"` });
      continue;
    }

    try {
      await addFuar({
        ad,
        lokasyon,
        bolge,
        tarih,
        durum: "izleniyor",
        notlar: kayit["notlar"] || undefined,
      });
      sonuclar.push({ satirNo, ad, basarili: true });
    } catch (err) {
      sonuclar.push({ satirNo, ad, basarili: false, hata: (err as Error).message });
    }
  }

  return sonuclar;
}

export const FUAR_CSV_ORNEK_BASLIK = FUAR_CSV_BASLIKLARI.join(",");
