"use client";

import { useEffect, useState, useCallback } from "react";
import RequireAuth from "@/components/RequireAuth";
import TopBar from "@/components/TopBar";
import PanelTabs from "@/components/PanelTabs";
import {
  subscribeHaberSorgulari,
  addHaberSorgusu,
  deleteHaberSorgusu,
  VARSAYILAN_SORGULAR,
  type HaberSorgusu,
} from "@/lib/haberSorgulari";
import { haberleriGetir, type HaberOgesi } from "@/lib/haberler";

export default function PiyasaNabziPage() {
  return (
    <RequireAuth>
      <TopBar />
      <PanelTabs />
      <PiyasaNabziContent />
    </RequireAuth>
  );
}

function formatTarih(pubDate: string): string {
  try {
    const d = new Date(pubDate);
    return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return pubDate;
  }
}

function PiyasaNabziContent() {
  const [sorgular, setSorgular] = useState<HaberSorgusu[]>([]);
  const [sorgularYukleniyor, setSorgularYukleniyor] = useState(true);
  const [haberler, setHaberler] = useState<Record<string, HaberOgesi[]>>({});
  const [haberYukleniyor, setHaberYukleniyor] = useState(false);
  const [haberHata, setHaberHata] = useState<Record<string, boolean>>({});
  const [sonGuncelleme, setSonGuncelleme] = useState<Date | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [yeniBaslik, setYeniBaslik] = useState("");
  const [yeniSorgu, setYeniSorgu] = useState("");
  const [ekleniyor, setEkleniyor] = useState(false);
  const [ilkKurulumYapiliyor, setIlkKurulumYapiliyor] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeHaberSorgulari(
      (data) => {
        setSorgular(data);
        setSorgularYukleniyor(false);
      },
      () => setSorgularYukleniyor(false)
    );
    return () => unsubscribe();
  }, []);

  // İlk kullanımda hiç sorgu yoksa varsayılan seti otomatik ekle.
  useEffect(() => {
    if (sorgularYukleniyor || sorgular.length > 0 || ilkKurulumYapiliyor) return;
    setIlkKurulumYapiliyor(true);
    Promise.all(VARSAYILAN_SORGULAR.map((s) => addHaberSorgusu(s.baslik, s.sorgu))).catch(() => {});
  }, [sorgularYukleniyor, sorgular.length, ilkKurulumYapiliyor]);

  const tumHaberleriYenile = useCallback(async (zorlaYenile = false) => {
    if (sorgular.length === 0) return;
    setHaberYukleniyor(true);
    const yeniHatalar: Record<string, boolean> = {};
    const yeniHaberler: Record<string, HaberOgesi[]> = {};

    await Promise.all(
      sorgular.map(async (s) => {
        try {
          yeniHaberler[s.id] = await haberleriGetir(s.sorgu, s.baslik, zorlaYenile);
        } catch {
          yeniHatalar[s.id] = true;
        }
      })
    );

    setHaberler(yeniHaberler);
    setHaberHata(yeniHatalar);
    setSonGuncelleme(new Date());
    setHaberYukleniyor(false);
  }, [sorgular]);

  useEffect(() => {
    if (sorgular.length > 0) {
      tumHaberleriYenile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorgular.length]);

  async function handleSorguEkle(e: React.FormEvent) {
    e.preventDefault();
    if (!yeniBaslik.trim() || !yeniSorgu.trim()) return;
    setEkleniyor(true);
    try {
      await addHaberSorgusu(yeniBaslik.trim(), yeniSorgu.trim());
      setYeniBaslik("");
      setYeniSorgu("");
      setShowForm(false);
    } finally {
      setEkleniyor(false);
    }
  }

  const tumHaberlerListesi = Object.values(haberler).flat();
  const onemliSayisi = tumHaberlerListesi.filter((h) => h.onemliMi).length;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5 sm:py-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-medium text-gray-900">Piyasa Nabzı</h1>
          <p className="text-sm text-gray-500">
            {sorgular.length} takip konusu
            {onemliSayisi > 0 && <span className="text-brand-500"> · {onemliSayisi} dikkat çekici haber</span>}
            {sonGuncelleme && (
              <span> · son güncelleme {sonGuncelleme.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => tumHaberleriYenile(true)}
            disabled={haberYukleniyor}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            {haberYukleniyor ? "Yenileniyor…" : "Yenile"}
          </button>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="rounded-lg bg-brand-400 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-500"
          >
            {showForm ? "Kapat" : "+ Konu ekle"}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSorguEkle} className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-3">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Başlık (panelde görünecek isim)</label>
            <input
              value={yeniBaslik}
              onChange={(e) => setYeniBaslik(e.target.value)}
              placeholder="örn. Mısır inşaat sektörü"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 sm:text-sm"
            />
          </div>
          <div className="mb-3">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Arama terimi</label>
            <input
              value={yeniSorgu}
              onChange={(e) => setYeniSorgu(e.target.value)}
              placeholder="örn. Mısır inşaat sektörü yatırım"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 sm:text-sm"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={ekleniyor}
              className="rounded-lg bg-brand-400 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-500 disabled:opacity-60"
            >
              Ekle
            </button>
          </div>
        </form>
      )}

      {sorgularYukleniyor && <p className="text-sm text-gray-500">Yükleniyor…</p>}

      {!sorgularYukleniyor && sorgular.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
          <p className="text-sm text-gray-500">Takip edilecek bir konu ekleyin.</p>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {sorgular.map((s) => (
          <SorguBolumu
            key={s.id}
            sorgu={s}
            haberler={haberler[s.id] || []}
            hata={!!haberHata[s.id]}
            yukleniyor={haberYukleniyor && !haberler[s.id] && !haberHata[s.id]}
            onSil={() => deleteHaberSorgusu(s.id)}
          />
        ))}
      </div>

      <p className="mt-6 text-xs text-gray-400">
        Haberler{" "}
        <a
          href="https://currentsapi.services"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-brand-500"
        >
          Currents API
        </a>{" "}
        üzerinden otomatik çekilir. Vurgulanan haberler; mevzuat, ihale, yatırım,
        fuar, sertifika gibi anahtar kelimelere göre basitçe öne çıkarılır — bu
        bir yorum değil, dikkat çekme amaçlı bir işaretlemedir.
      </p>
    </main>
  );
}

function SorguBolumu({
  sorgu,
  haberler,
  hata,
  yukleniyor,
  onSil,
}: {
  sorgu: HaberSorgusu;
  haberler: HaberOgesi[];
  hata: boolean;
  yukleniyor: boolean;
  onSil: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [genisletildi, setGenisletildi] = useState(false);

  const siraliHaberler = [...haberler].sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );
  const gosterilecekHaberler = genisletildi ? siraliHaberler : siraliHaberler.slice(0, 2);
  const kalanSayi = siraliHaberler.length - 2;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <button
          onClick={() => setGenisletildi((g) => !g)}
          disabled={siraliHaberler.length <= 2}
          className="flex items-center gap-1.5 text-left text-sm font-medium text-gray-700 hover:text-brand-500 disabled:hover:text-gray-700"
        >
          {siraliHaberler.length > 2 && (
            <svg
              viewBox="0 0 16 16"
              fill="none"
              className={`h-3.5 w-3.5 shrink-0 transition-transform ${genisletildi ? "rotate-90" : ""}`}
            >
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {sorgu.baslik}
        </button>
        {confirmDelete ? (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">Silinsin mi?</span>
            <button onClick={onSil} className="font-medium text-red-600 hover:underline">
              Evet
            </button>
            <button onClick={() => setConfirmDelete(false)} className="text-gray-500 hover:underline">
              Vazgeç
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(true)} className="text-xs text-gray-400 hover:text-red-600">
            Konuyu kaldır
          </button>
        )}
      </div>

      {yukleniyor && <p className="text-sm text-gray-400">Haberler yükleniyor…</p>}
      {hata && <p className="text-sm text-gray-400">Bu konu için haberler şu anda alınamıyor.</p>}
      {!yukleniyor && !hata && siraliHaberler.length === 0 && (
        <p className="text-sm text-gray-400">Güncel haber bulunamadı.</p>
      )}

      <div className="flex flex-col gap-1.5">
        {gosterilecekHaberler.map((h, i) => (
          <a
            key={i}
            href={h.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm transition hover:bg-gray-50 ${
              h.onemliMi ? "border-brand-200 bg-brand-50/40" : "border-gray-200 bg-white"
            }`}
          >
            {h.onemliMi && (
              <span className="mt-0.5 shrink-0 rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-medium text-brand-600">
                dikkat
              </span>
            )}
            <span className="flex-1 text-gray-800">{h.title}</span>
            <span className="shrink-0 text-xs text-gray-400">{formatTarih(h.pubDate)}</span>
          </a>
        ))}
      </div>

      {!genisletildi && kalanSayi > 0 && (
        <button
          onClick={() => setGenisletildi(true)}
          className="mt-1.5 text-xs text-gray-400 hover:text-brand-500"
        >
          +{kalanSayi} haber daha
        </button>
      )}
    </div>
  );
}
