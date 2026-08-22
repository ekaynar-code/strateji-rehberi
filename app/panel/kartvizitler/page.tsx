"use client";

import { useEffect, useState } from "react";
import RequireAuth from "@/components/RequireAuth";
import TopBar from "@/components/TopBar";
import PanelTabs from "@/components/PanelTabs";
import KartvizitForm from "@/components/KartvizitForm";
import KartvizitKart from "@/components/KartvizitKart";
import { subscribeKartvizitler, type Kartvizit } from "@/lib/kartvizitler";

export default function KartvizitlerPage() {
  return (
    <RequireAuth>
      <TopBar />
      <PanelTabs />
      <KartvizitlerContent />
    </RequireAuth>
  );
}

function KartvizitlerContent() {
  const [items, setItems] = useState<Kartvizit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeKartvizitler(
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

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5 sm:py-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-medium text-gray-900">Kartvizitler</h1>
          <p className="text-sm text-gray-500">{items.length} kayıt</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="w-full rounded-lg bg-brand-400 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-500 sm:w-auto sm:py-2"
        >
          {showForm ? "Formu kapat" : "+ Yeni kartvizit"}
        </button>
      </div>

      {showForm && (
        <div className="mb-5">
          <KartvizitForm onDone={() => setShowForm(false)} />
        </div>
      )}

      {loading && <p className="text-sm text-gray-500">Yükleniyor…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
          <p className="text-sm text-gray-500">Henüz kartvizit yok. İlk kaydı ekleyin.</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <KartvizitKart key={item.id} item={item} />
        ))}
      </div>
    </main>
  );
}
