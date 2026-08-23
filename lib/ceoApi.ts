const BASE_URL = "https://us-central1-pimetri-ik-221db.cloudfunctions.net";

function getApiKey(): string | undefined {
  return process.env.NEXT_PUBLIC_CEO_API_KEY;
}

export interface CeoDashboardUnit {
  unitId: string;
  unitName: string;
  type: string;
  total: number;
  working: number;
  checkedOut: number;
  onLeave: number;
  absent: number;
}

export interface CeoDashboard {
  date: string;
  total: number;
  working: number;
  checkedOut: number;
  onLeave: number;
  absent: number;
  byUnit: Record<string, CeoDashboardUnit>;
  units: CeoDashboardUnit[];
}

export interface CeoCalendarUnit {
  unitId: string;
  unitName: string;
  type: string;
  willWork: boolean;
  startTime: string | null;
  endTime: string | null;
}

export interface CeoCalendar {
  date: string;
  units: CeoCalendarUnit[];
}

export interface CeoAttendanceDay {
  date: string;
  present: number;
  absent: number;
  totalWorkedMinutes: number;
  byUnit: Record<string, { present: number; totalWorkedMinutes: number }>;
}

export interface CeoAttendanceSummary {
  startDate: string;
  endDate: string;
  days: CeoAttendanceDay[];
}

export interface CeoPayrollItem {
  id: string;
  period: string;
  workUnitType: string;
  status: "approved" | "sent";
  employeeCount: number;
  totalNet: number;
  totalEmployerCost: number;
  approvedAt: string | null;
}

export interface CeoPayrollResponse {
  payrolls: CeoPayrollItem[];
}

export interface CeoPayrollDonemToplam {
  period: string;
  totalNet: number;
  totalEmployerCost: number;
  employeeCount: number;
  units: string[];
}

export interface CeoBirimOzeti {
  unitId: string;
  unitName: string;
  type: string;
  total: number;
  working: number;
  onLeave: number;
  absent: number;
  willWorkToday: boolean;
  startTime: string | null;
  endTime: string | null;
}

/**
 * apiDashboard (çalışan sayıları) ve apiCalendar (bugünkü mesai planı) verilerini
 * unitId üzerinden birleştirir. İkisi de aynı unitId'yi kullandığı için artık
 * güvenilir şekilde eşleştirilebiliyor.
 */
export function birimleriBirlestir(
  dashboard: CeoDashboard,
  takvim: CeoCalendar
): CeoBirimOzeti[] {
  const takvimMap = new Map(takvim.units.map((u) => [u.unitId, u]));

  return dashboard.units.map((d) => {
    const t = takvimMap.get(d.unitId);
    return {
      unitId: d.unitId,
      unitName: d.unitName,
      type: d.type,
      total: d.total,
      working: d.working,
      onLeave: d.onLeave,
      absent: d.absent,
      willWorkToday: t?.willWork ?? false,
      startTime: t?.startTime ?? null,
      endTime: t?.endTime ?? null,
    };
  });
}

/**
 * Birden fazla birim varsa aynı döneme ait birden fazla kayıt gelebiliyor —
 * bunları dönem bazında toplayıp tek bir özet satırına indirger.
 */
export function payrollDonemBazindaGrupla(payrolls: CeoPayrollItem[]): CeoPayrollDonemToplam[] {
  const gruplar = new Map<string, CeoPayrollDonemToplam>();

  payrolls.forEach((p) => {
    const mevcut = gruplar.get(p.period);
    if (mevcut) {
      mevcut.totalNet += p.totalNet;
      mevcut.totalEmployerCost += p.totalEmployerCost;
      mevcut.employeeCount += p.employeeCount;
      mevcut.units.push(p.workUnitType);
    } else {
      gruplar.set(p.period, {
        period: p.period,
        totalNet: p.totalNet,
        totalEmployerCost: p.totalEmployerCost,
        employeeCount: p.employeeCount,
        units: [p.workUnitType],
      });
    }
  });

  return Array.from(gruplar.values()).sort((a, b) => b.period.localeCompare(a.period));
}

/**
 * CEO API'sine bağlantı var mı (anahtar tanımlı mı) diye kontrol eder.
 * Anahtar yoksa bu modülün fonksiyonları çağrılmamalı — arayüz tarafında
 * bu bilgiye göre bölüm tamamen gizlenir.
 */
export function ceoApiBagliMi(): boolean {
  return !!getApiKey();
}

async function ceoFetch<T>(yol: string, parametreler: Record<string, string>): Promise<T> {
  const key = getApiKey();
  if (!key) throw new Error("CEO API anahtarı tanımlı değil");

  const params = new URLSearchParams({ key, ...parametreler });
  const res = await fetch(`${BASE_URL}/${yol}?${params.toString()}`);
  if (!res.ok) throw new Error(`CEO API isteği başarısız: ${res.status}`);
  return res.json();
}

export async function ceoDashboardGetir(): Promise<CeoDashboard> {
  return ceoFetch<CeoDashboard>("apiDashboard", {});
}

export async function ceoCalendarGetir(tarih: string): Promise<CeoCalendar> {
  return ceoFetch<CeoCalendar>("apiCalendar", { date: tarih });
}

export async function ceoAttendanceGetir(
  baslangic: string,
  bitis: string
): Promise<CeoAttendanceSummary> {
  return ceoFetch<CeoAttendanceSummary>("apiAttendance", {
    startDate: baslangic,
    endDate: bitis,
  });
}

export async function ceoPayrollGetir(limit = 12): Promise<CeoPayrollResponse> {
  return ceoFetch<CeoPayrollResponse>("apiPayroll", { limit: String(limit) });
}
