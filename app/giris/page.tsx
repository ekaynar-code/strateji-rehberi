"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";

export default function GirisPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/panel");
  }, [user, loading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("E-posta ve şifre alanlarını doldurun.");
      return;
    }

    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace("/panel");
    } catch {
      setError("Giriş başarısız. E-posta veya şifre hatalı olabilir.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="text-xs font-medium tracking-wide text-stone-500 uppercase">
            strateji rehberi
          </div>
          <h1 className="mt-1 text-xl font-medium text-stone-900">
            satış ve ihracat paneli
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-4">
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-stone-700"
            >
              E-posta
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ad.soyad@firma.com"
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-500"
              autoComplete="email"
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-stone-700"
            >
              Şifre
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-500"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="mb-4 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-60"
          >
            {submitting ? "Giriş yapılıyor…" : "Giriş yap"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-stone-500">
          Hesabınız yoksa yöneticinizden Firebase Authentication üzerinden
          bir kullanıcı oluşturmasını isteyin.
        </p>
      </div>
    </div>
  );
}
