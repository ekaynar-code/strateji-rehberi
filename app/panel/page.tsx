"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import RequireAuth from "@/components/RequireAuth";
import TopBar from "@/components/TopBar";
import PanelTabs from "@/components/PanelTabs";
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
import { subscribeHaberSorgulari, type HaberSorgusu } from "@/lib/haberSorgulari";
import { haberleriGetir, type HaberOgesi } from "@/lib/haberler";
import { subscribeTodos, todoKalanGun, type Todo } from "@/lib/todos";

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
  const router = useRouter();
  const [distributorler, setDistributorler] = useState<Distributor[]>([]);
  const [fuarlar, setFuarlar] = useState<Fuar[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [onemliHaberler, setOnemliHaberler] = useState<HaberOgesi[]>([]);
  const [haberYukleniyor, setHaberYukleniyor] = useState(true);

  useEffect(() => {
    let d1 = false;
    let d2 = false;
    let d3 = false;
    const checkDone = () => {
      if (d1 && d2 && d3) setLoading(false);
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
    const unsub3 = subscribeTodos(
      (data) => {
        setTodos(data);
        d3 = true;
        checkDone();
      },
      () => {
        d3 = true;
        checkDone();
      }
    );

    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, []);

  // Piyasa Nabzı'ndaki takip konularına göre en güncel önemli haberleri çek.
  useEffect(() => {
    let iptal = false;

    const unsub = subscribeHaberSorgulari(
      async (sorgular: HaberSorgusu[]) => {
        if (sorgular.length === 0) {
          if (!iptal) setHaberYukleniyor(false);
          return;
        }
        try {
          const sonuclar = await Promise.all(
            sorgular.map((s) =>
              haberleriGetir(s.sorgu, s.baslik).catch(() => [] as HaberOgesi[])
            )
          );
          if (iptal) return;
          const tumu = sonuclar.flat().filter((h) => h.onemliMi);
          setOnemliHaberler(tumu.slice(0, 3));
        } finally {
          if (!iptal) setHaberYukleniyor(false);
        }
      },
      () => {
        if (!iptal) setHaberYukleniyor(false);
      }
    );

    return () => {
      iptal = true;
      unsub();
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

  const yaklasanGorevler = useMemo(
    () =>
      todos
        .filter((t) => !t.tamamlandi && t.sonTarih)
        .sort((a, b) => todoKalanGun(a.sonTarih!) - todoKalanGun(b.sonTarih!))
        .slice(0, 3),
    [todos]
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
        <h1 className="text-lg font-medium text-gray-900">Genel Bakış</h1>
        <p className="text-sm text-gray-500">İhracat ve pazar geliştirme faaliyetlerinin özeti</p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Yükleniyor…</p>
      ) : (
        <>
          {/* KPI kartları */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-xs text-gray-500">Toplam distribütör kaydı</div>
              <div className="mt-1 text-2xl font-medium text-gray-900">{distributorler.length}</div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-xs text-gray-500">Aktif görüşme</div>
              <div className="mt-1 text-2xl font-medium text-gray-900">{aktifGorusmeler}</div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-xs text-gray-500">Anlaşma sağlanan</div>
              <div className="mt-1 text-2xl font-medium text-green-700">{anlasmaSayisi}</div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-xs text-gray-500">30 gün içindeki fuar</div>
              <div className="mt-1 text-2xl font-medium text-amber-700">{yaklasanFuarlar.length}</div>
            </div>
          </div>

          {/* Piyasa Nabzı özeti */}
          <button
            onClick={() => router.push("/panel/piyasa-nabzi")}
            className="mb-6 block w-full rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-brand-300 hover:bg-brand-50/30"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Piyasa Nabzı</span>
              <span className="text-xs text-gray-400">Tümünü gör →</span>
            </div>
            {haberYukleniyor ? (
              <p className="text-sm text-gray-400">Haberler yükleniyor…</p>
            ) : onemliHaberler.length === 0 ? (
              <p className="text-sm text-gray-400">Şu anda dikkat çekici bir haber yok.</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {onemliHaberler.map((h, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 shrink-0 rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-medium text-brand-600">
                      dikkat
                    </span>
                    <span className="text-gray-800">{h.title}</span>
                  </div>
                ))}
              </div>
            )}
          </button>

          {/* Bölge dağılımı */}
          {distributorler.length > 0 && (
            <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
              <div className="mb-3 text-sm font-medium text-gray-700">Bölge dağılımı — distribütör kayıtları</div>
              <div className="flex flex-wrap gap-4">
                {Object.entries(BOLGE_LABEL).map(([key, label]) => (
                  <div key={key} className="flex items-baseline gap-1.5">
                    <span className="text-lg font-medium text-gray-900">{bolgeDagilimi[key] || 0}</span>
                    <span className="text-sm text-gray-500">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Yaklaşan fuarlar */}
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-700">Yaklaşan fuarlar (30 gün içinde)</h2>
              <Link href="/panel/fuarlar" className="text-sm text-gray-500 hover:text-gray-900 hover:underline">
                Tümünü gör
              </Link>
            </div>
            {yaklasanFuarlar.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
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
                        <span className="font-medium text-gray-900">{f.ad}</span>
                        <span className="ml-2 text-sm text-gray-500">
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

          {/* Yaklaşan görevler */}
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-700">Yaklaşan görevler</h2>
              <Link href="/panel/yapilacaklar" className="text-sm text-gray-500 hover:text-gray-900 hover:underline">
                Tümünü gör
              </Link>
            </div>
            {yaklasanGorevler.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                Son tarihi olan bekleyen görev yok.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {yaklasanGorevler.map((t) => {
                  const gun = todoKalanGun(t.sonTarih!);
                  const gecmis = gun < 0;
                  const yaklasiyor = gun >= 0 && gun <= 7;
                  return (
                    <Link
                      key={t.id}
                      href="/panel/yapilacaklar"
                      className={`flex flex-col gap-1 rounded-xl border p-3 transition hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between ${
                        gecmis ? "border-red-200 bg-red-50/40" : yaklasiyor ? "border-brand-200 bg-brand-50/40" : "border-gray-200 bg-white"
                      }`}
                    >
                      <span className="font-medium text-gray-900">{t.baslik}</span>
                      <span
                        className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${
                          gecmis
                            ? "bg-red-100 text-red-700"
                            : yaklasiyor
                              ? "bg-brand-100 text-brand-600"
                              : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {gecmis ? "süresi geçti" : gun === 0 ? "bugün" : `${gun} gün kaldı`}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Yanıt bekleyen distribütörler */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-700">Yanıt bekleyen görüşmeler</h2>
              <Link href="/panel/distributorler" className="text-sm text-gray-500 hover:text-gray-900 hover:underline">
                Tümünü gör
              </Link>
            </div>
            {uzunSureYanitBekleyenler.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                Yanıt bekleyen görüşme yok.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {uzunSureYanitBekleyenler.map((d) => (
                  <div
                    key={d.id}
                    className="flex flex-col gap-1 rounded-xl border border-gray-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <span className="font-medium text-gray-900">{d.firmaAdi}</span>
                      <span className="ml-2 text-sm text-gray-500">
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
