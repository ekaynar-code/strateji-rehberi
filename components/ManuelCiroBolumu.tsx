"use client";

import { useState, useMemo } from "react";
import { manuelCiroEkle, manuelCiroSil, type ManuelCiroKaydi } from "@/lib/manuelCiro";
import { tryyeCevir, type KurVeri } from "@/lib/kurlar";
import type { ParaBirimi } from "@/lib/distributors";

const PARA_BIRIMLERI: ParaBirimi[] = ["TRY", "USD", "EUR"];
const PARA_SEMBOLU: Record<ParaBirimi, string> = { TRY: "₺", USD: "$", EUR: "€" };

function formatTutar(deger: number, paraBirimi: ParaBirimi): string {
  return `${PARA_SEMBOLU[paraBirimi]}${deger.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}`;
}

function formatTarih(tarih: string): string {
  const d = new Date(tarih + "T00:00:00");
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
}

export default function ManuelCiroBolumu({
  kayitlar,
  acik,
  onAcikDegistir,
  kur,
}: {
  kayitlar: ManuelCiroKaydi[];
  acik: boolean;
  onAcikDegistir: (deger: boolean) => void;
  kur: KurVeri;
}) {
  const [tutar, setTutar] = useState("");
  const [paraBirimi, setParaBirimi] = useState<ParaBirimi>("TRY");
  const [not, setNot] = useState("");
  const [tarih, setTarih] = useState(() => new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [detayAcik, setDetayAcik] = useState(false);

  const toplamTry = useMemo(
    () =>
      kayitlar.reduce((toplam, k) => {
        const deger = tryyeCevir(k.tutar, k.paraBirimi, kur);
        return toplam + (deger ?? 0);
      }, 0),
    [kayitlar, kur]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const sayi = parseFloat(tutar);
    if (isNaN(sayi) || sayi <= 0) {
      setError("Geçerli bir tutar girin.");
      return;
    }
    if (!not.trim()) {
      setError("Kısa bir not girin (örn. hangi satış, kim onayladı).");
      return;
    }
    setSubmitting(true);
    try {
      await manuelCiroEkle(sayi, paraBirimi, not.trim(), tarih);
      setTutar("");
      setNot("");
      onAcikDegistir(false);
    } catch {
      setError("Kaydedilemedi, tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Manuel ciro kayıtları</span>
        <button
          onClick={() => onAcikDegistir(!acik)}
          className="text-xs text-gray-400 hover:text-brand-500"
        >
          {acik ? "Kapat" : "+ Kayıt ekle"}
        </button>
      </div>

      {acik && (
        <form onSubmit={handleSubmit} className="mb-3 rounded-xl border border-gray-200 bg-white p-3">
          <div className="mb-2 flex flex-wrap gap-2">
            <input
              type="number"
              value={tutar}
              onChange={(e) => setTutar(e.target.value)}
              placeholder="Tutar"
              className="min-w-0 flex-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm outline-none focus:border-brand-400"
            />
            <select
              value={paraBirimi}
              onChange={(e) => setParaBirimi(e.target.value as ParaBirimi)}
              className="shrink-0 rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-brand-400"
            >
              {PARA_BIRIMLERI.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={tarih}
              onChange={(e) => setTarih(e.target.value)}
              className="shrink-0 rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm outline-none focus:border-brand-400"
            />
          </div>
          <input
            value={not}
            onChange={(e) => setNot(e.target.value)}
            placeholder="Not (örn. doğrudan sipariş, eski müşteri yenilemesi...)"
            className="mb-2 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm outline-none focus:border-brand-400"
          />
          {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => onAcikDegistir(false)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-brand-400 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-60"
            >
              Kaydet
            </button>
          </div>
        </form>
      )}

      {kayitlar.length > 0 && (
        <div>
          <button
            onClick={() => setDetayAcik((d) => !d)}
            className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left transition hover:bg-gray-50"
          >
            <span className="flex items-center gap-1.5 text-sm text-gray-700">
              <svg
                viewBox="0 0 16 16"
                fill="none"
                className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform ${detayAcik ? "rotate-90" : ""}`}
              >
                <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {kayitlar.length} manuel kayıt
            </span>
            <span className="font-medium text-gray-900">₺{Math.round(toplamTry).toLocaleString("tr-TR")}</span>
          </button>

          {detayAcik && (
            <div className="mt-1.5 flex flex-col gap-1.5">
              {kayitlar.map((k) => (
                <ManuelCiroSatiri key={k.id} kayit={k} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ManuelCiroSatiri({ kayit }: { kayit: ManuelCiroKaydi }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    setBusy(true);
    try {
      await manuelCiroSil(kayit.id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
      <div className="min-w-0">
        <span className="font-medium text-gray-900">{formatTutar(kayit.tutar, kayit.paraBirimi)}</span>
        <span className="ml-2 text-gray-500">{kayit.not}</span>
        <span className="ml-2 text-xs text-gray-400">{formatTarih(kayit.tarih)}</span>
      </div>
      {confirmDelete ? (
        <div className="flex shrink-0 items-center gap-2 text-xs">
          <button onClick={handleDelete} disabled={busy} className="font-medium text-red-600 hover:underline">
            Evet, sil
          </button>
          <button onClick={() => setConfirmDelete(false)} className="text-gray-500 hover:underline">
            Vazgeç
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirmDelete(true)}
          className="shrink-0 text-xs text-gray-300 hover:text-red-600"
        >
          Sil
        </button>
      )}
    </div>
  );
}
