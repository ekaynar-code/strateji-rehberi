"use client";

import { useEffect, useState, useRef } from "react";

interface KurVeri {
  usdTry: number | null;
  eurTry: number | null;
  altinTry: number | null; // gram altın, TRY
}

type Yon = "up" | "down" | "same";

const YENILEME_DAKIKA = 5;

function formatla(deger: number | null) {
  return deger === null ? "—" : deger.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function yonBelirle(eski: number | null, yeni: number | null): Yon {
  if (eski === null || yeni === null) return "same";
  if (yeni > eski) return "up";
  if (yeni < eski) return "down";
  return "same";
}

export default function KurSeridi() {
  const [kur, setKur] = useState<KurVeri>({ usdTry: null, eurTry: null, altinTry: null });
  const [yonler, setYonler] = useState<{ usdTry: Yon; eurTry: Yon; altinTry: Yon }>({
    usdTry: "same",
    eurTry: "same",
    altinTry: "same",
  });
  const [hata, setHata] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [dakikaOnce, setDakikaOnce] = useState(0);
  const oncekiKur = useRef<KurVeri>({ usdTry: null, eurTry: null, altinTry: null });
  const sonGuncelleme = useRef<Date | null>(null);

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
        const altinUsdGram = altinUsdOns / 31.1035; // 1 ons = 31.1035 gram
        const altinTry = altinUsdGram * usdTry;

        const yeniKur: KurVeri = { usdTry, eurTry, altinTry };

        setYonler({
          usdTry: yonBelirle(oncekiKur.current.usdTry, yeniKur.usdTry),
          eurTry: yonBelirle(oncekiKur.current.eurTry, yeniKur.eurTry),
          altinTry: yonBelirle(oncekiKur.current.altinTry, yeniKur.altinTry),
        });

        oncekiKur.current = yeniKur;
        sonGuncelleme.current = new Date();
        setDakikaOnce(0);
        setKur(yeniKur);
        setHata(false);
      } catch {
        if (!iptal) setHata(true);
      } finally {
        if (!iptal) setYukleniyor(false);
      }
    }

    veriGetir();
    const veriInterval = setInterval(veriGetir, YENILEME_DAKIKA * 60 * 1000);

    // "X dakika önce güncellendi" yazısını her dakika tazele.
    const saatInterval = setInterval(() => {
      if (!sonGuncelleme.current) return;
      const fark = Math.floor((Date.now() - sonGuncelleme.current.getTime()) / 60000);
      setDakikaOnce(fark);
    }, 60 * 1000);

    return () => {
      iptal = true;
      clearInterval(veriInterval);
      clearInterval(saatInterval);
    };
  }, []);

  if (yukleniyor) {
    return (
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-2 text-sm text-gray-400">
        <div className="mx-auto max-w-5xl">Kurlar yükleniyor…</div>
      </div>
    );
  }

  if (hata) {
    return (
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-2 text-sm text-gray-400">
        <div className="mx-auto max-w-5xl">Kur verileri şu anda alınamıyor.</div>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-2 text-sm">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-1">
        <KurItem label="USD/TRY" deger={kur.usdTry} yon={yonler.usdTry} />
        <KurItem label="EUR/TRY" deger={kur.eurTry} yon={yonler.eurTry} />
        <KurItem label="Gram Altın" deger={kur.altinTry} yon={yonler.altinTry} prefix="₺" />
        <span className="ml-auto text-xs text-gray-400">
          {dakikaOnce <= 0 ? "az önce güncellendi" : `${dakikaOnce} dk önce güncellendi`} · {YENILEME_DAKIKA} dk'da bir
        </span>
      </div>
    </div>
  );
}

function KurItem({
  label,
  deger,
  yon,
  prefix = "",
}: {
  label: string;
  deger: number | null;
  yon: Yon;
  prefix?: string;
}) {
  const renkSinifi = yon === "up" ? "text-green-600" : yon === "down" ? "text-red-600" : "text-gray-900";

  return (
    <span className="flex items-center gap-1.5">
      <span className="text-gray-500">{label}</span>
      <span className={`font-medium ${renkSinifi}`}>
        {yon === "up" && "▲ "}
        {yon === "down" && "▼ "}
        {prefix}
        {formatla(deger)}
      </span>
    </span>
  );
}
