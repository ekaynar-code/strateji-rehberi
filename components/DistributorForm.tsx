"use client";

import { useState } from "react";
import {
  addDistributor,
  BOLGE_LABEL,
  PROFIL_LABEL,
  DURUM_LABEL,
  type Bolge,
  type Profil,
  type Durum,
} from "@/lib/distributors";

const BOLGELER = Object.keys(BOLGE_LABEL) as Bolge[];
const PROFILLER = Object.keys(PROFIL_LABEL) as Profil[];
const DURUMLAR = Object.keys(DURUM_LABEL) as Durum[];

export default function DistributorForm({ onDone }: { onDone: () => void }) {
  const [firmaAdi, setFirmaAdi] = useState("");
  const [ulke, setUlke] = useState("");
  const [bolge, setBolge] = useState<Bolge>("balkanlar");
  const [rakipMi, setRakipMi] = useState(false);
  const [profil, setProfil] = useState<Profil>("distributor");
  const [durum, setDurum] = useState<Durum>("arastirmada");
  const [iletisimKisisi, setIletisimKisisi] = useState("");
  const [iletisimBilgisi, setIletisimBilgisi] = useState("");
  const [notlar, setNotlar] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!firmaAdi.trim() || !ulke.trim()) {
      setError("Firma adı ve ülke alanları zorunlu.");
      return;
    }

    setSubmitting(true);
    try {
      await addDistributor({
        firmaAdi: firmaAdi.trim(),
        ulke: ulke.trim(),
        bolge,
        profil: rakipMi ? "uretici" : profil,
        durum,
        iletisimKisisi: iletisimKisisi.trim() || undefined,
        iletisimBilgisi: iletisimBilgisi.trim() || undefined,
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
      className="rounded-xl border border-gray-200 bg-white p-5"
    >
      <label className="mb-4 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-sm">
        <input
          type="checkbox"
          checked={rakipMi}
          onChange={(e) => setRakipMi(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-brand-400 focus:ring-brand-400"
        />
        <span className="font-medium text-gray-700">
          Bu bir rakip kaydı (müşteri/tedarikçi ortağı değil)
        </span>
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Firma adı
          </label>
          <input
            value={firmaAdi}
            onChange={(e) => setFirmaAdi(e.target.value)}
            placeholder="örn. Arcoma Bulgaria"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Ülke
          </label>
          <input
            value={ulke}
            onChange={(e) => setUlke(e.target.value)}
            placeholder="örn. Bulgaristan"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Bölge
          </label>
          <select
            value={bolge}
            onChange={(e) => setBolge(e.target.value as Bolge)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
          >
            {BOLGELER.map((b) => (
              <option key={b} value={b}>
                {BOLGE_LABEL[b]}
              </option>
            ))}
          </select>
        </div>
        {!rakipMi && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Profil
            </label>
            <select
              value={profil}
              onChange={(e) => setProfil(e.target.value as Profil)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
            >
              {PROFILLER.filter((p) => p !== "uretici").map((p) => (
                <option key={p} value={p}>
                  {PROFIL_LABEL[p]}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Durum
          </label>
          <select
            value={durum}
            onChange={(e) => setDurum(e.target.value as Durum)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
          >
            {DURUMLAR.map((d) => (
              <option key={d} value={d}>
                {DURUM_LABEL[d]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            İletişim kişisi
          </label>
          <input
            value={iletisimKisisi}
            onChange={(e) => setIletisimKisisi(e.target.value)}
            placeholder="opsiyonel"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            İletişim bilgisi (e-posta / telefon)
          </label>
          <input
            value={iletisimBilgisi}
            onChange={(e) => setIletisimBilgisi(e.target.value)}
            placeholder="opsiyonel"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Notlar
          </label>
          <textarea
            value={notlar}
            onChange={(e) => setNotlar(e.target.value)}
            rows={3}
            placeholder="görüşme özeti, gözlemler..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
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
