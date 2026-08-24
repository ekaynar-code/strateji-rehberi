"use client";

import { useState, useMemo, useEffect } from "react";
import {
  uygunMesajTipleri,
  mesajTipiEtiketi,
  mesajOlustur,
  varsayilanSablonGetir,
  YER_TUTUCULAR,
  type MesajDili,
  type MesajTipi,
} from "@/lib/mesajSablonlari";
import { mesajGonderildiIsaretle, type Distributor } from "@/lib/distributors";
import { addTodo } from "@/lib/todos";
import { ozelSablonKaydet, ozelSablonSifirla, ozelSablonGetir, type OzelSablon } from "@/lib/ozelMesajSablonlari";

function yediGunSonra(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

export default function MesajOlusturModal({
  kayit,
  onKapat,
}: {
  kayit: Distributor;
  onKapat: () => void;
}) {
  const tipler = useMemo(() => uygunMesajTipleri(kayit.durum), [kayit.durum]);
  const [tip, setTip] = useState<MesajTipi>(tipler[0]);
  const [dil, setDil] = useState<MesajDili>("tr");
  const [kopyalandi, setKopyalandi] = useState(false);
  const [isaretleniyor, setIsaretleniyor] = useState(false);
  const [isaretlendi, setIsaretlendi] = useState(false);

  const [ozelSablon, setOzelSablon] = useState<OzelSablon | null>(null);
  const [duzenlemeAcik, setDuzenlemeAcik] = useState(false);
  const [duzenlemeKonu, setDuzenlemeKonu] = useState("");
  const [duzenlemeGovde, setDuzenlemeGovde] = useState("");
  const [kaydediliyor, setKaydediliyor] = useState(false);

  useEffect(() => {
    let iptal = false;
    ozelSablonGetir(tip, dil)
      .then((s) => {
        if (!iptal) setOzelSablon(s);
      })
      .catch(() => {
        if (!iptal) setOzelSablon(null);
      });
    return () => {
      iptal = true;
    };
  }, [tip, dil]);

  const mesaj = useMemo(
    () => mesajOlustur(kayit, tip, dil, {}, ozelSablon),
    [kayit, tip, dil, ozelSablon]
  );

  function handleDuzenlemeAc() {
    const kaynak = ozelSablon || varsayilanSablonGetir(tip, dil);
    setDuzenlemeKonu(kaynak.konu);
    setDuzenlemeGovde(kaynak.govde);
    setDuzenlemeAcik(true);
  }

  async function handleSablonKaydet() {
    setKaydediliyor(true);
    try {
      await ozelSablonKaydet(tip, dil, { konu: duzenlemeKonu, govde: duzenlemeGovde });
      setOzelSablon({ konu: duzenlemeKonu, govde: duzenlemeGovde });
      setDuzenlemeAcik(false);
    } finally {
      setKaydediliyor(false);
    }
  }

  async function handleSablonSifirla() {
    setKaydediliyor(true);
    try {
      await ozelSablonSifirla(tip, dil);
      setOzelSablon(null);
      setDuzenlemeAcik(false);
    } finally {
      setKaydediliyor(false);
    }
  }

  async function handleKopyala() {
    const tamMetin =
      dil === "tr" ? `Konu: ${mesaj.konu}\n\n${mesaj.govde}` : `Subject: ${mesaj.konu}\n\n${mesaj.govde}`;
    try {
      await navigator.clipboard.writeText(tamMetin);
      setKopyalandi(true);
      setTimeout(() => setKopyalandi(false), 2000);
    } catch {
      // sessizce geç
    }
  }

  async function handleGonderildiIsaretle() {
    setIsaretleniyor(true);
    try {
      const etiket = mesajTipiEtiketi(tip, dil);
      await mesajGonderildiIsaretle(kayit.id, kayit.durum, etiket);
      await addTodo(
        `${kayit.firmaAdi} ile takip et — "${etiket}" mesajı gönderilmişti`,
        undefined,
        yediGunSonra()
      );
      setIsaretlendi(true);
    } finally {
      setIsaretleniyor(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 p-4 pt-16 sm:pt-24">
      <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
          <div>
            <h2 className="text-base font-medium text-gray-900">Mesaj taslağı</h2>
            <p className="text-xs text-gray-500">{kayit.firmaAdi}</p>
          </div>
          <button
            onClick={onKapat}
            aria-label="Kapat"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          <div className="mb-3 flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
            <button
              onClick={() => setDil("tr")}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                dil === "tr" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
              }`}
            >
              Türkçe
            </button>
            <button
              onClick={() => setDil("en")}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                dil === "en" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
              }`}
            >
              English
            </button>
          </div>

          <div className="mb-4 flex flex-wrap gap-1.5">
            {tipler.map((t) => (
              <button
                key={t}
                onClick={() => setTip(t)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  tip === t ? "bg-brand-400 text-white" : "border border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {mesajTipiEtiketi(t, dil)}
              </button>
            ))}
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">{dil === "tr" ? "Konu" : "Subject"}</span>
              {!duzenlemeAcik && (
                <button
                  onClick={handleDuzenlemeAc}
                  className="text-xs text-gray-400 hover:text-brand-500"
                >
                  {ozelSablon ? "Şablonu düzenle" : "Bu şablonu özelleştir"}
                </button>
              )}
            </div>
            <div className="mb-3 text-sm text-gray-800">{mesaj.konu}</div>
            <div className="mb-2 text-xs font-medium text-gray-500">
              {dil === "tr" ? "Mesaj" : "Message"}
            </div>
            <div className="whitespace-pre-wrap text-sm text-gray-800">{mesaj.govde}</div>
          </div>

          {duzenlemeAcik && (
            <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3">
              <p className="mb-2 text-xs text-gray-400">
                Kullanabileceğiniz yer tutucular: {YER_TUTUCULAR.join(" ")}
              </p>
              <input
                value={duzenlemeKonu}
                onChange={(e) => setDuzenlemeKonu(e.target.value)}
                placeholder={dil === "tr" ? "Konu" : "Subject"}
                className="mb-2 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm outline-none focus:border-brand-400"
              />
              <textarea
                value={duzenlemeGovde}
                onChange={(e) => setDuzenlemeGovde(e.target.value)}
                rows={8}
                placeholder={dil === "tr" ? "Mesaj metni" : "Message body"}
                className="mb-2 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm outline-none focus:border-brand-400"
              />
              <div className="flex flex-wrap justify-end gap-2">
                {ozelSablon && (
                  <button
                    onClick={handleSablonSifirla}
                    disabled={kaydediliyor}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                  >
                    Varsayılana döndür
                  </button>
                )}
                <button
                  onClick={() => setDuzenlemeAcik(false)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                >
                  Vazgeç
                </button>
                <button
                  onClick={handleSablonKaydet}
                  disabled={kaydediliyor}
                  className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-900"
                >
                  {kaydediliyor ? "Kaydediliyor…" : "Şablonu kaydet"}
                </button>
              </div>
            </div>
          )}

          <button
            onClick={handleKopyala}
            className="mt-3 w-full rounded-lg bg-brand-400 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-500"
          >
            {kopyalandi ? "Kopyalandı ✓" : "Metni kopyala"}
          </button>

          {kayit.sonMesajTarihi && !isaretlendi && (
            <p className="mt-2 text-center text-xs text-gray-400">
              Son gönderilen: {kayit.sonMesajTipi} · {kayit.sonMesajTarihi}
            </p>
          )}

          {isaretlendi ? (
            <p className="mt-2 text-center text-sm text-green-600">
              Gönderildi olarak işaretlendi — 7 gün sonrasına takip hatırlatması eklendi.
            </p>
          ) : (
            <button
              onClick={handleGonderildiIsaretle}
              disabled={isaretleniyor}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
            >
              {isaretleniyor ? "İşaretleniyor…" : "Gönderildi olarak işaretle"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
