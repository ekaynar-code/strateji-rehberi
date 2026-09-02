"use client";

import { useEffect, useState } from "react";
import {
  uretimApiBagliMi,
  uretimOzetGetir,
  uretimHattiGetir,
  type UretimOzet,
  type UretimHatti,
} from "@/lib/uretimApi";

function paraFormatla(deger: number): string {
  return `₺${Math.round(deger).toLocaleString("tr-TR")}`;
}

export default function UretimOzetBolumu() {
  const [bagli, setBagli] = useState(false);
  const [acik, setAcik] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState(false);
  const [ozet, setOzet] = useState<UretimOzet | null>(null);
  const [hat, setHat] = useState<UretimHatti | null>(null);
  const [detayYukleniyor, setDetayYukleniyor] = useState(false);

  useEffect(() => {
    if (!uretimApiBagliMi()) {
      setBagli(false);
      setYukleniyor(false);
      return;
    }
    setBagli(true);
    uretimOzetGetir()
      .then((o) => setOzet(o))
      .catch(() => setHata(true))
      .finally(() => setYukleniyor(false));
  }, []);

  async function handleAc() {
    const yeniDurum = !acik;
    setAcik(yeniDurum);
    if (yeniDurum && !hat) {
      setDetayYukleniyor(true);
      try {
        const h = await uretimHattiGetir();
        setHat(h);
      } catch {
        setHata(true);
      } finally {
        setDetayYukleniyor(false);
      }
    }
  }

  if (!bagli || yukleniyor) return null;

  if (hata && !ozet) {
    return (
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-3 text-xs text-gray-400">
        Sipariş/üretim verileri şu anda alınamıyor.
      </div>
    );
  }

  if (!ozet) return null;

  // API yanıtının gerçek yapısı beklenenden farklı gelebiliyor — her alt
  // nesneye erişimde güvenli varsayılanlar kullanıyoruz ki sayfa hiçbir
  // koşulda çökmesin, eksik veri varsa sadece "—" veya 0 gösterilsin.
  const siparisler = ozet.siparisler;
  const teklifler = ozet.teklifler;
  const liste = siparisler?.liste ?? [];

  const uretimde = siparisler?.uretimde ?? 0;
  const bekleyen = siparisler?.bekleyen ?? 0;
  const geciken = siparisler?.geciken ?? 0;
  const sorunVar = siparisler?.sorun_var ?? 0;
  const teklifBekliyor = teklifler?.bekliyor ?? 0;
  const teklifToplam = teklifler?.toplam ?? 0;
  const teklifTutar = teklifler?.toplam_tutar ?? 0;

  const aktifSiparisSayisi = uretimde + bekleyen;

  return (
    <div className="mb-6">
      <button
        onClick={handleAc}
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
          <span className="text-sm font-medium text-gray-700">Sipariş ve üretim durumu</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>
            <span className="font-medium text-gray-900">{aktifSiparisSayisi}</span> aktif sipariş
          </span>
          {geciken > 0 && <span className="font-medium text-red-600">{geciken} gecikiyor</span>}
          {sorunVar > 0 && <span className="font-medium text-red-600">{sorunVar} sorunlu</span>}
          <span>
            <span className="font-medium text-gray-900">{teklifBekliyor}</span> teklif bekliyor
          </span>
        </div>
      </button>

      {acik && (
        <div className="mt-1.5 rounded-xl border border-gray-200 bg-white p-4">
          {detayYukleniyor && <p className="text-sm text-gray-400">Yükleniyor…</p>}

          <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <div className="text-xs text-gray-500">Toplam teklif</div>
              <div className="text-lg font-medium text-gray-900">{teklifToplam}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Teklif tutarı</div>
              <div className="text-lg font-medium text-gray-900">{paraFormatla(teklifTutar)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Üretimde</div>
              <div className="text-lg font-medium text-gray-900">{uretimde}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Üretim bekliyor</div>
              <div className="text-lg font-medium text-gray-900">{bekleyen}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Geciken</div>
              <div className={`text-lg font-medium ${geciken > 0 ? "text-red-600" : "text-gray-900"}`}>
                {geciken}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Sorunlu sipariş</div>
              <div className={`text-lg font-medium ${sorunVar > 0 ? "text-red-600" : "text-gray-900"}`}>
                {sorunVar}
              </div>
            </div>
          </div>

          {liste.length > 0 && (
            <div className="mb-3">
              <div className="mb-1.5 text-xs font-medium text-gray-500">Aktif siparişler</div>
              <div className="flex flex-col gap-1">
                {liste.slice(0, 8).map((s) => (
                  <div key={s.siparis_no} className="flex items-center justify-between text-xs">
                    <span className="text-gray-700">
                      {s.siparis_no} · {s.musteri}
                      {s.durum === "sorun_var" && (
                        <span className="ml-1.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
                          sorunlu
                        </span>
                      )}
                    </span>
                    <span
                      className={
                        s.kalan_gun !== null && s.kalan_gun < 0
                          ? "font-medium text-red-600"
                          : s.kalan_gun !== null && s.kalan_gun <= 7
                            ? "font-medium text-amber-600"
                            : "text-gray-400"
                      }
                    >
                      {s.kalan_gun === null
                        ? "-"
                        : s.kalan_gun < 0
                          ? `${Math.abs(s.kalan_gun)} gün gecikti`
                          : `${s.kalan_gun} gün kaldı`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hat && ((hat.kanat && hat.kanat.length > 0) || (hat.kasa && hat.kasa.length > 0)) && (
            <div className="border-t border-gray-100 pt-3">
              <div className="mb-1.5 text-xs font-medium text-gray-500">Üretim hattı</div>
              <div className="flex flex-col gap-2">
                {Array.isArray(hat.kanat) && hat.kanat.length > 0 && (
                  <div>
                    <div className="mb-1 text-[11px] font-medium text-gray-400">Kanat</div>
                    <div className="flex flex-col gap-1">
                      {hat.kanat
                        .filter((a) => (a.siparisler && a.siparisler.length > 0) || a.arizali)
                        .map((a) => (
                          <div
                            key={`kanat-${a.index}`}
                            className={`flex items-center justify-between rounded-md px-2 py-1 text-xs ${
                              a.arizali ? "bg-red-50" : "bg-gray-50"
                            }`}
                          >
                            <span className={a.arizali ? "font-medium text-red-700" : "text-gray-600"}>
                              {a.asama}
                              {a.arizali && " ⚠ arızalı"}
                            </span>
                            <span className="text-gray-400">{(a.siparisler || []).length} sipariş</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                {Array.isArray(hat.kasa) && hat.kasa.length > 0 && (
                  <div>
                    <div className="mb-1 text-[11px] font-medium text-gray-400">Kasa</div>
                    <div className="flex flex-col gap-1">
                      {hat.kasa
                        .filter((a) => (a.siparisler && a.siparisler.length > 0) || a.arizali)
                        .map((a) => (
                          <div
                            key={`kasa-${a.index}`}
                            className={`flex items-center justify-between rounded-md px-2 py-1 text-xs ${
                              a.arizali ? "bg-red-50" : "bg-gray-50"
                            }`}
                          >
                            <span className={a.arizali ? "font-medium text-red-700" : "text-gray-600"}>
                              {a.asama}
                              {a.arizali && " ⚠ arızalı"}
                            </span>
                            <span className="text-gray-400">{(a.siparisler || []).length} sipariş</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
