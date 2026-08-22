"use client";

import { useState } from "react";
import { kartvizitEkle } from "@/lib/kartvizitler";

export default function KartvizitForm({ onDone }: { onDone: () => void }) {
  const [adSoyad, setAdSoyad] = useState("");
  const [unvan, setUnvan] = useState("");
  const [sirket, setSirket] = useState("");
  const [telefon, setTelefon] = useState("");
  const [eposta, setEposta] = useState("");
  const [web, setWeb] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!adSoyad.trim()) {
      setError("Ad soyad zorunlu.");
      return;
    }

    setSubmitting(true);
    try {
      await kartvizitEkle({
        adSoyad: adSoyad.trim(),
        unvan: unvan.trim() || undefined,
        sirket: sirket.trim() || undefined,
        telefon: telefon.trim() || undefined,
        eposta: eposta.trim() || undefined,
        web: web.trim() || undefined,
      });
      onDone();
    } catch {
      setError("Kaydedilemedi, tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Ad Soyad</label>
          <input
            value={adSoyad}
            onChange={(e) => setAdSoyad(e.target.value)}
            placeholder="örn. Ahmet Yılmaz"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 sm:text-sm"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Unvan</label>
          <input
            value={unvan}
            onChange={(e) => setUnvan(e.target.value)}
            placeholder="opsiyonel"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 sm:text-sm"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Şirket</label>
          <input
            value={sirket}
            onChange={(e) => setSirket(e.target.value)}
            placeholder="opsiyonel"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 sm:text-sm"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Telefon</label>
          <input
            value={telefon}
            onChange={(e) => setTelefon(e.target.value)}
            placeholder="opsiyonel"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 sm:text-sm"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">E-posta</label>
          <input
            value={eposta}
            onChange={(e) => setEposta(e.target.value)}
            placeholder="opsiyonel"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 sm:text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Web sitesi</label>
          <input
            value={web}
            onChange={(e) => setWeb(e.target.value)}
            placeholder="opsiyonel"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 sm:text-sm"
          />
        </div>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
        >
          Vazgeç
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-brand-400 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-500 disabled:opacity-60"
        >
          {submitting ? "Kaydediliyor…" : "Kaydet"}
        </button>
      </div>
    </form>
  );
}
