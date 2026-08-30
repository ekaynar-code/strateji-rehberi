"use client";

import { useEffect, useState } from "react";
import RequireAuth from "@/components/RequireAuth";
import TopBar from "@/components/TopBar";
import PanelTabs from "@/components/PanelTabs";
import CsvIceAktarForm from "@/components/CsvIceAktarForm";
import FuarCsvIceAktarForm from "@/components/FuarCsvIceAktarForm";
import {
  subscribePanelAyarlari,
  panelAyarlariKaydet,
  type PanelAyarlari,
} from "@/lib/panelAyarlari";
import { subscribeLoglar, type LogKaydi } from "@/lib/degisiklikLog";
import { useAuth } from "@/lib/AuthContext";
import {
  subscribeTumKullanicilar,
  kullaniciYetkileriniKaydet,
  kullaniciGenelBakisBolumleriniKaydet,
  kullaniciYetkiKaydiniSil,
  MODUL_LISTESI,
  MODUL_LABEL,
  GENEL_BAKIS_BOLUMU_LISTESI,
  GENEL_BAKIS_BOLUMU_LABEL,
  YONETIM_EMAIL,
  type KullaniciYetkisi,
  type ModulAdi,
  type GenelBakisBolumu,
} from "@/lib/kullaniciYetkileri";

const HAREKETSIZLIK_SECENEKLERI = [5, 10, 15, 30, 60];
const LOG_GORME_YETKISI_OLAN = "yonetim@pimetri.com";

export default function AyarlarPage() {
  return (
    <RequireAuth>
      <TopBar />
      <PanelTabs />
      <AyarlarContent />
    </RequireAuth>
  );
}

function AyarlarContent() {
  const { user } = useAuth();
  const [ayarlar, setAyarlar] = useState<PanelAyarlari | null>(null);
  const [csvTuru, setCsvTuru] = useState<"firsat" | "fuar" | null>(null);
  const [loglar, setLoglar] = useState<LogKaydi[]>([]);
  const [loglarYuklendi, setLoglarYuklendi] = useState(false);
  const [kullanicilar, setKullanicilar] = useState<KullaniciYetkisi[]>([]);
  const [kullanicilarYuklendi, setKullanicilarYuklendi] = useState(false);
  const [silmeOnayi, setSilmeOnayi] = useState<string | null>(null);

  const logGormeYetkisiVar = user?.email === LOG_GORME_YETKISI_OLAN;
  const yonetimMi = user?.email === YONETIM_EMAIL;

  useEffect(() => {
    const unsub = subscribePanelAyarlari(
      (a) => setAyarlar(a),
      () => {}
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!logGormeYetkisiVar) return;
    const unsub = subscribeLoglar(
      (l) => {
        setLoglar(l);
        setLoglarYuklendi(true);
      },
      () => setLoglarYuklendi(true)
    );
    return () => unsub();
  }, [logGormeYetkisiVar]);

  useEffect(() => {
    if (!yonetimMi) return;
    const unsub = subscribeTumKullanicilar(
      (k) => {
        setKullanicilar(k);
        setKullanicilarYuklendi(true);
      },
      () => setKullanicilarYuklendi(true)
    );
    return () => unsub();
  }, [yonetimMi]);

  async function handleModulToggle(email: string, mevcutModuller: ModulAdi[], modul: ModulAdi) {
    const yeniModuller = mevcutModuller.includes(modul)
      ? mevcutModuller.filter((m) => m !== modul)
      : [...mevcutModuller, modul];
    await kullaniciYetkileriniKaydet(email, yeniModuller);
  }

  async function handleGenelBakisBolumuToggle(
    email: string,
    mevcutBolumler: GenelBakisBolumu[],
    bolum: GenelBakisBolumu
  ) {
    const yeniBolumler = mevcutBolumler.includes(bolum)
      ? mevcutBolumler.filter((b) => b !== bolum)
      : [...mevcutBolumler, bolum];
    await kullaniciGenelBakisBolumleriniKaydet(email, yeniBolumler);
  }

  async function handleKullaniciSil(email: string) {
    await kullaniciYetkiKaydiniSil(email);
    setSilmeOnayi(null);
  }

  async function handleHareketsizlikDegistir(dakika: number) {
    await panelAyarlariKaydet({ hareketsizlikSuresiDakika: dakika });
  }

  async function handleTemaDegistir(tema: "acik" | "koyu") {
    await panelAyarlariKaydet({ tema });
  }

  if (!ayarlar) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-5 sm:py-6">
        <p className="text-sm text-gray-500">Yükleniyor…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-5 sm:py-6">
      <h1 className="mb-5 text-lg font-medium text-gray-900">Ayarlar</h1>

      <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-1 text-sm font-medium text-gray-700">Görünüm</h2>
        <p className="mb-3 text-xs text-gray-500">Panelin renk temasını seçin.</p>
        <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
          <button
            onClick={() => handleTemaDegistir("acik")}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
              ayarlar.tema === "acik" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            Açık
          </button>
          <button
            onClick={() => handleTemaDegistir("koyu")}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
              ayarlar.tema === "koyu" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            Koyu
          </button>
        </div>
      </div>

      <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-1 text-sm font-medium text-gray-700">Otomatik oturum kapatma</h2>
        <p className="mb-3 text-xs text-gray-500">
          Belirtilen süre boyunca hiçbir etkileşim olmazsa oturum otomatik kapatılır.
        </p>
        <div className="flex flex-wrap gap-2">
          {HAREKETSIZLIK_SECENEKLERI.map((dk) => (
            <button
              key={dk}
              onClick={() => handleHareketsizlikDegistir(dk)}
              className={`rounded-lg px-3 py-1.5 text-sm transition ${
                ayarlar.hareketsizlikSuresiDakika === dk
                  ? "bg-brand-400 text-white"
                  : "border border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {dk} dk
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-1 text-sm font-medium text-gray-700">Toplu veri içe aktarma</h2>
        <p className="mb-3 text-xs text-gray-500">
          CSV dosyasından satış fırsatı veya fuar kaydı toplu olarak ekleyin.
        </p>
        <div className="mb-3 flex gap-2">
          <button
            onClick={() => setCsvTuru((t) => (t === "firsat" ? null : "firsat"))}
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              csvTuru === "firsat"
                ? "bg-gray-800 text-white"
                : "border border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            Satış fırsatları CSV
          </button>
          <button
            onClick={() => setCsvTuru((t) => (t === "fuar" ? null : "fuar"))}
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              csvTuru === "fuar"
                ? "bg-gray-800 text-white"
                : "border border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            Fuarlar CSV
          </button>
        </div>

        {csvTuru === "firsat" && <CsvIceAktarForm onDone={() => setCsvTuru(null)} />}
        {csvTuru === "fuar" && <FuarCsvIceAktarForm onDone={() => setCsvTuru(null)} />}
      </div>

      {yonetimMi && (
        <div className="mt-5 rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="mb-1 text-sm font-medium text-gray-700">Kullanıcı yetkileri</h2>
          <p className="mb-3 text-xs text-gray-500">
            Yeni bir kullanıcı ilk giriş yaptığında hiçbir modüle erişimi olmaz. Aşağıdan
            hangi modülleri görebileceklerini işaretleyin. &quot;Yetki kaydını sil&quot;
            sadece panel içindeki kaydı siler, Firebase&apos;deki giriş hesabını etkilemez
            (kullanıcı tekrar giriş yaparsa en kısıtlı halde yeniden listelenir).
          </p>

          {!kullanicilarYuklendi && <p className="text-sm text-gray-400">Yükleniyor…</p>}
          {kullanicilarYuklendi && kullanicilar.length === 0 && (
            <p className="text-sm text-gray-400">Henüz giriş yapan başka kullanıcı yok.</p>
          )}

          <div className="flex flex-col gap-3">
            {kullanicilar
              .filter((k) => k.email !== YONETIM_EMAIL)
              .map((k) => (
                <div key={k.email} className="rounded-lg border border-gray-200 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{k.kullaniciAdi}</span>
                      <span className="text-xs text-gray-400">{k.email}</span>
                      {!k.onaylandi && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                          Onay bekliyor
                        </span>
                      )}
                    </div>
                    {silmeOnayi === k.email ? (
                      <div className="flex shrink-0 items-center gap-2 text-xs">
                        <span className="text-gray-500">Silinsin mi?</span>
                        <button
                          onClick={() => handleKullaniciSil(k.email)}
                          className="font-medium text-red-600 hover:underline"
                        >
                          Evet, sil
                        </button>
                        <button
                          onClick={() => setSilmeOnayi(null)}
                          className="text-gray-500 hover:underline"
                        >
                          Vazgeç
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSilmeOnayi(k.email)}
                        className="shrink-0 text-xs text-gray-400 hover:text-red-600"
                      >
                        Yetki kaydını sil
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {MODUL_LISTESI.map((modul) => {
                      const acik = k.moduller.includes(modul);
                      return (
                        <button
                          key={modul}
                          onClick={() => handleModulToggle(k.email, k.moduller, modul)}
                          className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                            acik
                              ? "bg-brand-400 text-white"
                              : "border border-gray-300 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {MODUL_LABEL[modul]}
                        </button>
                      );
                    })}
                  </div>

                  {k.moduller.includes("genel_bakis") && (
                    <div className="mt-2 border-t border-gray-100 pt-2">
                      <p className="mb-1.5 text-[11px] text-gray-400">
                        Genel Bakış içinde görünecek bölümler:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {GENEL_BAKIS_BOLUMU_LISTESI.map((bolum) => {
                          const acik = k.genelBakisBolumleri.includes(bolum);
                          return (
                            <button
                              key={bolum}
                              onClick={() =>
                                handleGenelBakisBolumuToggle(k.email, k.genelBakisBolumleri, bolum)
                              }
                              className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                                acik
                                  ? "bg-gray-700 text-white"
                                  : "border border-gray-300 text-gray-400 hover:bg-gray-50"
                              }`}
                            >
                              {GENEL_BAKIS_BOLUMU_LABEL[bolum]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {logGormeYetkisiVar && (
        <div className="mt-5 rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="mb-1 text-sm font-medium text-gray-700">Değişiklik günlüğü</h2>
          <p className="mb-3 text-xs text-gray-500">
            Panelde yapılan son değişiklikler — sadece yönetim hesabı bu bölümü görebilir.
          </p>

          {!loglarYuklendi && <p className="text-sm text-gray-400">Yükleniyor…</p>}
          {loglarYuklendi && loglar.length === 0 && (
            <p className="text-sm text-gray-400">Henüz kayıtlı bir değişiklik yok.</p>
          )}

          <div className="flex max-h-96 flex-col gap-1.5 overflow-y-auto">
            {loglar.map((log) => (
              <div key={log.id} className="flex items-start justify-between gap-2 border-b border-gray-50 pb-1.5 text-xs">
                <div>
                  <span className="font-medium text-gray-800">{log.kullanici}</span>
                  <span className="text-gray-500"> {log.eylem}</span>
                  {log.detay && <span className="text-gray-400"> · {log.detay}</span>}
                  <span className="ml-1 text-gray-300">({log.modul})</span>
                </div>
                <span className="shrink-0 text-gray-300">
                  {log.createdAt?.toDate().toLocaleString("tr-TR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
