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
export type Profil = "uretici" | "insaat_firmasi" | "mimarlik_firmasi" | "araci_sirket";
export type Durum = "arastirmada" | "temas_edildi" | "yanit_bekleniyor" | "gorusme_planlandi" | "anlasma" | "olumsuz";
export type ParaBirimi = "TRY" | "USD" | "EUR";
export type FiyatPozisyonu = "dusuk" | "orta" | "yuksek";

export interface Distributor {
  id: string;
  firmaAdi: string;
  ulke: string;
  bolge: Bolge;
  profil: Profil;
  durum: Durum;
  iletisimKisisi?: string;
  iletisimBilgisi?: string; // eski kayıtlar için — yeni kayıtlarda eposta/telefon kullanılır
  eposta?: string;
  telefon?: string;
  notlar?: string;
  tahminiCiro?: number; // anlaşma durumunda tahmini yıllık ciro (girilen para biriminde)
  tahminiCiroParaBirimi?: ParaBirimi;
  kayipSebebi?: string; // durum "olumsuz" olduğunda opsiyonel not
  // Rakip istihbaratı alanları — profil "uretici" olduğunda kullanılır
  urunSegmenti?: string; // örn. "yangın kapısı, otel projeleri"
  fiyatPozisyonu?: FiyatPozisyonu;
  gucluYonler?: string;
  zayifYonler?: string;
  sonMesajTarihi?: string; // YYYY-MM-DD, en son gönderilen mesajın tarihi
  sonMesajTipi?: string; // örn. "İlk temas", "Takip mesajı"
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export const FIYAT_POZISYONU_LABEL: Record<FiyatPozisyonu, string> = {
  dusuk: "Düşük fiyat",
  orta: "Orta segment",
  yuksek: "Yüksek fiyat / premium",
};

export const BOLGE_LABEL: Record<Bolge, string> = {
  turkiye: "Türkiye (yurt içi)",
  korfez: "Körfez / Orta Doğu",
  balkanlar: "Balkanlar / Doğu Avrupa",
  afrika: "Afrika",
};

export const PROFIL_LABEL: Record<Profil, string> = {
  uretici: "Üretici (rakip/referans)",
  insaat_firmasi: "İnşaat firması",
  mimarlik_firmasi: "Mimarlık firması",
  araci_sirket: "Aracı şirket",
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

/**
 * Bir kayıt için "mesaj gönderildi" olduğunu işaretler: gönderim tarihini
 * ve mesaj tipini kaydeder, durumu bir sonraki mantıklı aşamaya ilerletir
 * (sadece durum henüz o aşamaya geçmemişse — geri almaz).
 */
export async function mesajGonderildiIsaretle(
  id: string,
  mevcutDurum: Durum,
  mesajTipiEtiketi: string
) {
  const bugun = new Date().toISOString().slice(0, 10);
  const guncelleme: Partial<Distributor> = {
    sonMesajTarihi: bugun,
    sonMesajTipi: mesajTipiEtiketi,
  };

  // Durumu sadece henüz ilerlememişse ilerlet — "yanıt bekleniyor" veya
  // sonrasındaki bir aşamada olan kaydı geri "temas edildi"ye çekmeyelim.
  if (mevcutDurum === "arastirmada") {
    guncelleme.durum = "temas_edildi";
  }

  await updateDistributor(id, guncelleme);
}

import { csvAyristir } from "./csv";

const CSV_BASLIKLARI = ["firmaAdi", "ulke", "bolge", "profil", "iletisimKisisi", "eposta", "telefon", "notlar"] as const;
const GECERLI_BOLGELER: Bolge[] = ["korfez", "balkanlar", "afrika", "turkiye"];
const GECERLI_PROFILLER: Profil[] = ["uretici", "insaat_firmasi", "mimarlik_firmasi", "araci_sirket"];

export interface CsvSatirSonucu {
  satirNo: number;
  firmaAdi: string;
  basarili: boolean;
  hata?: string;
}


/**
 * CSV metnini distribütör kayıtlarına çevirip Firestore'a tek tek ekler.
 * Beklenen başlıklar: firmaAdi, ulke, bolge, profil, iletisimKisisi, eposta,
 * telefon, notlar (firmaAdi ve ulke hariç hepsi opsiyonel; bolge/profil
 * geçerli değerlerden biri olmalı).
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
    const profil = (kayit["profil"] || "insaat_firmasi") as Profil;

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
        iletisimKisisi: kayit["iletisimKisisi"] || undefined,
        eposta: kayit["eposta"] || undefined,
        telefon: kayit["telefon"] || undefined,
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
