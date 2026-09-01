"use client";

import { useEffect, useState } from "react";
import {
  uretimApiBagliMi,
  sorunlarGetir,
  sorunCozuldu,
  type Sorun,
} from "@/lib/uretimApi";

const TIP_LABEL: Record<string, string> = {
  hat_ariza: "Hat arızası",
  siparis_sorun: "Sipariş sorunu",
};

const TIP_RENK: Record<string, string> = {
  hat_ariza: "bg-red-100 text-red-700",
  siparis_sorun: "bg-amber-100 text-amber-700",
};

export default function ArizaSorunlarBolumu() {
  const [bagli, setBagli] = useState(false);
  const [acik, setAcik] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState(false);
  const [sorunlar, setSorunlar] = useState<Sorun[]>([]);
  const [cozulenId, setCozulenId] = useState<string | null>(null);
  const [notGirisi, setNotGirisi] = useState("");
  const [kaydediliyor, setKaydediliyor] = useState(false);

  function yukle() {
    sorunlarGetir()
      .then((s) => setSorunlar(s))
      .catch(() => setHata(true))
      .finally(() => setYukleniyor(false));
  }

  useEffect(() => {
    if (!uretimApiBagliMi()) {
      setBagli(false);
      setYukleniyor(false);
      return;
    }
    setBagli(true);
    yukle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCozulduKaydet(id: string) {
    setKaydediliyor(true);
    try {
      await sorunCozuldu(id, notGirisi.trim());
      setCozulenId(null);
      setNotGirisi("");
      yukle();
    } catch {
      setHata(true);
    } finally {
      setKaydediliyor(false);
    }
  }

  if (!bagli || yukleniyor) return null;

  if (hata && sorunlar.length === 0) {
    return (
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-3 text-xs text-gray-400">
        Arıza/sorun verileri şu anda alınamıyor.
      </div>
    );
  }

  const acikSorunlar = sorunlar.filter((s) => s.durum === "acik");
  const hatArizaSayisi = acikSorunlar.filter((s) => s.tip === "hat_ariza").length;
  const siparisSorunSayisi = acikSorunlar.filter((s) => s.tip === "siparis_sorun").length;

  return (
    <div className="mb-6">
      <button
        onClick={() => setAcik((a) => !a)}
        className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
          acikSorunlar.length > 0
            ? "border-red-200 bg-red-50/40 hover:bg-red-50/60"
            : "border-gray-200 bg-white hover:border-brand-300 hover:bg-brand-50/30"
        }`}
      >
        <div className="flex items-center gap-1.5">
          <svg
            viewBox="0 0 16 16"
            fill="none"
            className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform ${acik ? "rotate-90" : ""}`}
          >
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-sm font-medium text-gray-700">Arıza ve sorunlar</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {hatArizaSayisi > 0 && (
            <span className="font-medium text-red-600">{hatArizaSayisi} hat arızası</span>
          )}
          {siparisSorunSayisi > 0 && (
            <span className="font-medium text-amber-600">{siparisSorunSayisi} sipariş sorunu</span>
          )}
          {acikSorunlar.length === 0 && <span className="text-gray-400">açık sorun yok</span>}
        </div>
      </button>

      {acik && (
        <div className="mt-1.5 rounded-xl border border-gray-200 bg-white p-4">
          {acikSorunlar.length === 0 ? (
            <p className="text-sm text-gray-400">Şu anda açık bir arıza/sorun kaydı yok.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {acikSorunlar.map((s) => (
                <div key={s.id} className="rounded-lg border border-gray-200 p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        TIP_RENK[s.tip] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {TIP_LABEL[s.tip] || s.tip}
                    </span>
                    {s.hatAdi && <span className="text-xs text-gray-500">{s.hatAdi}</span>}
                    {s.siparis_no && (
                      <span className="text-xs text-gray-500">
                        {s.siparis_no} · {s.musteri}
                      </span>
                    )}
                  </div>
                  {s.aciklama && <p className="mb-2 text-sm text-gray-700">{s.aciklama}</p>}

                  {cozulenId === s.id ? (
                    <div className="mt-2 flex flex-col gap-2">
                      <input
                        value={notGirisi}
                        onChange={(e) => setNotGirisi(e.target.value)}
                        placeholder="Çözüm notu (opsiyonel)"
                        className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm outline-none focus:border-brand-400"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setCozulenId(null);
                            setNotGirisi("");
                          }}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                        >
                          Vazgeç
                        </button>
                        <button
                          onClick={() => handleCozulduKaydet(s.id)}
                          disabled={kaydediliyor}
                          className="rounded-lg bg-brand-400 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-500 disabled:opacity-60"
                        >
                          {kaydediliyor ? "Kaydediliyor…" : "Çözüldü olarak işaretle"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setCozulenId(s.id)}
                      className="text-xs text-gray-400 hover:text-brand-500"
                    >
                      Çözüldü olarak işaretle
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
