"use client";

import { useEffect, useState, useMemo } from "react";
import RequireAuth from "@/components/RequireAuth";
import TopBar from "@/components/TopBar";
import PanelTabs from "@/components/PanelTabs";
import DistributorForm from "@/components/DistributorForm";
import DistributorCard from "@/components/DistributorCard";
import KanbanPano from "@/components/KanbanPano";
import {
  subscribeDistributors,
  type Distributor,
  type Bolge,
  type Profil,
  BOLGE_LABEL,
  PROFIL_LABEL,
} from "@/lib/distributors";
import { eskiProfilleriDonustur, type DonusumSonucu } from "@/lib/profilDonusum";

const ESKI_PROFILLER = ["distributor", "fitout", "diger"];

const BOLGE_FILTRELERI: (Bolge | "hepsi")[] = ["hepsi", "turkiye", "korfez", "balkanlar", "afrika"];
const PROFIL_FILTRELERI: (Profil | "hepsi")[] = ["hepsi", "uretici", "insaat_firmasi", "mimarlik_firmasi", "araci_sirket"];

export default function PanelPage() {
  return (
    <RequireAuth>
      <TopBar />
      <PanelTabs />
      <PanelContent />
    </RequireAuth>
  );
}

function PanelContent() {
  const [items, setItems] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [bolgeFiltre, setBolgeFiltre] = useState<Bolge | "hepsi">("hepsi");
  const [gorunum, setGorunum] = useState<"liste" | "kanban">("liste");
  const [profilFiltre, setProfilFiltre] = useState<Profil | "hepsi">("hepsi");

  useEffect(() => {
    const unsubscribe = subscribeDistributors(
      (data) => {
        setItems(data);
        setLoading(false);
      },
      () => {
        setError("Veriler yüklenemedi. Firestore güvenlik kurallarını kontrol edin.");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const filtered = useMemo(() => {
    let sonuc = bolgeFiltre === "hepsi" ? items : items.filter((i) => i.bolge === bolgeFiltre);
    if (profilFiltre !== "hepsi") sonuc = sonuc.filter((i) => i.profil === profilFiltre);
    return sonuc;
  }, [items, bolgeFiltre, profilFiltre]);

  const profilSayilari = useMemo(() => {
    const sayac: Record<string, number> = {};
    items.forEach((i) => {
      sayac[i.profil] = (sayac[i.profil] || 0) + 1;
    });
    return sayac;
  }, [items]);

  const eskiProfilliSayisi = useMemo(
    () => items.filter((i) => ESKI_PROFILLER.includes(i.profil)).length,
    [items]
  );

  const [donusumCalisiyor, setDonusumCalisiyor] = useState(false);
  const [donusumSonucu, setDonusumSonucu] = useState<DonusumSonucu | null>(null);

  async function handleProfilleriDonustur() {
    setDonusumCalisiyor(true);
    try {
      const sonuc = await eskiProfilleriDonustur();
      setDonusumSonucu(sonuc);
    } finally {
      setDonusumCalisiyor(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-5 sm:py-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-medium text-gray-900">
            Satış Fırsatları
          </h1>
          <p className="text-sm text-gray-500">
            {items.length} kayıt · {filtered.length} gösteriliyor
          </p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="w-full rounded-lg bg-brand-400 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-500 sm:w-auto sm:py-2"
        >
          {showForm ? "Formu kapat" : "+ Yeni kayıt"}
        </button>
      </div>

      {eskiProfilliSayisi > 0 && !donusumSonucu && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="mb-2 text-sm text-amber-800">
            {eskiProfilliSayisi} kayıt hâlâ eski profil değerlerini (distribütör, fit-out
            kontraktörü, diğer) kullanıyor. Bunları yeni profillere (distributor → aracı şirket,
            fitout → inşaat firması, diğer → mimarlık firması) çevirmek ister misiniz?
          </p>
          <button
            onClick={handleProfilleriDonustur}
            disabled={donusumCalisiyor}
            className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60"
          >
            {donusumCalisiyor ? "Dönüştürülüyor…" : `${eskiProfilliSayisi} kaydı şimdi düzelt`}
          </button>
        </div>
      )}

      {donusumSonucu && (
        <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-800">
            {donusumSonucu.guncellenen} kayıt güncellendi ({donusumSonucu.toplamTarandi} kayıt tarandı).
          </p>
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
          <button
            onClick={() => setGorunum("liste")}
            className={`rounded-md px-3 py-1 text-sm font-medium transition ${
              gorunum === "liste" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            Liste
          </button>
          <button
            onClick={() => setGorunum("kanban")}
            className={`rounded-md px-3 py-1 text-sm font-medium transition ${
              gorunum === "kanban" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            Kanban
          </button>
        </div>
      </div>

      {showForm && (
        <div className="mb-5">
          <DistributorForm onDone={() => setShowForm(false)} />
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
        {BOLGE_FILTRELERI.map((b) => (
          <button
            key={b}
            onClick={() => setBolgeFiltre(b)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm transition ${
              bolgeFiltre === b
                ? "bg-brand-400 text-white"
                : "border border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {b === "hepsi" ? "Tümü" : BOLGE_LABEL[b]}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
        {PROFIL_FILTRELERI.filter((p) => p === "hepsi" || profilSayilari[p] > 0).map((p) => (
          <button
            key={p}
            onClick={() => setProfilFiltre(p)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm transition ${
              profilFiltre === p
                ? "bg-gray-800 text-white"
                : "border border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {p === "hepsi" ? "Tüm profiller" : `${PROFIL_LABEL[p]} (${profilSayilari[p]})`}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-gray-500">Yükleniyor…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
          <p className="text-sm text-gray-500">
            {items.length === 0
              ? "Henüz kayıt yok. İlk satış fırsatını ekleyin."
              : "Bu bölgede kayıt yok."}
          </p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        gorunum === "kanban" ? (
          <KanbanPano items={filtered} />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filtered.map((item) => (
              <DistributorCard key={item.id} item={item} />
            ))}
          </div>
        )
      )}
    </main>
  );
}
