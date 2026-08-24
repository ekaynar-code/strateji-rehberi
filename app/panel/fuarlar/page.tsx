"use client";

import { useEffect, useState, useMemo } from "react";
import RequireAuth from "@/components/RequireAuth";
import TopBar from "@/components/TopBar";
import PanelTabs from "@/components/PanelTabs";
import FuarForm from "@/components/FuarForm";
import FuarCard from "@/components/FuarCard";
import FuarCsvIceAktarForm from "@/components/FuarCsvIceAktarForm";
import {
  subscribeFuarlar,
  type Fuar,
  type FuarBolge,
  FUAR_BOLGE_LABEL,
  kalanGun,
} from "@/lib/fuarlar";

const BOLGE_FILTRELERI: (FuarBolge | "hepsi")[] = [
  "hepsi",
  "korfez",
  "balkanlar",
  "afrika",
  "yurt_ici",
  "diger",
];

export default function FuarlarPage() {
  return (
    <RequireAuth>
      <TopBar />
      <PanelTabs />
      <FuarlarContent />
    </RequireAuth>
  );
}

function FuarlarContent() {
  const [items, setItems] = useState<Fuar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showCsvForm, setShowCsvForm] = useState(false);
  const [bolgeFiltre, setBolgeFiltre] = useState<FuarBolge | "hepsi">("hepsi");

  useEffect(() => {
    const unsubscribe = subscribeFuarlar(
      (data) => {
        setItems(data);
        setLoading(false);
      },
      () => {
        setError("Veriler yüklenemedi. Firestore güvenlik kurallarını kontrol edin.");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const filtered = useMemo(
    () => (bolgeFiltre === "hepsi" ? items : items.filter((i) => i.bolge === bolgeFiltre)),
    [items, bolgeFiltre]
  );

  const aktifFuarlar = useMemo(
    () => filtered.filter((i) => i.durum !== "katilinmayacak"),
    [filtered]
  );
  const katilinmayacakFuarlar = useMemo(
    () => filtered.filter((i) => i.durum === "katilinmayacak"),
    [filtered]
  );
  const [arsivAcik, setArsivAcik] = useState(false);

  const yaklasanSayisi = useMemo(
    () =>
      items.filter((i) => {
        const gun = kalanGun(i.tarih);
        return gun >= 0 && gun <= 60 && i.durum !== "tamamlandi" && i.durum !== "katilinmayacak";
      }).length,
    [items]
  );

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-5 sm:py-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-medium text-gray-900">Fuar ve etkinlik takibi</h1>
          <p className="text-sm text-gray-500">
            {items.length} kayıt
            {yaklasanSayisi > 0 && (
              <span className="text-amber-700"> · {yaklasanSayisi} tanesi 60 gün içinde</span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="w-full rounded-lg bg-brand-400 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-500 sm:w-auto sm:py-2"
        >
          {showForm ? "Formu kapat" : "+ Yeni etkinlik"}
        </button>
      </div>

      {showForm && (
        <div className="mb-5">
          <FuarForm onDone={() => setShowForm(false)} />
        </div>
      )}

      <div className="mb-5 flex justify-end">
        <button
          onClick={() => setShowCsvForm((s) => !s)}
          className="text-sm text-gray-500 underline decoration-dotted hover:text-brand-500"
        >
          {showCsvForm ? "CSV içe aktarmayı kapat" : "CSV ile toplu ekle"}
        </button>
      </div>

      {showCsvForm && (
        <div className="mb-5">
          <FuarCsvIceAktarForm onDone={() => setShowCsvForm(false)} />
        </div>
      )}

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {BOLGE_FILTRELERI.map((b) => (
          <button
            key={b}
            onClick={() => setBolgeFiltre(b)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm transition ${
              bolgeFiltre === b
                ? "bg-brand-400 text-white"
                : "border border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {b === "hepsi" ? "Tümü" : FUAR_BOLGE_LABEL[b]}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-gray-500">Yükleniyor…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
          <p className="text-sm text-gray-500">
            {items.length === 0
              ? "Henüz kayıt yok. İlk fuar veya etkinliği ekleyin."
              : "Bu bölgede kayıt yok."}
          </p>
        </div>
      )}

      {aktifFuarlar.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {aktifFuarlar.map((item) => (
            <FuarCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {katilinmayacakFuarlar.length > 0 && (
        <div className="mt-5">
          <button
            onClick={() => setArsivAcik((a) => !a)}
            className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-left transition hover:bg-gray-100"
          >
            <span className="flex items-center gap-1.5 text-sm text-gray-600">
              <svg
                viewBox="0 0 16 16"
                fill="none"
                className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform ${arsivAcik ? "rotate-90" : ""}`}
              >
                <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Katılınmayacak ({katilinmayacakFuarlar.length})
            </span>
          </button>

          {arsivAcik && (
            <div className="mt-2 grid grid-cols-1 gap-3 opacity-70 sm:grid-cols-2">
              {katilinmayacakFuarlar.map((item) => (
                <FuarCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
