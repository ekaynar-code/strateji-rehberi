"use client";

import { useEffect, useState } from "react";
import KartvizitForm from "@/components/KartvizitForm";
import KartvizitKart from "@/components/KartvizitKart";
import { subscribeKartvizitler, type Kartvizit } from "@/lib/kartvizitler";

export default function KartvizitlerModal({ onKapat }: { onKapat: () => void }) {
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
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 p-4 pt-16 sm:pt-24">
      <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
          <div>
            <h2 className="text-base font-medium text-gray-900">Kartvizitler</h2>
            <p className="text-xs text-gray-500">{items.length} kayıt</p>
          </div>
          <button
            onClick={onKapat}
            aria-label="Kapat"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => setShowForm((s) => !s)}
              className="rounded-lg bg-brand-400 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-brand-500"
            >
              {showForm ? "Formu kapat" : "+ Yeni kartvizit"}
            </button>
          </div>

          {showForm && (
            <div className="mb-4">
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
        </div>
      </div>
    </div>
  );
}
