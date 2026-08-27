"use client";

import { useState } from "react";
import {
  type Fuar,
  FUAR_DURUM_LABEL,
  FUAR_BOLGE_LABEL,
  updateFuar,
  deleteFuar,
  kalanGun,
  type FuarDurum,
} from "@/lib/fuarlar";

const DURUM_RENK: Record<FuarDurum, string> = {
  izleniyor: "bg-gray-100 text-gray-600",
  katilim_planlandi: "bg-violet-50 text-violet-700",
  katilim_kesin: "bg-green-50 text-green-700",
  katilinmayacak: "bg-gray-100 text-gray-400",
  tamamlandi: "bg-gray-100 text-gray-400",
};

function formatTarih(tarih: string): string {
  const d = new Date(tarih + "T00:00:00");
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

export default function FuarCard({ item }: { item: Fuar }) {
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const gun = kalanGun(item.tarih);
  const yaklasiyor = gun >= 0 && gun <= 60 && item.durum !== "tamamlandi" && item.durum !== "katilinmayacak";
  const gecmis = gun < 0;

  async function handleDurumChange(yeniDurum: FuarDurum) {
    setBusy(true);
    try {
      await updateFuar(item.id, { durum: yeniDurum }, item.ad);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await deleteFuar(item.id, item.ad);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`rounded-xl border p-4 ${
        yaklasiyor
          ? "border-amber-300 bg-amber-50/50 ring-1 ring-amber-200"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-gray-900">{item.ad}</span>
            {yaklasiyor && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                {gun === 0 ? "bugün" : `${gun} gün kaldı`}
              </span>
            )}
            {gecmis && item.durum !== "tamamlandi" && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                geçti
              </span>
            )}
          </div>
          <div className="mt-0.5 text-sm text-gray-500">
            {item.lokasyon} · {FUAR_BOLGE_LABEL[item.bolge]}
          </div>
          <div className="mt-0.5 text-sm text-gray-500">{formatTarih(item.tarih)}</div>
        </div>

        <select
          value={item.durum}
          onChange={(e) => handleDurumChange(e.target.value as FuarDurum)}
          disabled={busy}
          className={`w-full shrink-0 rounded-lg border-0 px-2.5 py-1.5 text-sm font-medium outline-none sm:w-auto sm:py-1 sm:text-xs ${DURUM_RENK[item.durum]}`}
        >
          {(Object.keys(FUAR_DURUM_LABEL) as FuarDurum[]).map((d) => (
            <option key={d} value={d}>
              {FUAR_DURUM_LABEL[d]}
            </option>
          ))}
        </select>
      </div>

      {item.notlar && <p className="mt-2 text-sm text-gray-600">{item.notlar}</p>}

      {item.sonDegistiren && (
        <p className="mt-2 text-[11px] text-gray-400">Son düzenleyen: {item.sonDegistiren}</p>
      )}

      <div className="mt-3 flex justify-end">
        {confirmDelete ? (
          <div className="flex items-center gap-3 text-sm">
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
