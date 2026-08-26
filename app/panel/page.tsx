"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import RequireAuth from "@/components/RequireAuth";
import TopBar from "@/components/TopBar";
import PanelTabs from "@/components/PanelTabs";
import ManuelCiroBolumu from "@/components/ManuelCiroBolumu";
import AksiyonListesi from "@/components/AksiyonListesi";
import CeoOzetBolumu from "@/components/CeoOzetBolumu";
import UretimOzetBolumu from "@/components/UretimOzetBolumu";
import {
  subscribeDistributors,
  type Distributor,
  type ParaBirimi,
  BOLGE_LABEL,
} from "@/lib/distributors";
import {
  subscribeFuarlar,
  type Fuar,
  kalanGun,
} from "@/lib/fuarlar";
import { subscribeTakipEdilenUlkeler, type TakipEdilenUlke } from "@/lib/haberSorgulari";
import { musavirlikBultenGetir, type MusavirlikYazisi } from "@/lib/haberler";
import { subscribeTodos, todoKalanGun, type Todo } from "@/lib/todos";
import { subscribeHedef, hedefKaydet, type Hedef } from "@/lib/hedefler";
import { kurlariGetir, tryyeCevir, type KurVeri } from "@/lib/kurlar";
import { uretimApiBagliMi, uretimOzetGetir, type UretimOzet } from "@/lib/uretimApi";
import { yeniSiparisleriCiroyaEkle } from "@/lib/siparisOtomasyon";
import {
  subscribeManuelCiro,
  manuelCiroEkle,
  manuelCiroSil,
  type ManuelCiroKaydi,
} from "@/lib/manuelCiro";
import { aksiyonlariHesapla } from "@/lib/aksiyonMotoru";

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
  const [onemliHaberler, setOnemliHaberler] = useState<MusavirlikYazisi[]>([]);
  const [haberYukleniyor, setHaberYukleniyor] = useState(true);
  const [hedef, setHedef] = useState<Hedef | null>(null);
  const [kur, setKur] = useState<KurVeri>({ usdTry: null, eurTry: null });
  const [hedefDuzenle, setHedefDuzenle] = useState(false);
  const [hedefGirisi, setHedefGirisi] = useState("");
  const [baslangicGirisi, setBaslangicGirisi] = useState("");
  const [bitisGirisi, setBitisGirisi] = useState("");
  const [hedefDetayAcik, setHedefDetayAcik] = useState(false);
  const [manuelKayitlar, setManuelKayitlar] = useState<ManuelCiroKaydi[]>([]);
  const [manuelFormAcik, setManuelFormAcik] = useState(false);
  const [uretimOzet, setUretimOzet] = useState<UretimOzet | null>(null);

  useEffect(() => {
    const unsub = subscribeManuelCiro(
      (data) => setManuelKayitlar(data),
      () => {}
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = subscribeHedef(
      (data) => setHedef(data),
      () => {}
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    let iptal = false;
    kurlariGetir()
      .then((k) => {
        if (!iptal) setKur(k);
      })
      .catch(() => {});
    return () => {
      iptal = true;
    };
  }, []);

  // Üretim API'sinden özet veriyi çek — hem Aksiyon Motoru için (geciken
  // sipariş uyarısı) hem de aktif hedef döneminde otomatik ciro eklemek için.
  useEffect(() => {
    if (!uretimApiBagliMi()) return;
    let iptal = false;
    uretimOzetGetir()
      .then((ozet) => {
        if (iptal) return;
        setUretimOzet(ozet);
        if (hedef) yeniSiparisleriCiroyaEkle(ozet, hedef).catch(() => {});
      })
      .catch(() => {});
    return () => {
      iptal = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hedef?.baslangic, hedef?.bitis]);

  async function handleHedefKaydet() {
    const sayi = parseFloat(hedefGirisi);
    if (isNaN(sayi) || sayi <= 0) return;
    if (!baslangicGirisi || !bitisGirisi) return;
    await hedefKaydet(baslangicGirisi, bitisGirisi, sayi);
    setHedefDuzenle(false);
    setHedefGirisi("");
  }

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

  // Piyasa Nabzı'ndaki takip edilen ülkelere göre en güncel ihaleleri çek.
  useEffect(() => {
    let iptal = false;

    const unsub = subscribeTakipEdilenUlkeler(
      async (ulkeler: TakipEdilenUlke[]) => {
        if (ulkeler.length === 0) {
          if (!iptal) setHaberYukleniyor(false);
          return;
        }
        try {
          const sonuc = await musavirlikBultenGetir(
            "ihaleler",
            ulkeler.map((u) => u.ulkeAdi)
          ).catch(() => [] as MusavirlikYazisi[]);
          if (iptal) return;
          // Sektörle ilgili olanları öne al, sonra kalanları ekle.
          const siraliSonuc = [...sonuc].sort(
            (a, b) => Number(b.sektorleIlgili) - Number(a.sektorleIlgili)
          );
          setOnemliHaberler(siraliSonuc.slice(0, 3));
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
          return gun >= 0 && gun <= 60 && f.durum !== "tamamlandi" && f.durum !== "katilinmayacak";
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

  const gerceklesenCiroTry = useMemo(() => {
    const firsatlardanGelen = distributorler
      .filter((d) => d.durum === "anlasma" && d.tahminiCiro && d.tahminiCiroParaBirimi)
      .reduce((toplam, d) => {
        const tryDegeri = tryyeCevir(d.tahminiCiro!, d.tahminiCiroParaBirimi!, kur);
        return toplam + (tryDegeri ?? 0);
      }, 0);

    const manuelGelen = manuelKayitlar.reduce((toplam, m) => {
      const tryDegeri = tryyeCevir(m.tutar, m.paraBirimi, kur);
      return toplam + (tryDegeri ?? 0);
    }, 0);

    return firsatlardanGelen + manuelGelen;
  }, [distributorler, manuelKayitlar, kur]);

  const hedefYuzde = hedef ? Math.min(100, Math.round((gerceklesenCiroTry / hedef.hedefTry) * 100)) : 0;

  const aksiyonOnerileri = useMemo(
    () =>
      aksiyonlariHesapla({
        distributorler,
        fuarlar,
        todos,
        onemliHaberler,
        hedef,
        gerceklesenCiroTry,
        uretimOzet,
      }),
    [distributorler, fuarlar, todos, onemliHaberler, hedef, gerceklesenCiroTry, uretimOzet]
  );

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
          <AksiyonListesi oneriler={aksiyonOnerileri} />

          <CeoOzetBolumu />

          <UretimOzetBolumu />

          {/* Ciro hedefi (dönem bazlı) */}
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {hedef ? `Ciro hedefi (${hedef.baslangic} – ${hedef.bitis})` : "Ciro hedefi"}
              </span>
              {!hedefDuzenle && (
                <button
                  onClick={() => {
                    setHedefGirisi(hedef?.hedefTry.toString() || "");
                    setBaslangicGirisi(hedef?.baslangic || "");
                    setBitisGirisi(hedef?.bitis || "");
                    setHedefDuzenle(true);
                  }}
                  className="text-xs text-gray-400 hover:text-brand-500"
                >
                  {hedef ? "Düzenle" : "Hedef belirle"}
                </button>
              )}
            </div>

            {hedefDuzenle ? (
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <label className="text-xs text-gray-500">Başlangıç</label>
                    <input
                      type="date"
                      value={baslangicGirisi}
                      onChange={(e) => setBaslangicGirisi(e.target.value)}
                      className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm outline-none focus:border-brand-400"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <label className="text-xs text-gray-500">Bitiş</label>
                    <input
                      type="date"
                      value={bitisGirisi}
                      onChange={(e) => setBitisGirisi(e.target.value)}
                      className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm outline-none focus:border-brand-400"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    value={hedefGirisi}
                    onChange={(e) => setHedefGirisi(e.target.value)}
                    placeholder="Dönem toplam ciro hedefi (TRY)"
                    className="min-w-0 flex-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm outline-none focus:border-brand-400"
                  />
                  <button
                    onClick={handleHedefKaydet}
                    className="shrink-0 rounded-lg bg-brand-400 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-500"
                  >
                    Kaydet
                  </button>
                  <button
                    onClick={() => setHedefDuzenle(false)}
                    className="shrink-0 text-sm text-gray-500 hover:underline"
                  >
                    Vazgeç
                  </button>
                </div>
              </div>
            ) : hedef ? (
              <>
                <div className="mb-1.5 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-brand-400 transition-all"
                    style={{ width: `${hedefYuzde}%` }}
                  />
                </div>
                <button
                  onClick={() => setHedefDetayAcik((a) => !a)}
                  className="flex w-full items-center justify-between text-xs text-gray-500"
                >
                  {hedefDetayAcik ? (
                    <span>
                      ₺{Math.round(gerceklesenCiroTry).toLocaleString("tr-TR")} / ₺
                      {hedef.hedefTry.toLocaleString("tr-TR")}
                    </span>
                  ) : (
                    <span className="tracking-widest">**** / ****</span>
                  )}
                  <span className="font-medium text-brand-600">
                    {hedefDetayAcik ? `%${hedefYuzde}` : "****"}
                  </span>
                </button>

                {hedefDetayAcik && (
                  <div className="mt-3 border-t border-gray-100 pt-3">
                    <p className="mb-3 text-xs text-gray-400">
                      Satış fırsatlarındaki anlaşmalar ve manuel kayıtlar güncel kurdan TRY&apos;ye çevrilerek toplanır.
                    </p>
                    <ManuelCiroBolumu
                      kayitlar={manuelKayitlar}
                      acik={manuelFormAcik}
                      onAcikDegistir={setManuelFormAcik}
                      kur={kur}
                    />
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500">
                Henüz bir hedef belirlenmedi. Yukarıdaki &quot;Hedef belirle&quot; ile başlayın.
              </p>
            )}
          </div>

          {/* KPI kartları */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <button
              onClick={() => router.push("/panel/distributorler")}
              className="rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-brand-300 hover:bg-brand-50/30"
            >
              <div className="text-xs text-gray-500">Toplam satış fırsatı</div>
              <div className="mt-1 text-2xl font-medium text-gray-900">{distributorler.length}</div>
            </button>
            <button
              onClick={() => router.push("/panel/distributorler")}
              className="rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-brand-300 hover:bg-brand-50/30"
            >
              <div className="text-xs text-gray-500">Aktif görüşme</div>
              <div className="mt-1 text-2xl font-medium text-gray-900">{aktifGorusmeler}</div>
            </button>
            <button
              onClick={() => router.push("/panel/distributorler")}
              className="rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-brand-300 hover:bg-brand-50/30"
            >
              <div className="text-xs text-gray-500">Anlaşma sağlanan</div>
              <div className="mt-1 text-2xl font-medium text-green-700">{anlasmaSayisi}</div>
            </button>
            <button
              onClick={() => router.push("/panel/fuarlar")}
              className="rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-brand-300 hover:bg-brand-50/30"
            >
              <div className="text-xs text-gray-500">60 gün içindeki fuar</div>
              <div className="mt-1 text-2xl font-medium text-amber-700">{yaklasanFuarlar.length}</div>
            </button>
          </div>

          {/* Piyasa Nabzı özeti */}
          <button
            onClick={() => router.push("/panel/piyasa-nabzi")}
            className="mb-6 block w-full rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-brand-300 hover:bg-brand-50/30"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Piyasa Nabzı — son gelişmeler</span>
              <span className="text-xs text-gray-400">Tümünü gör →</span>
            </div>
            {haberYukleniyor ? (
              <p className="text-sm text-gray-400">Yükleniyor…</p>
            ) : onemliHaberler.length === 0 ? (
              <p className="text-sm text-gray-400">Takip edilen ülkelerde güncel yazı yok.</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {onemliHaberler.map((h, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    {h.musavirlik && (
                      <span className="mt-0.5 shrink-0 rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-medium text-brand-600">
                        {h.musavirlik.replace(" Ticaret Müşavirliği", "")}
                      </span>
                    )}
                    <span className="text-gray-800">{h.title}</span>
                  </div>
                ))}
              </div>
            )}
          </button>

          {/* Bölge dağılımı */}
          {distributorler.length > 0 && (
            <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
              <div className="mb-3 text-sm font-medium text-gray-700">Bölge dağılımı — satış fırsatları</div>
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
              <h2 className="text-sm font-medium text-gray-700">Yaklaşan fuarlar (60 gün içinde)</h2>
              <Link href="/panel/fuarlar" className="text-sm text-gray-500 hover:text-gray-900 hover:underline">
                Tümünü gör
              </Link>
            </div>
            {yaklasanFuarlar.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                Önümüzdeki 60 gün içinde planlanan fuar yok.
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

          {/* Yanıt bekleyen fırsatlar */}
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
