"use client";

import { useState } from "react";
import {
  addFuar,
  FUAR_BOLGE_LABEL,
  FUAR_DURUM_LABEL,
  type FuarBolge,
  type FuarDurum,
} from "@/lib/fuarlar";

const BOLGELER = Object.keys(FUAR_BOLGE_LABEL) as FuarBolge[];
const DURUMLAR = Object.keys(FUAR_DURUM_LABEL) as FuarDurum[];

export default function FuarForm({ onDone }: { onDone: () => void }) {
  const [ad, setAd] = useState("");
  const [lokasyon, setLokasyon] = useState("");
  const [bolge, setBolge] = useState<FuarBolge>("yurt_ici");
  const [tarih, setTarih] = useState("");
  const [durum, setDurum] = useState<FuarDurum>("izleniyor");
  const [notlar, setNotlar] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!ad.trim() || !lokasyon.trim() || !tarih) {
      setError("Etkinlik adı, lokasyon ve tarih alanları zorunlu.");
      return;
    }

    setSubmitting(true);
    try {
      await addFuar({
        ad: ad.trim(),
        lokasyon: lokasyon.trim(),
        bolge,
        tarih,
        durum,
        notlar: notlar.trim() || undefined,
      });
      onDone();
    } catch {
      setError("Kaydedilemedi, tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Etkinlik adı
          </label>
          <input
            value={ad}
            onChange={(e) => setAd(e.target.value)}
            placeholder="örn. Unicera 2027"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 sm:text-sm"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Lokasyon
          </label>
          <input
            value={lokasyon}
            onChange={(e) => setLokasyon(e.target.value)}
            placeholder="örn. İstanbul, Türkiye"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 sm:text-sm"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Tarih
          </label>
          <input
            type="date"
            value={tarih}
            onChange={(e) => setTarih(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 sm:text-sm"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Bölge
          </label>
          <select
            value={bolge}
            onChange={(e) => setBolge(e.target.value as FuarBolge)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 sm:text-sm"
          >
            {BOLGELER.map((b) => (
              <option key={b} value={b}>
                {FUAR_BOLGE_LABEL[b]}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Durum
          </label>
          <select
            value={durum}
            onChange={(e) => setDurum(e.target.value as FuarDurum)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 sm:text-sm"
          >
            {DURUMLAR.map((d) => (
              <option key={d} value={d}>
                {FUAR_DURUM_LABEL[d]}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Notlar
          </label>
          <textarea
            value={notlar}
            onChange={(e) => setNotlar(e.target.value)}
            rows={3}
            placeholder="stant planı, hedef görüşmeler..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 sm:text-sm"
          />
        </div>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-700 transition hover:bg-gray-50"
        >
          Vazgeç
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-brand-400 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-500 disabled:opacity-60"
        >
          {submitting ? "Kaydediliyor…" : "Kaydet"}
        </button>
      </div>
    </form>
  );
}
