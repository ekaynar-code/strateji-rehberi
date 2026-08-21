"use client";

import { useEffect, useState } from "react";

interface KurVeri {
  usdTry: number | null;
  eurTry: number | null;
  altinTry: number | null; // gram altın, TRY
}

export default function KurSeridi() {
  const [kur, setKur] = useState<KurVeri>({ usdTry: null, eurTry: null, altinTry: null });
  const [hata, setHata] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    let iptal = false;

    async function veriGetir() {
      try {
        const [dovizRes, altinRes] = await Promise.all([
          fetch("https://open.er-api.com/v6/latest/USD"),
          fetch("https://api.gold-api.com/price/XAU"),
        ]);

        if (!dovizRes.ok || !altinRes.ok) throw new Error("fetch başarısız");

        const dovizData = await dovizRes.json();
        const altinData = await altinRes.json();

        const usdTry: number | undefined = dovizData?.rates?.TRY;
        const usdEur: number | undefined = dovizData?.rates?.EUR;
        const altinUsdOns: number | undefined = altinData?.price;

        if (iptal) return;

        if (!usdTry || !usdEur || !altinUsdOns) throw new Error("eksik veri");

        const eurTry = usdTry / usdEur;
        // 1 ons = 31.1035 gram
        const altinUsdGram = altinUsdOns / 31.1035;
        const altinTry = altinUsdGram * usdTry;

        setKur({ usdTry, eurTry, altinTry });
        setHata(false);
      } catch {
        if (!iptal) setHata(true);
      } finally {
        if (!iptal) setYukleniyor(false);
      }
    }

    veriGetir();
    const interval = setInterval(veriGetir, 5 * 60 * 1000); // 5 dakikada bir yenile

    return () => {
      iptal = true;
      clearInterval(interval);
    };
  }, []);

  if (yukleniyor) {
    return (
      <div className="mb-4 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-400">
        Kurlar yükleniyor…
      </div>
    );
  }

  if (hata) {
    return (
      <div className="mb-4 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-400">
        Kur verileri şu anda alınamıyor.
      </div>
    );
  }

  const formatla = (deger: number | null) =>
    deger === null ? "—" : deger.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm">
      <span className="flex items-center gap-1.5">
        <span className="text-gray-500">USD/TRY</span>
        <span className="font-medium text-gray-900">{formatla(kur.usdTry)}</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="text-gray-500">EUR/TRY</span>
        <span className="font-medium text-gray-900">{formatla(kur.eurTry)}</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="text-gray-500">Gram Altın</span>
        <span className="font-medium text-gray-900">₺{formatla(kur.altinTry)}</span>
      </span>
    </div>
  );
}
