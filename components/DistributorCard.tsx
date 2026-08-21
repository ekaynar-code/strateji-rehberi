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
} from "@/lib/distributors";

const DURUM_RENK: Record<Durum, string> = {
  arastirmada: "bg-stone-100 text-stone-600",
  temas_edildi: "bg-blue-50 text-blue-700",
  yanit_bekleniyor: "bg-amber-50 text-amber-700",
  gorusme_planlandi: "bg-violet-50 text-violet-700",
  anlasma: "bg-green-50 text-green-700",
  olumsuz: "bg-red-50 text-red-700",
};

export default function DistributorCard({ item }: { item: Distributor }) {
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleDurumChange(yeniDurum: Durum) {
    setBusy(true);
    try {
      await updateDistributor(item.id, { durum: yeniDurum });
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
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="font-medium text-stone-900">{item.firmaAdi}</div>
          <div className="mt-0.5 text-sm text-stone-500">
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
        <div className="mt-2 text-sm text-stone-600">
          {item.iletisimKisisi}
          {item.iletisimKisisi && item.iletisimBilgisi ? " · " : ""}
          {item.iletisimBilgisi}
        </div>
      )}

      {item.notlar && (
        <p className="mt-2 text-sm text-stone-600">{item.notlar}</p>
      )}

      <div className="mt-3 flex justify-end">
        {confirmDelete ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-stone-500">Silinsin mi?</span>
            <button
              onClick={handleDelete}
              disabled={busy}
              className="font-medium text-red-600 hover:underline"
            >
              Evet, sil
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-stone-500 hover:underline"
            >
              Vazgeç
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-xs text-stone-400 hover:text-red-600"
          >
            Kaydı sil
          </button>
        )}
      </div>
    </div>
  );
}
