"use client";

import { useRouter } from "next/navigation";
import type { AksiyonOnerisi, OncelikSeviyesi } from "@/lib/aksiyonMotoru";

const SEVIYE_STIL: Record<OncelikSeviyesi, { rozet: string; kart: string; etiket: string }> = {
  acil: {
    rozet: "bg-red-100 text-red-700",
    kart: "border-red-200 bg-red-50/40",
    etiket: "Acil",
  },
  onemli: {
    rozet: "bg-amber-100 text-amber-700",
    kart: "border-amber-200 bg-amber-50/40",
    etiket: "Önemli",
  },
  bilgi: {
    rozet: "bg-gray-100 text-gray-600",
    kart: "border-gray-200 bg-white",
    etiket: "Bilgi",
  },
};

export default function AksiyonListesi({ oneriler }: { oneriler: AksiyonOnerisi[] }) {
  const router = useRouter();

  if (oneriler.length === 0) {
    return (
      <div className="mb-6 rounded-xl border border-dashed border-gray-300 p-6 text-center">
        <p className="text-sm text-gray-500">
          Şu anda öne çıkan bir aksiyon önerisi yok — her şey kontrol altında görünüyor.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h2 className="mb-3 text-sm font-medium text-gray-700">Bu hafta öne çıkanlar</h2>
      <div className="flex flex-col gap-2">
        {oneriler.map((o) => {
          const stil = SEVIYE_STIL[o.seviye];
          return (
            <button
              key={o.id}
              onClick={() => router.push(o.hedefSekme)}
              className={`w-full rounded-xl border p-3 text-left transition hover:brightness-[0.98] ${stil.kart}`}
            >
              <div className="mb-1 flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${stil.rozet}`}>
                  {stil.etiket}
                </span>
                <span className="text-sm font-medium text-gray-900">{o.baslik}</span>
              </div>
              <p className="text-xs text-gray-500">{o.aciklama}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
