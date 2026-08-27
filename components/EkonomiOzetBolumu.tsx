"use client";

import { useEffect, useState } from "react";
import {
  ekonomiApiBagliMi,
  ekonomiVerileriGetir,
  type EkonomiVeri,
} from "@/lib/ekonomiApi";

function sayiGoster(g: { deger?: number; hata?: string } | undefined, birim = "", ondalik = 2): string {
  if (!g || g.deger === undefined) return "—";
  return `${g.deger.toLocaleString("tr-TR", { maximumFractionDigits: ondalik })}${birim}`;
}

export default function EkonomiOzetBolumu() {
  const [bagli, setBagli] = useState(false);
  const [acik, setAcik] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState(false);
  const [veri, setVeri] = useState<EkonomiVeri | null>(null);

  useEffect(() => {
    if (!ekonomiApiBagliMi()) {
      setBagli(false);
      setYukleniyor(false);
      return;
    }
    setBagli(true);
    ekonomiVerileriGetir()
      .then((v) => setVeri(v))
      .catch(() => setHata(true))
      .finally(() => setYukleniyor(false));
  }, []);

  if (!bagli || yukleniyor) return null;

  if (hata && !veri) {
    return (
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-3 text-xs text-gray-400">
        Ekonomi verileri şu anda alınamıyor.
      </div>
    );
  }

  if (!veri) return null;

  return (
    <div className="mb-6">
      <button
        onClick={() => setAcik((a) => !a)}
        className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-left transition hover:border-brand-300 hover:bg-brand-50/30"
      >
        <div className="flex items-center gap-1.5">
          <svg
            viewBox="0 0 16 16"
            fill="none"
            className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform ${acik ? "rotate-90" : ""}`}
          >
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-sm font-medium text-gray-700">Ekonomi analizi</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {veri.politikaFaizi.deger !== undefined && (
            <span>
              Faiz <span className="font-medium text-gray-900">%{veri.politikaFaizi.deger.toFixed(1)}</span>
            </span>
          )}
          {veri.usdTry.deger !== undefined && (
            <span>
              USD <span className="font-medium text-gray-900">{veri.usdTry.deger.toFixed(2)}</span>
            </span>
          )}
        </div>
      </button>

      {acik && (
        <div className="mt-1.5 rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <div className="text-xs text-gray-500">Politika faizi (AOFM)</div>
              <div className="text-lg font-medium text-gray-900">
                {veri.politikaFaizi.deger !== undefined ? `%${veri.politikaFaizi.deger.toFixed(2)}` : "—"}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">USD/TRY</div>
              <div className="text-lg font-medium text-gray-900">{sayiGoster(veri.usdTry)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">EUR/TRY</div>
              <div className="text-lg font-medium text-gray-900">{sayiGoster(veri.eurTry)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Yıllık TÜFE</div>
              <div className="text-lg font-medium text-gray-900">
                {veri.enflasyonYillik.deger !== undefined ? `%${veri.enflasyonYillik.deger.toFixed(1)}` : "—"}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">İhracat hacmi (yıllık değ.)</div>
              <div className="text-lg font-medium text-gray-900">
                {veri.ihracatHacmiEndeksi.deger !== undefined
                  ? `${veri.ihracatHacmiEndeksi.deger >= 0 ? "+" : ""}%${veri.ihracatHacmiEndeksi.deger.toFixed(1)}`
                  : "—"}
              </div>
            </div>
          </div>

          {veri.yorumlar.length > 0 && (
            <div className="border-t border-gray-100 pt-3">
              <div className="mb-1.5 text-xs font-medium text-gray-500">Genel değerlendirme</div>
              <ul className="flex flex-col gap-1.5">
                {veri.yorumlar.map((y, i) => (
                  <li key={i} className="text-xs text-gray-600">
                    {y}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-3 text-[10px] text-gray-400">Kaynak: TCMB EVDS</p>
        </div>
      )}
    </div>
  );
}
