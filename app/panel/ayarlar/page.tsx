"use client";

import { useEffect, useState } from "react";
import RequireAuth from "@/components/RequireAuth";
import TopBar from "@/components/TopBar";
import PanelTabs from "@/components/PanelTabs";
import CsvIceAktarForm from "@/components/CsvIceAktarForm";
import FuarCsvIceAktarForm from "@/components/FuarCsvIceAktarForm";
import {
  subscribePanelAyarlari,
  panelAyarlariKaydet,
  type PanelAyarlari,
} from "@/lib/panelAyarlari";

const HAREKETSIZLIK_SECENEKLERI = [5, 10, 15, 30, 60];

export default function AyarlarPage() {
  return (
    <RequireAuth>
      <TopBar />
      <PanelTabs />
      <AyarlarContent />
    </RequireAuth>
  );
}

function AyarlarContent() {
  const [ayarlar, setAyarlar] = useState<PanelAyarlari | null>(null);
  const [csvTuru, setCsvTuru] = useState<"firsat" | "fuar" | null>(null);

  useEffect(() => {
    const unsub = subscribePanelAyarlari(
      (a) => setAyarlar(a),
      () => {}
    );
    return () => unsub();
  }, []);

  async function handleHareketsizlikDegistir(dakika: number) {
    await panelAyarlariKaydet({ hareketsizlikSuresiDakika: dakika });
  }

  async function handleTemaDegistir(tema: "acik" | "koyu") {
    await panelAyarlariKaydet({ tema });
  }

  if (!ayarlar) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-5 sm:py-6">
        <p className="text-sm text-gray-500">Yükleniyor…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-5 sm:py-6">
      <h1 className="mb-5 text-lg font-medium text-gray-900">Ayarlar</h1>

      <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-1 text-sm font-medium text-gray-700">Görünüm</h2>
        <p className="mb-3 text-xs text-gray-500">Panelin renk temasını seçin.</p>
        <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
          <button
            onClick={() => handleTemaDegistir("acik")}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
              ayarlar.tema === "acik" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            Açık
          </button>
          <button
            onClick={() => handleTemaDegistir("koyu")}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
              ayarlar.tema === "koyu" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            Koyu
          </button>
        </div>
      </div>

      <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-1 text-sm font-medium text-gray-700">Otomatik oturum kapatma</h2>
        <p className="mb-3 text-xs text-gray-500">
          Belirtilen süre boyunca hiçbir etkileşim olmazsa oturum otomatik kapatılır.
        </p>
        <div className="flex flex-wrap gap-2">
          {HAREKETSIZLIK_SECENEKLERI.map((dk) => (
            <button
              key={dk}
              onClick={() => handleHareketsizlikDegistir(dk)}
              className={`rounded-lg px-3 py-1.5 text-sm transition ${
                ayarlar.hareketsizlikSuresiDakika === dk
                  ? "bg-brand-400 text-white"
                  : "border border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {dk} dk
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-1 text-sm font-medium text-gray-700">Toplu veri içe aktarma</h2>
        <p className="mb-3 text-xs text-gray-500">
          CSV dosyasından satış fırsatı veya fuar kaydı toplu olarak ekleyin.
        </p>
        <div className="mb-3 flex gap-2">
          <button
            onClick={() => setCsvTuru((t) => (t === "firsat" ? null : "firsat"))}
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              csvTuru === "firsat"
                ? "bg-gray-800 text-white"
                : "border border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            Satış fırsatları CSV
          </button>
          <button
            onClick={() => setCsvTuru((t) => (t === "fuar" ? null : "fuar"))}
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              csvTuru === "fuar"
                ? "bg-gray-800 text-white"
                : "border border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            Fuarlar CSV
          </button>
        </div>

        {csvTuru === "firsat" && <CsvIceAktarForm onDone={() => setCsvTuru(null)} />}
        {csvTuru === "fuar" && <FuarCsvIceAktarForm onDone={() => setCsvTuru(null)} />}
      </div>
    </main>
  );
}
