"use client";

import { useEffect, useState, useMemo } from "react";
import RequireAuth from "@/components/RequireAuth";
import TopBar from "@/components/TopBar";
import PanelTabs from "@/components/PanelTabs";
import { useAuth } from "@/lib/AuthContext";
import { subscribeTodos, addTodo, toggleTodo, deleteTodo, todoKalanGun, type Todo } from "@/lib/todos";

export default function YapilacaklarPage() {
  return (
    <RequireAuth>
      <TopBar />
      <PanelTabs />
      <YapilacaklarContent />
    </RequireAuth>
  );
}

function formatTarih(tarih: string): string {
  const d = new Date(tarih + "T00:00:00");
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

function YapilacaklarContent() {
  const { user } = useAuth();
  const [items, setItems] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [yeniBaslik, setYeniBaslik] = useState("");
  const [yeniSonTarih, setYeniSonTarih] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeTodos(
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

  const bekleyenler = useMemo(() => items.filter((t) => !t.tamamlandi), [items]);
  const tamamlananlar = useMemo(() => items.filter((t) => t.tamamlandi), [items]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!yeniBaslik.trim()) return;
    setSubmitting(true);
    try {
      await addTodo(yeniBaslik.trim(), user?.email || undefined, yeniSonTarih || undefined);
      setYeniBaslik("");
      setYeniSonTarih("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5 sm:py-6">
      <div className="mb-5">
        <h1 className="text-lg font-medium text-gray-900">Yapılacaklar</h1>
        <p className="text-sm text-gray-500">
          {bekleyenler.length} bekleyen · {tamamlananlar.length} tamamlandı
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mb-6 flex flex-col gap-2 sm:flex-row">
        <input
          value={yeniBaslik}
          onChange={(e) => setYeniBaslik(e.target.value)}
          placeholder="Yeni görev ekle…"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 sm:text-sm"
        />
        <input
          type="date"
          value={yeniSonTarih}
          onChange={(e) => setYeniSonTarih(e.target.value)}
          aria-label="Son tarih (opsiyonel)"
          className="shrink-0 rounded-lg border border-gray-300 px-3 py-2.5 text-base text-gray-700 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 sm:text-sm"
        />
        <button
          type="submit"
          disabled={submitting || !yeniBaslik.trim()}
          className="shrink-0 rounded-lg bg-brand-400 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-500 disabled:opacity-50 sm:py-2"
        >
          Ekle
        </button>
      </form>

      {loading && <p className="text-sm text-gray-500">Yükleniyor…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
          <p className="text-sm text-gray-500">Henüz görev yok. Yukarıdan ilk görevi ekleyin.</p>
        </div>
      )}

      {bekleyenler.length > 0 && (
        <div className="mb-6 flex flex-col gap-2">
          {bekleyenler.map((t) => (
            <TodoRow key={t.id} item={t} />
          ))}
        </div>
      )}

      {tamamlananlar.length > 0 && (
        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
            Tamamlananlar
          </div>
          <div className="flex flex-col gap-2">
            {tamamlananlar.map((t) => (
              <TodoRow key={t.id} item={t} />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

function TodoRow({ item }: { item: Todo }) {
  const [busy, setBusy] = useState(false);

  async function handleToggle() {
    setBusy(true);
    try {
      await toggleTodo(item.id, !item.tamamlandi);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await deleteTodo(item.id);
    } finally {
      setBusy(false);
    }
  }

  const gun = item.sonTarih ? todoKalanGun(item.sonTarih) : null;
  const gecmis = gun !== null && gun < 0 && !item.tamamlandi;
  const yaklasiyor = gun !== null && gun >= 0 && gun <= 7 && !item.tamamlandi;

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border p-3 ${
        item.tamamlandi ? "border-gray-100 bg-gray-50" : "border-gray-200 bg-white"
      }`}
    >
      <button
        onClick={handleToggle}
        disabled={busy}
        aria-label={item.tamamlandi ? "Tamamlanmadı olarak işaretle" : "Tamamlandı olarak işaretle"}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition ${
          item.tamamlandi
            ? "border-brand-400 bg-brand-400 text-white"
            : "border-gray-300 hover:border-brand-400"
        }`}
      >
        {item.tamamlandi && (
          <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
            <path d="M3 8.5L6.5 12L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <span className={`text-sm ${item.tamamlandi ? "text-gray-400 line-through" : "text-gray-900"}`}>
          {item.baslik}
        </span>
        {item.sonTarih && (
          <span
            className={`ml-2 text-xs ${
              gecmis ? "font-medium text-red-600" : yaklasiyor ? "font-medium text-brand-500" : "text-gray-400"
            }`}
          >
            {formatTarih(item.sonTarih)}
            {gecmis && " · süresi geçti"}
          </span>
        )}
      </div>

      <button
        onClick={handleDelete}
        disabled={busy}
        className="shrink-0 text-xs text-gray-300 hover:text-red-600"
      >
        Sil
      </button>
    </div>
  );
}
