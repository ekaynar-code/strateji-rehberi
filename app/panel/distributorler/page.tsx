"use client";

import { useEffect, useState, useMemo } from "react";
import RequireAuth from "@/components/RequireAuth";
import TopBar from "@/components/TopBar";
import PanelTabs from "@/components/PanelTabs";
import DistributorForm from "@/components/DistributorForm";
import DistributorCard from "@/components/DistributorCard";
import CsvIceAktarForm from "@/components/CsvIceAktarForm";
import KanbanPano from "@/components/KanbanPano";
import {
  subscribeDistributors,
  type Distributor,
  type Bolge,
  BOLGE_LABEL,
} from "@/lib/distributors";

const BOLGE_FILTRELERI: (Bolge | "hepsi")[] = ["hepsi", "turkiye", "korfez", "balkanlar", "afrika"];

export default function PanelPage() {
  return (
    <RequireAuth>
      <TopBar />
      <PanelTabs />
      <PanelContent />
    </RequireAuth>
  );
}

function PanelContent() {
  const [items, setItems] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showCsvForm, setShowCsvForm] = useState(false);
  const [bolgeFiltre, setBolgeFiltre] = useState<Bolge | "hepsi">("hepsi");
  const [gorunum, setGorunum] = useState<"liste" | "kanban">("liste");

  useEffect(() => {
    const unsubscribe = subscribeDistributors(
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

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-5 sm:py-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-medium text-gray-900">
            Satış Fırsatları
          </h1>
          <p className="text-sm text-gray-500">
            {items.length} kayıt · {filtered.length} gösteriliyor
          </p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="w-full rounded-lg bg-brand-400 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-500 sm:w-auto sm:py-2"
        >
          {showForm ? "Formu kapat" : "+ Yeni kayıt"}
        </button>
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
          <button
            onClick={() => setGorunum("liste")}
            className={`rounded-md px-3 py-1 text-sm font-medium transition ${
              gorunum === "liste" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            Liste
          </button>
          <button
            onClick={() => setGorunum("kanban")}
            className={`rounded-md px-3 py-1 text-sm font-medium transition ${
              gorunum === "kanban" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            Kanban
          </button>
        </div>
        <button
          onClick={() => setShowCsvForm((s) => !s)}
          className="text-sm text-gray-500 underline decoration-dotted hover:text-brand-500"
        >
          {showCsvForm ? "CSV içe aktarmayı kapat" : "CSV ile toplu ekle"}
        </button>
      </div>

      {showCsvForm && (
        <div className="mb-5">
          <CsvIceAktarForm onDone={() => setShowCsvForm(false)} />
        </div>
      )}

      {showForm && (
        <div className="mb-5">
          <DistributorForm onDone={() => setShowForm(false)} />
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
            {b === "hepsi" ? "Tümü" : BOLGE_LABEL[b]}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-gray-500">Yükleniyor…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
          <p className="text-sm text-gray-500">
            {items.length === 0
              ? "Henüz kayıt yok. İlk satış fırsatını ekleyin."
              : "Bu bölgede kayıt yok."}
          </p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        gorunum === "kanban" ? (
          <KanbanPano items={filtered} />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filtered.map((item) => (
              <DistributorCard key={item.id} item={item} />
            ))}
          </div>
        )
      )}
    </main>
  );
}
