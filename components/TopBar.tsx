"use client";

import { useState } from "react";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import KurSeridi from "@/components/KurSeridi";
import KartvizitlerModal from "@/components/KartvizitlerModal";
import BaglantiDurumu from "@/components/BaglantiDurumu";

export default function TopBar() {
  const { user } = useAuth();
  const router = useRouter();
  const [kartvizitAcik, setKartvizitAcik] = useState(false);

  async function handleSignOut() {
    await signOut(auth);
    router.replace("/giris");
  }

  return (
    <header className="sticky top-0 z-10 bg-white">
      <div className="border-b border-gray-200">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
              <span className="text-lg font-bold text-brand-400">Pi</span>
            </div>
            <div>
              <div className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                strateji rehberi
              </div>
              <div className="text-base font-medium text-gray-900">
                iyi analiz-doğru karar
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user?.email && (
              <span className="hidden text-sm text-gray-500 sm:inline">{user.email}</span>
            )}

            {/* Kartvizit / QR ikonu */}
            <button
              onClick={() => setKartvizitAcik(true)}
              aria-label="Kartvizitler"
              title="Kartvizitler"
              className="rounded-lg border border-gray-300 p-2 text-gray-600 transition hover:bg-gray-50"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
                <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.6" />
                <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.6" />
                <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.6" />
                <rect x="5" y="5" width="3" height="3" fill="currentColor" />
                <rect x="16" y="5" width="3" height="3" fill="currentColor" />
                <rect x="5" y="16" width="3" height="3" fill="currentColor" />
                <rect x="14" y="14" width="3" height="3" fill="currentColor" />
                <rect x="18" y="14" width="3" height="3" fill="currentColor" />
                <rect x="14" y="18" width="3" height="3" fill="currentColor" />
                <rect x="18" y="18" width="3" height="3" fill="currentColor" />
              </svg>
            </button>

            <button
              onClick={handleSignOut}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50"
            >
              Çıkış yap
            </button>
          </div>
        </div>
      </div>
      <KurSeridi />
      <BaglantiDurumu />

      {kartvizitAcik && <KartvizitlerModal onKapat={() => setKartvizitAcik(false)} />}
    </header>
  );
}
