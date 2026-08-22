const BASE_URL = "https://us-central1-pimetri-ik-221db.cloudfunctions.net";

function getApiKey(): string | undefined {
  return process.env.NEXT_PUBLIC_CEO_API_KEY;
}

export interface CeoDashboard {
  total: number;
  working: number;
  onLeave: number;
  byUnit?: Record<string, { total: number; working: number }>;
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
