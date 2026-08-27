"use client";

import { useState } from "react";
import {
  type Distributor,
  DURUM_LABEL,
  PROFIL_LABEL,
  BOLGE_LABEL,
  FIYAT_POZISYONU_LABEL,
  updateDistributor,
  deleteDistributor,
  type Durum,
  type ParaBirimi,
  type FiyatPozisyonu,
  type Profil,
} from "@/lib/distributors";
import MesajOlusturModal from "@/components/MesajOlusturModal";

const DURUM_RENK: Record<Durum, string> = {
  arastirmada: "bg-gray-100 text-gray-600",
  temas_edildi: "bg-blue-50 text-blue-700",
  yanit_bekleniyor: "bg-amber-50 text-amber-700",
  gorusme_planlandi: "bg-violet-50 text-violet-700",
  anlasma: "bg-green-50 text-green-700",
  olumsuz: "bg-red-50 text-red-700",
};

const PARA_BIRIMLERI: ParaBirimi[] = ["TRY", "USD", "EUR"];
const PARA_SEMBOLU: Record<ParaBirimi, string> = { TRY: "₺", USD: "$", EUR: "€" };
const FIYAT_POZISYONLARI: FiyatPozisyonu[] = ["dusuk", "orta", "yuksek"];
const PROFILLER: Profil[] = ["uretici", "insaat_firmasi", "mimarlik_firmasi", "araci_sirket"];

function formatTutar(deger: number, paraBirimi: ParaBirimi): string {
  return `${PARA_SEMBOLU[paraBirimi]}${deger.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}`;
}

export default function DistributorCard({ item }: { item: Distributor }) {
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [ciroGirisi, setCiroGirisi] = useState(item.tahminiCiro?.toString() || "");
  const [paraBirimiGirisi, setParaBirimiGirisi] = useState<ParaBirimi>(item.tahminiCiroParaBirimi || "TRY");
  const [kayipGirisi, setKayipGirisi] = useState(item.kayipSebebi || "");
  const [rakipFormAcik, setRakipFormAcik] = useState(false);
  const [urunSegmentiGirisi, setUrunSegmentiGirisi] = useState(item.urunSegmenti || "");
  const [fiyatPozisyonuGirisi, setFiyatPozisyonuGirisi] = useState<FiyatPozisyonu | "">(item.fiyatPozisyonu || "");
  const [gucluYonlerGirisi, setGucluYonlerGirisi] = useState(item.gucluYonler || "");
  const [zayifYonlerGirisi, setZayifYonlerGirisi] = useState(item.zayifYonler || "");
  const [mesajModalAcik, setMesajModalAcik] = useState(false);

  const [bilgiDuzenleAcik, setBilgiDuzenleAcik] = useState(false);
  const [firmaAdiGirisi, setFirmaAdiGirisi] = useState(item.firmaAdi);
  const [ulkeGirisi, setUlkeGirisi] = useState(item.ulke);
  const [profilGirisi, setProfilGirisi] = useState<Profil>(item.profil);
  const [iletisimKisisiGirisi, setIletisimKisisiGirisi] = useState(item.iletisimKisisi || "");
  const [epostaGirisi, setEpostaGirisi] = useState(item.eposta || "");
  const [telefonGirisi, setTelefonGirisi] = useState(item.telefon || "");
  const [notlarGirisi, setNotlarGirisi] = useState(item.notlar || "");

  async function handleBilgiKaydet() {
    if (!firmaAdiGirisi.trim() || !ulkeGirisi.trim()) return;
    setBusy(true);
    try {
      await updateDistributor(item.id, {
        firmaAdi: firmaAdiGirisi.trim(),
        ulke: ulkeGirisi.trim(),
        profil: profilGirisi,
        iletisimKisisi: iletisimKisisiGirisi.trim() || undefined,
        eposta: epostaGirisi.trim() || undefined,
        telefon: telefonGirisi.trim() || undefined,
        notlar: notlarGirisi.trim() || undefined,
      }, item.firmaAdi);
      setBilgiDuzenleAcik(false);
    } finally {
      setBusy(false);
    }
  }

  function handleBilgiVazgec() {
    setFirmaAdiGirisi(item.firmaAdi);
    setUlkeGirisi(item.ulke);
    setProfilGirisi(item.profil);
    setIletisimKisisiGirisi(item.iletisimKisisi || "");
    setEpostaGirisi(item.eposta || "");
    setTelefonGirisi(item.telefon || "");
    setNotlarGirisi(item.notlar || "");
    setBilgiDuzenleAcik(false);
  }

  async function handleDurumChange(yeniDurum: Durum) {
    setBusy(true);
    try {
      await updateDistributor(item.id, { durum: yeniDurum }, item.firmaAdi);
    } finally {
      setBusy(false);
    }
  }

  async function handleCiroKaydet() {
    const sayi = parseFloat(ciroGirisi);
    if (isNaN(sayi) || sayi <= 0) return;
    setBusy(true);
    try {
      await updateDistributor(item.id, { tahminiCiro: sayi, tahminiCiroParaBirimi: paraBirimiGirisi }, item.firmaAdi);
    } finally {
      setBusy(false);
    }
  }

  async function handleKayipKaydet() {
    if (!kayipGirisi.trim()) return;
    setBusy(true);
    try {
      await updateDistributor(item.id, { kayipSebebi: kayipGirisi.trim() }, item.firmaAdi);
    } finally {
      setBusy(false);
    }
  }

  async function handleRakipBilgiKaydet() {
    setBusy(true);
    try {
      await updateDistributor(item.id, {
        urunSegmenti: urunSegmentiGirisi.trim() || undefined,
        fiyatPozisyonu: fiyatPozisyonuGirisi || undefined,
        gucluYonler: gucluYonlerGirisi.trim() || undefined,
        zayifYonler: zayifYonlerGirisi.trim() || undefined,
      }, item.firmaAdi);
      setRakipFormAcik(false);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await deleteDistributor(item.id, item.firmaAdi);
    } finally {
      setBusy(false);
    }
  }

  const rakipBilgisiVar = item.urunSegmenti || item.fiyatPozisyonu || item.gucluYonler || item.zayifYonler;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          {bilgiDuzenleAcik ? (
            <div className="flex flex-col gap-2">
              <input
                value={firmaAdiGirisi}
                onChange={(e) => setFirmaAdiGirisi(e.target.value)}
                placeholder="Firma adı"
                className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm font-medium outline-none focus:border-brand-400"
              />
              <input
                value={ulkeGirisi}
                onChange={(e) => setUlkeGirisi(e.target.value)}
                placeholder="Ülke"
                className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm outline-none focus:border-brand-400"
              />
              <select
                value={profilGirisi}
                onChange={(e) => setProfilGirisi(e.target.value as Profil)}
                className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm outline-none focus:border-brand-400"
              >
                {PROFILLER.map((p) => (
                  <option key={p} value={p}>
                    {PROFIL_LABEL[p]}
                  </option>
                ))}
              </select>
              <input
                value={iletisimKisisiGirisi}
                onChange={(e) => setIletisimKisisiGirisi(e.target.value)}
                placeholder="İletişim kişisi (opsiyonel)"
                className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm outline-none focus:border-brand-400"
              />
              <input
                type="email"
                value={epostaGirisi}
                onChange={(e) => setEpostaGirisi(e.target.value)}
                placeholder="E-posta"
                className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm outline-none focus:border-brand-400"
              />
              <input
                type="tel"
                value={telefonGirisi}
                onChange={(e) => setTelefonGirisi(e.target.value)}
                placeholder="Telefon"
                className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm outline-none focus:border-brand-400"
              />
              <textarea
                value={notlarGirisi}
                onChange={(e) => setNotlarGirisi(e.target.value)}
                placeholder="Notlar"
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm outline-none focus:border-brand-400"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleBilgiVazgec}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                >
                  Vazgeç
                </button>
                <button
                  onClick={handleBilgiKaydet}
                  disabled={busy || !firmaAdiGirisi.trim() || !ulkeGirisi.trim()}
                  className="rounded-lg bg-brand-400 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-500 disabled:opacity-50"
                >
                  Kaydet
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-2">
                <div className="font-medium text-gray-900">{item.firmaAdi}</div>
                <button
                  onClick={() => setBilgiDuzenleAcik(true)}
                  aria-label="Bilgileri düzenle"
                  className="shrink-0 rounded-md p-1 text-gray-300 hover:bg-gray-100 hover:text-gray-600"
                >
                  <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
                    <path
                      d="M11 2l3 3-8 8H3v-3l8-8z"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
              <div className="mt-0.5 text-sm text-gray-500">
                {item.ulke} · {BOLGE_LABEL[item.bolge]} · {PROFIL_LABEL[item.profil]}
              </div>
            </>
          )}
        </div>
        {!bilgiDuzenleAcik && (
          <select
            value={item.durum}
            onChange={(e) => handleDurumChange(e.target.value as Durum)}
            disabled={busy}
            className={`w-full shrink-0 rounded-lg border-0 px-2.5 py-1.5 text-sm font-medium outline-none sm:w-auto sm:py-1 sm:text-xs ${DURUM_RENK[item.durum]}`}
          >
            {(Object.keys(DURUM_LABEL) as Durum[]).map((d) => (
              <option key={d} value={d}>
                {DURUM_LABEL[d]}
              </option>
            ))}
          </select>
        )}
      </div>

      {!bilgiDuzenleAcik && (item.iletisimKisisi || item.eposta || item.telefon || item.iletisimBilgisi) && (
        <div className="mt-2 space-y-0.5 text-sm text-gray-600">
          {item.iletisimKisisi && <div>{item.iletisimKisisi}</div>}
          {item.eposta && <div>{item.eposta}</div>}
          {item.telefon && <div>{item.telefon}</div>}
          {!item.eposta && !item.telefon && item.iletisimBilgisi && <div>{item.iletisimBilgisi}</div>}
        </div>
      )}

      {!bilgiDuzenleAcik && item.notlar && (
        <p className="mt-2 text-sm text-gray-600">{item.notlar}</p>
      )}

      {item.durum === "anlasma" && (
        <div className="mt-3 rounded-lg bg-green-50 p-2.5">
          {item.tahminiCiro && item.tahminiCiroParaBirimi ? (
            <div className="text-sm font-medium text-green-800">
              Tahmini yıllık ciro: {formatTutar(item.tahminiCiro, item.tahminiCiroParaBirimi)}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="number"
                value={ciroGirisi}
                onChange={(e) => setCiroGirisi(e.target.value)}
                placeholder="Tahmini yıllık ciro"
                className="min-w-0 flex-1 rounded-lg border border-green-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-green-400"
              />
              <select
                value={paraBirimiGirisi}
                onChange={(e) => setParaBirimiGirisi(e.target.value as ParaBirimi)}
                className="shrink-0 rounded-lg border border-green-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-green-400"
              >
                {PARA_BIRIMLERI.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <button
                onClick={handleCiroKaydet}
                disabled={busy}
                className="shrink-0 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
              >
                Kaydet
              </button>
            </div>
          )}
        </div>
      )}

      {item.durum === "olumsuz" && (
        <div className="mt-3 rounded-lg bg-red-50 p-2.5">
          {item.kayipSebebi ? (
            <div className="text-sm text-red-800">Kayıp sebebi: {item.kayipSebebi}</div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                value={kayipGirisi}
                onChange={(e) => setKayipGirisi(e.target.value)}
                placeholder="Kayıp sebebi (fiyat, rakip, zamanlama...)"
                className="flex-1 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-red-400"
              />
              <button
                onClick={handleKayipKaydet}
                disabled={busy}
                className="shrink-0 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
              >
                Kaydet
              </button>
            </div>
          )}
        </div>
      )}

      {item.profil === "uretici" && (
        <div className="mt-3 rounded-lg bg-gray-50 p-2.5">
          {rakipBilgisiVar && !rakipFormAcik ? (
            <div className="space-y-1 text-sm">
              {item.urunSegmenti && (
                <div>
                  <span className="text-gray-500">Ürün segmenti: </span>
                  <span className="text-gray-800">{item.urunSegmenti}</span>
                </div>
              )}
              {item.fiyatPozisyonu && (
                <div>
                  <span className="text-gray-500">Fiyat pozisyonu: </span>
                  <span className="text-gray-800">{FIYAT_POZISYONU_LABEL[item.fiyatPozisyonu]}</span>
                </div>
              )}
              {item.gucluYonler && (
                <div>
                  <span className="text-gray-500">Güçlü yönler: </span>
                  <span className="text-gray-800">{item.gucluYonler}</span>
                </div>
              )}
              {item.zayifYonler && (
                <div>
                  <span className="text-gray-500">Zayıf yönler: </span>
                  <span className="text-gray-800">{item.zayifYonler}</span>
                </div>
              )}
              <button
                onClick={() => setRakipFormAcik(true)}
                className="mt-1 text-xs text-gray-400 hover:text-brand-500"
              >
                Düzenle
              </button>
            </div>
          ) : rakipFormAcik ? (
            <div className="space-y-2">
              <input
                value={urunSegmentiGirisi}
                onChange={(e) => setUrunSegmentiGirisi(e.target.value)}
                placeholder="Ürün segmenti (örn. yangın kapısı, otel projeleri)"
                className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-brand-400"
              />
              <select
                value={fiyatPozisyonuGirisi}
                onChange={(e) => setFiyatPozisyonuGirisi(e.target.value as FiyatPozisyonu)}
                className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-brand-400"
              >
                <option value="">Fiyat pozisyonu seçin</option>
                {FIYAT_POZISYONLARI.map((f) => (
                  <option key={f} value={f}>
                    {FIYAT_POZISYONU_LABEL[f]}
                  </option>
                ))}
              </select>
              <input
                value={gucluYonlerGirisi}
                onChange={(e) => setGucluYonlerGirisi(e.target.value)}
                placeholder="Güçlü yönler"
                className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-brand-400"
              />
              <input
                value={zayifYonlerGirisi}
                onChange={(e) => setZayifYonlerGirisi(e.target.value)}
                placeholder="Zayıf yönler"
                className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-brand-400"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setRakipFormAcik(false)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-white"
                >
                  Vazgeç
                </button>
                <button
                  onClick={handleRakipBilgiKaydet}
                  disabled={busy}
                  className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-900"
                >
                  Kaydet
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setRakipFormAcik(true)}
              className="text-xs text-gray-400 hover:text-brand-500"
            >
              + Rakip bilgisi ekle (ürün segmenti, fiyat, güçlü/zayıf yönler)
            </button>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        {item.profil !== "uretici" && (
          <button
            onClick={() => setMesajModalAcik(true)}
            className="flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1 text-xs text-gray-600 transition hover:bg-gray-50"
          >
            <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
              <path d="M2 4l6 4 6-4M2 4v8h12V4M2 4h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Mesaj oluştur
          </button>
        )}
        {confirmDelete ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Silinsin mi?</span>
            <button
              onClick={handleDelete}
              disabled={busy}
              className="font-medium text-red-600 hover:underline"
            >
              Evet, sil
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-gray-500 hover:underline"
            >
              Vazgeç
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="ml-auto text-xs text-gray-400 hover:text-red-600"
          >
            Kaydı sil
          </button>
        )}
      </div>

      {item.sonDegistiren && (
        <p className="mt-2 text-[11px] text-gray-400">Son düzenleyen: {item.sonDegistiren}</p>
      )}

      {mesajModalAcik && (
        <MesajOlusturModal kayit={item} onKapat={() => setMesajModalAcik(false)} />
      )}
    </div>
  );
}
