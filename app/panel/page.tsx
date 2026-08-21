"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import RequireAuth from "@/components/RequireAuth";
import TopBar from "@/components/TopBar";
import PanelTabs from "@/components/PanelTabs";
import KurSeridi from "@/components/KurSeridi";
import {
  subscribeDistributors,
  type Distributor,
  BOLGE_LABEL,
} from "@/lib/distributors";
import {
  subscribeFuarlar,
  type Fuar,
  kalanGun,
} from "@/lib/fuarlar";

export default function GenelBakisPage() {
  return (
    <RequireAuth>
      <TopBar />
      <PanelTabs />
      <GenelBakisContent />
    </RequireAuth>
  );
}

function formatTarih(tarih: string): string {
  const d = new Date(tarih + "T00:00:00");
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

function GenelBakisContent() {
  const [distributorler, setDistributorler] = useState<Distributor[]>([]);
  const [fuarlar, setFuarlar] = useState<Fuar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let d1 = false;
    let d2 = false;
    const checkDone = () => {
      if (d1 && d2) setLoading(false);
    };

    const unsub1 = subscribeDistributors(
      (data) => {
        setDistributorler(data);
        d1 = true;
        checkDone();
      },
      () => {
        d1 = true;
        checkDone();
      }
    );
    const unsub2 = subscribeFuarlar(
      (data) => {
        setFuarlar(data);
        d2 = true;
        checkDone();
      },
      () => {
        d2 = true;
        checkDone();
      }
    );

    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  const aktifGorusmeler = useMemo(
    () =>
      distributorler.filter(
        (d) => d.durum === "temas_edildi" || d.durum === "yanit_bekleniyor" || d.durum === "gorusme_planlandi"
      ).length,
    [distributorler]
  );

  const anlasmaSayisi = useMemo(
    () => distributorler.filter((d) => d.durum === "anlasma").length,
    [distributorler]
  );

  const yaklasanFuarlar = useMemo(
    () =>
      fuarlar
        .filter((f) => {
          const gun = kalanGun(f.tarih);
          return gun >= 0 && gun <= 30 && f.durum !== "tamamlandi" && f.durum !== "katilinmayacak";
        })
        .sort((a, b) => kalanGun(a.tarih) - kalanGun(b.tarih)),
    [fuarlar]
  );

  const uzunSureYanitBekleyenler = useMemo(
    () => distributorler.filter((d) => d.durum === "yanit_bekleniyor"),
    [distributorler]
  );

  const bolgeDagilimi = useMemo(() => {
    const sayac: Record<string, number> = {};
    distributorler.forEach((d) => {
      sayac[d.bolge] = (sayac[d.bolge] || 0) + 1;
    });
    return sayac;
  }, [distributorler]);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-5 sm:py-6">
      <div className="mb-5">
        <h1 className="text-lg font-medium text-stone-900">Genel Bakış</h1>
        <p className="text-sm text-stone-500">İhracat ve pazar geliştirme faaliyetlerinin özeti</p>
      </div>

      <KurSeridi />

      {loading ? (
        <p className="text-sm text-stone-500">Yükleniyor…</p>
      ) : (
        <>
          {/* KPI kartları */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-stone-200 bg-white p-4">
              <div className="text-xs text-stone-500">Toplam distribütör kaydı</div>
              <div className="mt-1 text-2xl font-medium text-stone-900">{distributorler.length}</div>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-4">
              <div className="text-xs text-stone-500">Aktif görüşme</div>
              <div className="mt-1 text-2xl font-medium text-stone-900">{aktifGorusmeler}</div>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-4">
              <div className="text-xs text-stone-500">Anlaşma sağlanan</div>
              <div className="mt-1 text-2xl font-medium text-green-700">{anlasmaSayisi}</div>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-4">
              <div className="text-xs text-stone-500">30 gün içindeki fuar</div>
              <div className="mt-1 text-2xl font-medium text-amber-700">{yaklasanFuarlar.length}</div>
            </div>
          </div>

          {/* Bölge dağılımı */}
          {distributorler.length > 0 && (
            <div className="mb-6 rounded-xl border border-stone-200 bg-white p-4">
              <div className="mb-3 text-sm font-medium text-stone-700">Bölge dağılımı — distribütör kayıtları</div>
              <div className="flex flex-wrap gap-4">
                {Object.entries(BOLGE_LABEL).map(([key, label]) => (
                  <div key={key} className="flex items-baseline gap-1.5">
                    <span className="text-lg font-medium text-stone-900">{bolgeDagilimi[key] || 0}</span>
                    <span className="text-sm text-stone-500">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Yaklaşan fuarlar */}
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium text-stone-700">Yaklaşan fuarlar (30 gün içinde)</h2>
              <Link href="/panel/fuarlar" className="text-sm text-stone-500 hover:text-stone-900 hover:underline">
                Tümünü gör
              </Link>
            </div>
            {yaklasanFuarlar.length === 0 ? (
              <div className="rounded-xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">
                Önümüzdeki 30 gün içinde planlanan fuar yok.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {yaklasanFuarlar.map((f) => {
                  const gun = kalanGun(f.tarih);
                  return (
                    <div
                      key={f.id}
                      className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50/50 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <span className="font-medium text-stone-900">{f.ad}</span>
                        <span className="ml-2 text-sm text-stone-500">
                          {f.lokasyon} · {formatTarih(f.tarih)}
                        </span>
                      </div>
                      <span className="w-fit rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                        {gun === 0 ? "bugün" : `${gun} gün kaldı`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Yanıt bekleyen distribütörler */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium text-stone-700">Yanıt bekleyen görüşmeler</h2>
              <Link href="/panel/distributorler" className="text-sm text-stone-500 hover:text-stone-900 hover:underline">
                Tümünü gör
              </Link>
            </div>
            {uzunSureYanitBekleyenler.length === 0 ? (
              <div className="rounded-xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">
                Yanıt bekleyen görüşme yok.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {uzunSureYanitBekleyenler.map((d) => (
                  <div
                    key={d.id}
                    className="flex flex-col gap-1 rounded-xl border border-stone-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <span className="font-medium text-stone-900">{d.firmaAdi}</span>
                      <span className="ml-2 text-sm text-stone-500">
                        {d.ulke} · {BOLGE_LABEL[d.bolge]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}
