"use client";

import { useEffect, useState, useMemo } from "react";
import RequireAuth from "@/components/RequireAuth";
import TopBar from "@/components/TopBar";
import DistributorForm from "@/components/DistributorForm";
import DistributorCard from "@/components/DistributorCard";
import {
  subscribeDistributors,
  type Distributor,
  type Bolge,
  BOLGE_LABEL,
} from "@/lib/distributors";

const BOLGE_FILTRELERI: (Bolge | "hepsi")[] = ["hepsi", "korfez", "balkanlar", "afrika"];

export default function PanelPage() {
  return (
    <RequireAuth>
      <TopBar />
      <PanelContent />
    </RequireAuth>
  );
}

function PanelContent() {
  const [items, setItems] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [bolgeFiltre, setBolgeFiltre] = useState<Bolge | "hepsi">("hepsi");

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
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-stone-900">
            Distribütör ve tedarikçi ortağı takibi
          </h1>
          <p className="text-sm text-stone-500">
            {items.length} kayıt · {filtered.length} gösteriliyor
          </p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800"
        >
          {showForm ? "Formu kapat" : "+ Yeni kayıt"}
        </button>
      </div>

      {showForm && (
        <div className="mb-5">
          <DistributorForm onDone={() => setShowForm(false)} />
        </div>
      )}

      <div className="mb-4 flex gap-2">
        {BOLGE_FILTRELERI.map((b) => (
          <button
            key={b}
            onClick={() => setBolgeFiltre(b)}
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              bolgeFiltre === b
                ? "bg-stone-900 text-white"
                : "border border-stone-300 text-stone-600 hover:bg-stone-50"
            }`}
          >
            {b === "hepsi" ? "Tümü" : BOLGE_LABEL[b]}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-stone-500">Yükleniyor…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-stone-300 p-8 text-center">
          <p className="text-sm text-stone-500">
            {items.length === 0
              ? "Henüz kayıt yok. İlk distribütör/tedarikçi ortağı adayını ekleyin."
              : "Bu bölgede kayıt yok."}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {filtered.map((item) => (
          <DistributorCard key={item.id} item={item} />
        ))}
      </div>
    </main>
  );
}
