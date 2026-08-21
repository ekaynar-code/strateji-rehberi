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

export type Bolge = "korfez" | "balkanlar" | "afrika" | "turkiye";
export type Profil = "distributor" | "fitout" | "uretici" | "diger";
export type Durum = "arastirmada" | "temas_edildi" | "yanit_bekleniyor" | "gorusme_planlandi" | "anlasma" | "olumsuz";
export type ParaBirimi = "TRY" | "USD" | "EUR";

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
  tahminiCiro?: number; // anlaşma durumunda tahmini yıllık ciro (girilen para biriminde)
  tahminiCiroParaBirimi?: ParaBirimi;
  kayipSebebi?: string; // durum "olumsuz" olduğunda opsiyonel not
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export const BOLGE_LABEL: Record<Bolge, string> = {
  turkiye: "Türkiye (yurt içi)",
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
  // Firestore, alan değeri olarak `undefined` kabul etmez — boş/tanımsız
  // opsiyonel alanları objeden tamamen çıkarıyoruz.
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

export async function updateDistributor(id: string, data: Partial<Omit<Distributor, "id">>) {
  const temiz: Record<string, unknown> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) temiz[key] = value;
  });

  await updateDoc(doc(db, COLLECTION, id), {
    ...temiz,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteDistributor(id: string) {
  await deleteDoc(doc(db, COLLECTION, id));
}

const CSV_BASLIKLARI = ["firmaAdi", "ulke", "bolge", "profil", "iletisimBilgisi", "notlar"] as const;
const GECERLI_BOLGELER: Bolge[] = ["korfez", "balkanlar", "afrika"];
const GECERLI_PROFILLER: Profil[] = ["distributor", "fitout", "uretici", "diger"];

export interface CsvSatirSonucu {
  satirNo: number;
  firmaAdi: string;
  basarili: boolean;
  hata?: string;
}

/**
 * Basit CSV ayrıştırıcı — virgülle ayrılmış, çift tırnak içinde virgül/yeni satır
 * destekler. Excel/Google Sheets'ten dışa aktarılan standart CSV'ler için yeterli.
 */
function csvAyristir(metin: string): string[][] {
  const satirlar: string[][] = [];
  let satir: string[] = [];
  let alan = "";
  let tirnakIcinde = false;

  for (let i = 0; i < metin.length; i++) {
    const c = metin[i];
    const sonraki = metin[i + 1];

    if (tirnakIcinde) {
      if (c === '"' && sonraki === '"') {
        alan += '"';
        i++;
      } else if (c === '"') {
        tirnakIcinde = false;
      } else {
        alan += c;
      }
    } else {
      if (c === '"') {
        tirnakIcinde = true;
      } else if (c === ",") {
        satir.push(alan);
        alan = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && sonraki === "\n") i++;
        satir.push(alan);
        satirlar.push(satir);
        satir = [];
        alan = "";
      } else {
        alan += c;
      }
    }
  }
  if (alan.length > 0 || satir.length > 0) {
    satir.push(alan);
    satirlar.push(satir);
  }
  return satirlar.filter((s) => s.some((f) => f.trim() !== ""));
}

/**
 * CSV metnini distribütör kayıtlarına çevirip Firestore'a tek tek ekler.
 * Beklenen başlıklar: firmaAdi, ulke, bolge, profil, iletisimBilgisi, notlar
 * (iletisimBilgisi ve notlar opsiyonel; bolge/profil geçerli değerlerden biri olmalı).
 */
export async function csvIceAktar(csvMetin: string): Promise<CsvSatirSonucu[]> {
  const satirlar = csvAyristir(csvMetin.trim());
  if (satirlar.length === 0) return [];

  const baslikSatiri = satirlar[0].map((h) => h.trim());
  const veriSatirlari = satirlar.slice(1);

  const sonuclar: CsvSatirSonucu[] = [];

  for (let i = 0; i < veriSatirlari.length; i++) {
    const satirNo = i + 2; // 1. satır başlık, veri 2'den başlar
    const hucreler = veriSatirlari[i];
    const kayit: Record<string, string> = {};
    baslikSatiri.forEach((baslik, idx) => {
      kayit[baslik] = (hucreler[idx] || "").trim();
    });

    const firmaAdi = kayit["firmaAdi"] || "";
    const ulke = kayit["ulke"] || "";
    const bolge = kayit["bolge"] as Bolge;
    const profil = (kayit["profil"] || "diger") as Profil;

    if (!firmaAdi || !ulke) {
      sonuclar.push({ satirNo, firmaAdi: firmaAdi || "(boş)", basarili: false, hata: "Firma adı veya ülke eksik" });
      continue;
    }
    if (!GECERLI_BOLGELER.includes(bolge)) {
      sonuclar.push({ satirNo, firmaAdi, basarili: false, hata: `Geçersiz bölge: "${kayit["bolge"]}"` });
      continue;
    }
    if (!GECERLI_PROFILLER.includes(profil)) {
      sonuclar.push({ satirNo, firmaAdi, basarili: false, hata: `Geçersiz profil: "${kayit["profil"]}"` });
      continue;
    }

    try {
      await addDistributor({
        firmaAdi,
        ulke,
        bolge,
        profil,
        durum: "arastirmada",
        iletisimBilgisi: kayit["iletisimBilgisi"] || undefined,
        notlar: kayit["notlar"] || undefined,
      });
      sonuclar.push({ satirNo, firmaAdi, basarili: true });
    } catch (err) {
      sonuclar.push({ satirNo, firmaAdi, basarili: false, hata: (err as Error).message });
    }
  }

  return sonuclar;
}

export const CSV_ORNEK_BASLIK = CSV_BASLIKLARI.join(",");
