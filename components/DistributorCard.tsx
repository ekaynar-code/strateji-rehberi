"use client";

import { useState } from "react";
import {
  type Distributor,
  DURUM_LABEL,
  PROFIL_LABEL,
  BOLGE_LABEL,
  updateDistributor,
  deleteDistributor,
  type Durum,
  type ParaBirimi,
} from "@/lib/distributors";

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

function formatTutar(deger: number, paraBirimi: ParaBirimi): string {
  return `${PARA_SEMBOLU[paraBirimi]}${deger.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}`;
}

export default function DistributorCard({ item }: { item: Distributor }) {
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [ciroGirisi, setCiroGirisi] = useState(item.tahminiCiro?.toString() || "");
  const [paraBirimiGirisi, setParaBirimiGirisi] = useState<ParaBirimi>(item.tahminiCiroParaBirimi || "TRY");
  const [kayipGirisi, setKayipGirisi] = useState(item.kayipSebebi || "");

  async function handleDurumChange(yeniDurum: Durum) {
    setBusy(true);
    try {
      await updateDistributor(item.id, { durum: yeniDurum });
    } finally {
      setBusy(false);
    }
  }

  async function handleCiroKaydet() {
    const sayi = parseFloat(ciroGirisi);
    if (isNaN(sayi) || sayi <= 0) return;
    setBusy(true);
    try {
      await updateDistributor(item.id, { tahminiCiro: sayi, tahminiCiroParaBirimi: paraBirimiGirisi });
    } finally {
      setBusy(false);
    }
  }

  async function handleKayipKaydet() {
    if (!kayipGirisi.trim()) return;
    setBusy(true);
    try {
      await updateDistributor(item.id, { kayipSebebi: kayipGirisi.trim() });
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await deleteDistributor(item.id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="font-medium text-gray-900">{item.firmaAdi}</div>
          <div className="mt-0.5 text-sm text-gray-500">
            {item.ulke} · {BOLGE_LABEL[item.bolge]} · {PROFIL_LABEL[item.profil]}
          </div>
        </div>
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
      </div>

      {(item.iletisimKisisi || item.iletisimBilgisi) && (
        <div className="mt-2 text-sm text-gray-600">
          {item.iletisimKisisi}
          {item.iletisimKisisi && item.iletisimBilgisi ? " · " : ""}
          {item.iletisimBilgisi}
        </div>
      )}

      {item.notlar && (
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

      <div className="mt-3 flex justify-end">
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
            className="text-xs text-gray-400 hover:text-red-600"
          >
            Kaydı sil
          </button>
        )}
      </div>
    </div>
  );
}
