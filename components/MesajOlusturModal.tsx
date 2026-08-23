"use client";

import { useState, useMemo } from "react";
import {
  uygunMesajTipleri,
  mesajTipiEtiketi,
  mesajOlustur,
  type MesajDili,
  type MesajTipi,
} from "@/lib/mesajSablonlari";
import type { Distributor } from "@/lib/distributors";

export default function MesajOlusturModal({
  kayit,
  onKapat,
}: {
  kayit: Distributor;
  onKapat: () => void;
}) {
  const tipler = useMemo(() => uygunMesajTipleri(kayit.durum), [kayit.durum]);
  const [tip, setTip] = useState<MesajTipi>(tipler[0]);
  const [dil, setDil] = useState<MesajDili>("tr");
  const [kopyalandi, setKopyalandi] = useState(false);

  const mesaj = useMemo(
    () => mesajOlustur(kayit, tip, dil, {}),
    [kayit, tip, dil]
  );

  async function handleKopyala() {
    const tamMetin =
      dil === "tr" ? `Konu: ${mesaj.konu}\n\n${mesaj.govde}` : `Subject: ${mesaj.konu}\n\n${mesaj.govde}`;
    try {
      await navigator.clipboard.writeText(tamMetin);
      setKopyalandi(true);
      setTimeout(() => setKopyalandi(false), 2000);
    } catch {
      // sessizce geç
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 p-4 pt-16 sm:pt-24">
      <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
          <div>
            <h2 className="text-base font-medium text-gray-900">Mesaj taslağı</h2>
            <p className="text-xs text-gray-500">{kayit.firmaAdi}</p>
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
          <div className="mb-3 flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
            <button
              onClick={() => setDil("tr")}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                dil === "tr" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
              }`}
            >
              Türkçe
            </button>
            <button
              onClick={() => setDil("en")}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                dil === "en" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
              }`}
            >
              English
            </button>
          </div>

          <div className="mb-4 flex flex-wrap gap-1.5">
            {tipler.map((t) => (
              <button
                key={t}
                onClick={() => setTip(t)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  tip === t ? "bg-brand-400 text-white" : "border border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {mesajTipiEtiketi(t, dil)}
              </button>
            ))}
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="mb-2 text-xs font-medium text-gray-500">
              {dil === "tr" ? "Konu" : "Subject"}
            </div>
            <div className="mb-3 text-sm text-gray-800">{mesaj.konu}</div>
            <div className="mb-2 text-xs font-medium text-gray-500">
              {dil === "tr" ? "Mesaj" : "Message"}
            </div>
            <div className="whitespace-pre-wrap text-sm text-gray-800">{mesaj.govde}</div>
          </div>

          <button
            onClick={handleKopyala}
            className="mt-3 w-full rounded-lg bg-brand-400 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-500"
          >
            {kopyalandi ? "Kopyalandı ✓" : "Metni kopyala"}
          </button>
        </div>
      </div>
    </div>
  );
}
