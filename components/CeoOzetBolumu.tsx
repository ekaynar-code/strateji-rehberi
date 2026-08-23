"use client";

import { useEffect, useState } from "react";
import {
  ceoApiBagliMi,
  ceoDashboardGetir,
  ceoCalendarGetir,
  ceoAttendanceGetir,
  ceoPayrollGetir,
  payrollDonemBazindaGrupla,
  birimleriBirlestir,
  type CeoDashboard,
  type CeoCalendar,
  type CeoAttendanceSummary,
  type CeoPayrollDonemToplam,
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

function paraFormatla(deger: number): string {
  return `₺${Math.round(deger).toLocaleString("tr-TR")}`;
}

export default function CeoOzetBolumu() {
  const [bagli, setBagli] = useState(false);
  const [acik, setAcik] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState(false);
  const [dashboard, setDashboard] = useState<CeoDashboard | null>(null);
  const [takvim, setTakvim] = useState<CeoCalendar | null>(null);
  const [mesaiOzeti, setMesaiOzeti] = useState<CeoAttendanceSummary | null>(null);
  const [sonBordro, setSonBordro] = useState<CeoPayrollDonemToplam | null>(null);
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
        const p = await ceoPayrollGetir(3).catch(() => null);
        if (p) {
          const gruplar = payrollDonemBazindaGrupla(p.payrolls);
          if (gruplar.length > 0) setSonBordro(gruplar[0]);
        }
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

          {takvim && (
            <div className="mb-3">
              <div className="mb-1.5 text-xs font-medium text-gray-500">
                Birimler — bugün ({takvim.date})
              </div>
              <div className="flex flex-col gap-1.5">
                {birimleriBirlestir(dashboard, takvim).map((b) => (
                  <div
                    key={b.unitId}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-2.5 py-1.5 text-sm"
                  >
                    <span className="text-gray-700">{b.unitName}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {b.working}/{b.total}
                      </span>
                      {b.absent > 0 && <span className="text-xs text-red-500">{b.absent} devamsız</span>}
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          b.willWorkToday ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {b.willWorkToday && b.startTime && b.endTime
                          ? `${b.startTime}–${b.endTime}`
                          : b.willWorkToday
                            ? "mesaide"
                            : "mesai yok"}
                      </span>
                    </div>
                  </div>
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

          {sonBordro && (
            <div className="mt-3 border-t border-gray-100 pt-3">
              <div className="mb-1 text-xs font-medium text-gray-500">
                Son bordro ({sonBordro.period})
              </div>
              <div className="text-sm">
                <span className="text-gray-700">Toplam işveren maliyeti: </span>
                <span className="font-medium text-gray-900">{paraFormatla(sonBordro.totalEmployerCost)}</span>
                <span className="ml-2 text-xs text-gray-400">({sonBordro.employeeCount} kişi)</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
