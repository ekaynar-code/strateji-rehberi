"use client";

import { useEffect, useState, useMemo } from "react";
import RequireAuth from "@/components/RequireAuth";
import TopBar from "@/components/TopBar";
import PanelTabs from "@/components/PanelTabs";
import KurSeridi from "@/components/KurSeridi";
import FuarForm from "@/components/FuarForm";
import FuarCard from "@/components/FuarCard";
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
      <KurSeridi />
      <FuarlarContent />
    </RequireAuth>
  );
}

function FuarlarContent() {
  const [items, setItems] = useState<Fuar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
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

  const yaklasanSayisi = useMemo(
    () =>
      items.filter((i) => {
        const gun = kalanGun(i.tarih);
        return gun >= 0 && gun <= 30 && i.durum !== "tamamlandi" && i.durum !== "katilinmayacak";
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
              <span className="text-amber-700"> · {yaklasanSayisi} tanesi 30 gün içinde</span>
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {filtered.map((item) => (
          <FuarCard key={item.id} item={item} />
        ))}
      </div>
    </main>
  );
}
