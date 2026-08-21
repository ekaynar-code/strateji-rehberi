"use client";

import { useState } from "react";
import {
  type Distributor,
  DURUM_LABEL,
  BOLGE_LABEL,
  updateDistributor,
  type Durum,
} from "@/lib/distributors";

const SUTUNLAR: Durum[] = [
  "arastirmada",
  "temas_edildi",
  "yanit_bekleniyor",
  "gorusme_planlandi",
  "anlasma",
];

const SUTUN_RENK: Record<Durum, string> = {
  arastirmada: "border-t-gray-300",
  temas_edildi: "border-t-blue-300",
  yanit_bekleniyor: "border-t-amber-300",
  gorusme_planlandi: "border-t-violet-300",
  anlasma: "border-t-green-300",
  olumsuz: "border-t-red-300",
};

export default function KanbanPano({ items }: { items: Distributor[] }) {
  const [surukleneninId, setSurukleneninId] = useState<string | null>(null);
  const [hedefSutun, setHedefSutun] = useState<Durum | null>(null);

  async function handleDrop(yeniDurum: Durum) {
    setHedefSutun(null);
    if (!surukleneninId) return;
    const kayit = items.find((i) => i.id === surukleneninId);
    setSurukleneninId(null);
    if (!kayit || kayit.durum === yeniDurum) return;
    await updateDistributor(kayit.id, { durum: yeniDurum });
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-3">
      {SUTUNLAR.map((durum) => {
        const kartlar = items.filter((i) => i.durum === durum);
        const suruklemeUzerinde = hedefSutun === durum;

        return (
          <div
            key={durum}
            onDragOver={(e) => {
              e.preventDefault();
              setHedefSutun(durum);
            }}
            onDragLeave={() => setHedefSutun((s) => (s === durum ? null : s))}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(durum);
            }}
            className={`flex w-72 shrink-0 flex-col rounded-xl border-t-4 bg-gray-50 ${SUTUN_RENK[durum]} ${
              suruklemeUzerinde ? "ring-2 ring-brand-300" : ""
            }`}
          >
            <div className="flex items-center justify-between px-3 py-2.5">
              <span className="text-sm font-medium text-gray-700">{DURUM_LABEL[durum]}</span>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs text-gray-500">
                {kartlar.length}
              </span>
            </div>

            <div className="flex flex-col gap-2 px-2 pb-2">
              {kartlar.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-xs text-gray-400">
                  Boş
                </div>
              ) : (
                kartlar.map((item) => (
                  <KanbanKart key={item.id} item={item} onSurukleBasla={() => setSurukleneninId(item.id)} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KanbanKart({ item, onSurukleBasla }: { item: Distributor; onSurukleBasla: () => void }) {
  const [busy, setBusy] = useState(false);

  async function handleMobilDurumDegistir(yeniDurum: Durum) {
    setBusy(true);
    try {
      await updateDistributor(item.id, { durum: yeniDurum });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      draggable
      onDragStart={onSurukleBasla}
      className="cursor-grab rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm active:cursor-grabbing"
    >
      <div className="text-sm font-medium text-gray-900">{item.firmaAdi}</div>
      <div className="mt-0.5 text-xs text-gray-500">
        {item.ulke} · {BOLGE_LABEL[item.bolge]}
      </div>

      {/* Dokunmatik cihazlar için sürüklemeye alternatif: hızlı durum değiştirme */}
      <select
        value={item.durum}
        onChange={(e) => handleMobilDurumDegistir(e.target.value as Durum)}
        disabled={busy}
        className="mt-2 w-full rounded-md border border-gray-200 bg-gray-50 px-1.5 py-1 text-xs text-gray-600 outline-none sm:hidden"
      >
        {(Object.keys(DURUM_LABEL) as Durum[]).map((d) => (
          <option key={d} value={d}>
            {DURUM_LABEL[d]}
          </option>
        ))}
      </select>
    </div>
  );
}
