"use client";

import { useState, useRef } from "react";
import { csvIceAktar, CSV_ORNEK_BASLIK, type CsvSatirSonucu } from "@/lib/distributors";

export default function CsvIceAktarForm({ onDone }: { onDone: () => void }) {
  const [yukleniyor, setYukleniyor] = useState(false);
  const [sonuclar, setSonuclar] = useState<CsvSatirSonucu[] | null>(null);
  const [genelHata, setGenelHata] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setGenelHata("");
    setSonuclar(null);
    setYukleniyor(true);

    try {
      const metin = await file.text();
      const sonuc = await csvIceAktar(metin);
      setSonuclar(sonuc);
    } catch {
      setGenelHata("Dosya okunamadı. CSV formatında olduğundan emin olun.");
    } finally {
      setYukleniyor(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const basariliSayisi = sonuclar?.filter((s) => s.basarili).length ?? 0;
  const hataliSonuclar = sonuclar?.filter((s) => !s.basarili) ?? [];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
      <div className="mb-3 text-sm font-medium text-gray-700">CSV ile toplu ekleme</div>

      <p className="mb-2 text-sm text-gray-500">
        Sütun başlıkları şu şekilde olmalı (ilk satır):
      </p>
      <code className="mb-3 block overflow-x-auto rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
        {CSV_ORNEK_BASLIK}
      </code>
      <p className="mb-4 text-xs text-gray-400">
        bolge: korfez / balkanlar / afrika / turkiye · profil: uretici / insaat_firmasi /
        mimarlik_firmasi / araci_sirket · iletisimKisisi, eposta, telefon ve notlar opsiyoneldir.
      </p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFile}
          disabled={yukleniyor}
          className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-400 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-brand-500"
        />
        <button
          type="button"
          onClick={onDone}
          className="shrink-0 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
        >
          Kapat
        </button>
      </div>

      {yukleniyor && <p className="mt-3 text-sm text-gray-500">Yükleniyor…</p>}
      {genelHata && <p className="mt-3 text-sm text-red-600">{genelHata}</p>}

      {sonuclar && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-gray-700">
            {basariliSayisi} kayıt eklendi
            {hataliSonuclar.length > 0 && `, ${hataliSonuclar.length} satırda hata var`}
          </p>
          {hataliSonuclar.length > 0 && (
            <div className="flex flex-col gap-1">
              {hataliSonuclar.map((s) => (
                <p key={s.satirNo} className="text-xs text-red-600">
                  Satır {s.satirNo} ({s.firmaAdi}): {s.hata}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
