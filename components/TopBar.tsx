"use client";

import { useState } from "react";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import KurSeridi from "@/components/KurSeridi";
import KartvizitlerModal from "@/components/KartvizitlerModal";

export default function TopBar() {
  const { user } = useAuth();
  const router = useRouter();
  const [onayBekliyor, setOnayBekliyor] = useState(false);
  const [kartvizitAcik, setKartvizitAcik] = useState(false);

  async function handleSignOut() {
    await signOut(auth);
    router.replace("/giris");
  }

  function handleToggleClick() {
    if (onayBekliyor) {
      handleSignOut();
    } else {
      setOnayBekliyor(true);
    }
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
              className="rounded-lg border border-gray-300 p-1.5 text-gray-600 transition hover:bg-gray-50"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
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

            {/* Elektronik cihaz tarzı on/off anahtarı */}
            <div className="flex items-center gap-1.5">
              {onayBekliyor && (
                <span className="text-xs text-gray-500">tekrar dokunun</span>
              )}
              <button
                onClick={handleToggleClick}
                onBlur={() => setOnayBekliyor(false)}
                aria-label={onayBekliyor ? "Çıkışı onayla" : "Oturumu kapat"}
                className="relative flex h-9 w-16 shrink-0 items-center rounded-md border border-gray-300 bg-gray-800 px-1 shadow-inner"
              >
                {/* I / O simgeleri */}
                <span className="pointer-events-none absolute left-2 text-[10px] font-bold text-gray-400">I</span>
                <span className="pointer-events-none absolute right-2 text-[10px] font-bold text-gray-400">O</span>

                {/* Kayan anahtar gövdesi + LED */}
                <span
                  className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-sm border border-gray-400 bg-gradient-to-b from-gray-100 to-gray-300 shadow transition-transform duration-150 ${
                    onayBekliyor ? "translate-x-0" : "translate-x-[26px]"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      onayBekliyor ? "bg-red-500 shadow-[0_0_4px_1px_rgba(239,68,68,0.7)]" : "bg-green-500 shadow-[0_0_4px_1px_rgba(34,197,94,0.7)]"
                    }`}
                  />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <KurSeridi />

      {kartvizitAcik && <KartvizitlerModal onKapat={() => setKartvizitAcik(false)} />}
    </header>
  );
}
