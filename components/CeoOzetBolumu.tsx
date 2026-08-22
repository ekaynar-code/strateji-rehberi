"use client";

import { useEffect, useState } from "react";
import {
  ceoApiBagliMi,
  ceoDashboardGetir,
  ceoCalendarGetir,
  ceoAttendanceGetir,
  type CeoDashboard,
  type CeoCalendar,
  type CeoAttendanceSummary,
} from "@/lib/ceoApi";

function bugununTarihi(): string {
  return new Date().toISOString().slice(0, 10);
}

function haftaBasi(): string {
  const d = new Date();
  const gun = d.getDay(); // 0 = Pazar
  const farkPazartesi = gun === 0 ? -6 : 1 - gun;
  d.setDate(d.getDate() + farkPazartesi);
  return d.toISOString().slice(0, 10);
}

function dakikayiSaateCevir(dakika: number): string {
  const saat = Math.floor(dakika / 60);
  const kalanDakika = dakika % 60;
  return `${saat}s ${kalanDakika}dk`;
}

function tarihFormatla(tarih: string): string {
  const d = new Date(tarih + "T00:00:00");
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

export default function CeoOzetBolumu() {
  const [bagli, setBagli] = useState(false);
  const [acik, setAcik] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState(false);
  const [dashboard, setDashboard] = useState<CeoDashboard | null>(null);
  const [takvim, setTakvim] = useState<CeoCalendar | null>(null);
  const [mesaiOzeti, setMesaiOzeti] = useState<CeoAttendanceSummary | null>(null);
  const [detayYukleniyor, setDetayYukleniyor] = useState(false);

  useEffect(() => {
    if (!ceoApiBagliMi()) {
      setBagli(false);
      setYukleniyor(false);
      return;
    }
    setBagli(true);
    ceoDashboardGetir()
      .then((d) => setDashboard(d))
      .catch(() => setHata(true))
      .finally(() => setYukleniyor(false));
  }, []);

  async function handleAc() {
    const yeniDurum = !acik;
    setAcik(yeniDurum);
    if (yeniDurum && !takvim) {
      setDetayYukleniyor(true);
      try {
        const t = await ceoCalendarGetir(bugununTarihi());
        setTakvim(t);
        const a = await ceoAttendanceGetir(haftaBasi(), bugununTarihi()).catch(() => null);
        if (a) setMesaiOzeti(a);
      } catch {
        setHata(true);
      } finally {
        setDetayYukleniyor(false);
      }
    }
  }

  if (!bagli || yukleniyor) return null;

  if (hata && !dashboard) {
    return (
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-3 text-xs text-gray-400">
        Personel verileri şu anda alınamıyor.
      </div>
    );
  }

  if (!dashboard) return null;

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
          <span className="text-sm font-medium text-gray-700">Personel durumu</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>
            <span className="font-medium text-gray-900">{dashboard.working}</span> çalışıyor
          </span>
          <span>
            <span className="font-medium text-gray-900">{dashboard.onLeave}</span> izinde
          </span>
          <span className="text-gray-400">/ {dashboard.total} toplam</span>
        </div>
      </button>

      {acik && (
        <div className="mt-1.5 rounded-xl border border-gray-200 bg-white p-4">
          {detayYukleniyor && <p className="text-sm text-gray-400">Yükleniyor…</p>}

          {dashboard.byUnit && Object.keys(dashboard.byUnit).length > 0 && (
            <div className="mb-3">
              <div className="mb-1.5 text-xs font-medium text-gray-500">Birim bazında</div>
              <div className="flex flex-wrap gap-3">
                {Object.entries(dashboard.byUnit).map(([birim, veri]) => (
                  <div key={birim} className="text-sm">
                    <span className="text-gray-700">{birim}: </span>
                    <span className="font-medium text-gray-900">
                      {veri.working}/{veri.total}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {takvim && (
            <div>
              <div className="mb-1.5 text-xs font-medium text-gray-500">
                Bugün ({takvim.date}) mesai durumu
              </div>
              <div className="flex flex-wrap gap-2">
                {takvim.units.map((u) => (
                  <span
                    key={u.unitId}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      u.willWork ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {u.unitName}
                    {u.willWork && u.startTime && u.endTime
                      ? ` · ${u.startTime}–${u.endTime}`
                      : u.willWork
                        ? " · mesaide"
                        : " · mesai yok"}
                  </span>
                ))}
              </div>
            </div>
          )}

          {mesaiOzeti && mesaiOzeti.days.length > 0 && (
            <div className="mt-3 border-t border-gray-100 pt-3">
              <div className="mb-1.5 text-xs font-medium text-gray-500">
                Bu hafta mesai özeti ({tarihFormatla(mesaiOzeti.startDate)} – {tarihFormatla(mesaiOzeti.endDate)})
              </div>
              <div className="flex flex-col gap-1">
                {mesaiOzeti.days.map((gun) => (
                  <div key={gun.date} className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">{tarihFormatla(gun.date)}</span>
                    <span className="text-gray-700">
                      <span className="font-medium text-gray-900">{gun.present}</span> kişi ·{" "}
                      {dakikayiSaateCevir(gun.totalWorkedMinutes)}
                      {gun.absent > 0 && <span className="text-red-500"> · {gun.absent} devamsız</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
