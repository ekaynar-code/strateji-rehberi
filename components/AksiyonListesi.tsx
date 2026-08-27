"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AksiyonOnerisi, OncelikSeviyesi } from "@/lib/aksiyonMotoru";

const SEVIYE_SIRASI: OncelikSeviyesi[] = ["acil", "onemli", "bilgi"];

const SEVIYE_STIL: Record<
  OncelikSeviyesi,
  { rozet: string; kart: string; etiket: string; ozetSatir: string }
> = {
  acil: {
    rozet: "bg-red-100 text-red-700",
    kart: "border-red-200 bg-red-50/40",
    etiket: "Acil",
    ozetSatir: "border-red-200 bg-red-50/60",
  },
  onemli: {
    rozet: "bg-amber-100 text-amber-700",
    kart: "border-amber-200 bg-amber-50/40",
    etiket: "Önemli",
    ozetSatir: "border-amber-200 bg-amber-50/60",
  },
  bilgi: {
    rozet: "bg-gray-100 text-gray-600",
    kart: "border-gray-200 bg-white",
    etiket: "Bilgi",
    ozetSatir: "border-gray-200 bg-gray-50",
  },
};

export default function AksiyonListesi({ oneriler }: { oneriler: AksiyonOnerisi[] }) {
  const router = useRouter();
  const [acikSeviye, setAcikSeviye] = useState<OncelikSeviyesi | null>(
    oneriler.length > 0 ? oneriler[0].seviye : null
  );

  if (oneriler.length === 0) {
    return (
      <div className="mb-6 rounded-xl border border-dashed border-gray-300 p-6 text-center">
        <p className="text-sm text-gray-500">
          Şu anda öne çıkan bir aksiyon önerisi yok — her şey kontrol altında görünüyor.
        </p>
      </div>
    );
  }

  const gruplar = SEVIYE_SIRASI.map((seviye) => ({
    seviye,
    onerileri: oneriler.filter((o) => o.seviye === seviye),
  })).filter((g) => g.onerileri.length > 0);

  return (
    <div className="mb-6">
      <h2 className="mb-3 text-sm font-medium text-gray-700">Bu hafta öne çıkanlar</h2>
      <div className="flex flex-col gap-2">
        {gruplar.map(({ seviye, onerileri }) => {
          const stil = SEVIYE_STIL[seviye];
          const acik = acikSeviye === seviye;
          return (
            <div key={seviye}>
              <button
                onClick={() => setAcikSeviye(acik ? null : seviye)}
                className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition hover:brightness-[0.98] ${stil.ozetSatir}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${stil.rozet}`}>
                    {stil.etiket}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {onerileri.length} {onerileri.length === 1 ? "uyarı" : "uyarı"}
                  </span>
                </div>
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform ${acik ? "rotate-90" : ""}`}
                >
                  <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {acik && (
                <div className="mt-2 flex flex-col gap-2 pl-1">
                  {onerileri.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => router.push(o.hedefSekme)}
                      className={`w-full rounded-xl border p-3 text-left transition hover:brightness-[0.98] ${stil.kart}`}
                    >
                      <div className="mb-1 text-sm font-medium text-gray-900">{o.baslik}</div>
                      <p className="text-xs text-gray-500">{o.aciklama}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
