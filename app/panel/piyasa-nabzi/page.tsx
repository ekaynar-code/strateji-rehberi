"use client";

import { useEffect, useState, useCallback } from "react";
import RequireAuth from "@/components/RequireAuth";
import TopBar from "@/components/TopBar";
import PanelTabs from "@/components/PanelTabs";
import {
  subscribeTakipEdilenUlkeler,
  ulkeEkle,
  ulkeSil,
  VARSAYILAN_ULKELER,
  type TakipEdilenUlke,
} from "@/lib/haberSorgulari";
import { musavirlikBultenGetir, type MusavirlikYazisi } from "@/lib/haberler";

export default function PiyasaNabziPage() {
  return (
    <RequireAuth>
      <TopBar />
      <PanelTabs />
      <PiyasaNabziContent />
    </RequireAuth>
  );
}

function PiyasaNabziContent() {
  const [ulkeler, setUlkeler] = useState<TakipEdilenUlke[]>([]);
  const [ulkelerYukleniyor, setUlkelerYukleniyor] = useState(true);
  const [ilkKurulumYapiliyor, setIlkKurulumYapiliyor] = useState(false);

  const [kategori, setKategori] = useState<"ihaleler" | "guncel">("ihaleler");
  const [yazilar, setYazilar] = useState<MusavirlikYazisi[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState(false);
  const [sonGuncelleme, setSonGuncelleme] = useState<Date | null>(null);

  const [ulkeFormAcik, setUlkeFormAcik] = useState(false);
  const [yeniUlke, setYeniUlke] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeTakipEdilenUlkeler(
      (data) => {
        setUlkeler(data);
        setUlkelerYukleniyor(false);
      },
      () => setUlkelerYukleniyor(false)
    );
    return () => unsubscribe();
  }, []);

  // İlk kullanımda hiç ülke yoksa varsayılan seti otomatik ekle.
  useEffect(() => {
    if (ulkelerYukleniyor || ulkeler.length > 0 || ilkKurulumYapiliyor) return;
    setIlkKurulumYapiliyor(true);
    Promise.all(VARSAYILAN_ULKELER.map((u) => ulkeEkle(u))).catch(() => {});
  }, [ulkelerYukleniyor, ulkeler.length, ilkKurulumYapiliyor]);

  const yenile = useCallback(
    async (zorlaYenile = false) => {
      if (ulkeler.length === 0) return;
      setYukleniyor(true);
      setHata(false);
      try {
        const sonuc = await musavirlikBultenGetir(
          kategori,
          ulkeler.map((u) => u.ulkeAdi),
          zorlaYenile
        );
        setYazilar(sonuc);
        setSonGuncelleme(new Date());
      } catch {
        setHata(true);
      } finally {
        setYukleniyor(false);
      }
    },
    [ulkeler, kategori]
  );

  useEffect(() => {
    if (ulkeler.length > 0) yenile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ulkeler.length, kategori]);

  async function handleUlkeEkle(e: React.FormEvent) {
    e.preventDefault();
    if (!yeniUlke.trim()) return;
    await ulkeEkle(yeniUlke.trim());
    setYeniUlke("");
    setUlkeFormAcik(false);
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5 sm:py-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-medium text-gray-900">Piyasa Nabzı</h1>
          <p className="text-sm text-gray-500">
            Ticaret Müşavirlikleri bülteni · {ulkeler.length} ülke takipte
            {sonGuncelleme && (
              <span> · son güncelleme {sonGuncelleme.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</span>
            )}
          </p>
        </div>
        <button
          onClick={() => yenile(true)}
          disabled={yukleniyor}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 sm:w-auto sm:py-2"
        >
          {yukleniyor ? "Yenileniyor…" : "Yenile"}
        </button>
      </div>

      {/* Kategori seçimi */}
      <div className="mb-4 flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
        <button
          onClick={() => setKategori("ihaleler")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
            kategori === "ihaleler" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
          }`}
        >
          İhaleler
        </button>
        <button
          onClick={() => setKategori("guncel")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
            kategori === "guncel" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
          }`}
        >
          Güncel Gelişmeler
        </button>
      </div>

      {/* Ülke listesi yönetimi */}
      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500">Takip edilen ülkeler</span>
          <button
            onClick={() => setUlkeFormAcik((a) => !a)}
            className="text-xs text-gray-400 hover:text-brand-500"
          >
            {ulkeFormAcik ? "Kapat" : "+ Ülke ekle"}
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {ulkeler.map((u) => (
            <span
              key={u.id}
              className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700"
            >
              {u.ulkeAdi}
              <button onClick={() => ulkeSil(u.id)} className="text-gray-400 hover:text-red-600">
                ×
              </button>
            </span>
          ))}
        </div>

        {ulkeFormAcik && (
          <form onSubmit={handleUlkeEkle} className="mt-2 flex gap-2">
            <input
              value={yeniUlke}
              onChange={(e) => setYeniUlke(e.target.value)}
              placeholder="Ülke adı (örn. Katar)"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-brand-400"
            />
            <button
              type="submit"
              className="rounded-lg bg-brand-400 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-500"
            >
              Ekle
            </button>
          </form>
        )}
      </div>

      {ulkelerYukleniyor && <p className="text-sm text-gray-500">Yükleniyor…</p>}

      {!ulkelerYukleniyor && ulkeler.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
          <p className="text-sm text-gray-500">Takip edilecek bir ülke ekleyin.</p>
        </div>
      )}

      {yukleniyor && <p className="text-sm text-gray-400">Yazılar yükleniyor…</p>}
      {hata && <p className="text-sm text-gray-400">Bülten şu anda alınamıyor.</p>}

      {!yukleniyor && !hata && ulkeler.length > 0 && yazilar.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
          <p className="text-sm text-gray-500">Seçili ülkelerde güncel yazı bulunamadı.</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {yazilar.map((y, i) => (
          <a
            key={i}
            href={y.link}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm transition hover:bg-gray-50"
          >
            <div className="text-gray-800">{y.title}</div>
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
              {y.musavirlik && <span>{y.musavirlik}</span>}
              {y.tarih && <span>· {y.tarih}</span>}
            </div>
          </a>
        ))}
      </div>

      <p className="mt-6 text-xs text-gray-400">
        Kaynak:{" "}
        <a
          href="https://dtybs.ticaret.gov.tr/blog/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-brand-500"
        >
          T.C. Ticaret Bakanlığı Ticaret Müşavirlikleri Bülteni
        </a>
        . Yazılar müşavirlik/başlık metninde geçen ülke adına göre filtrelenir.
      </p>
    </main>
  );
}
