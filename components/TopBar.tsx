"use client";

import { useState } from "react";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import KurSeridi from "@/components/KurSeridi";

export default function TopBar() {
  const { user } = useAuth();
  const router = useRouter();
  const [onayBekliyor, setOnayBekliyor] = useState(false);

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
            {onayBekliyor && (
              <span className="text-xs text-gray-500">Çıkış için tekrar dokunun</span>
            )}
            <button
              onClick={handleToggleClick}
              onBlur={() => setOnayBekliyor(false)}
              aria-label={onayBekliyor ? "Çıkışı onayla" : "Oturumu kapat"}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                onayBekliyor ? "bg-red-400" : "bg-green-500"
              }`}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                  onayBekliyor ? "translate-x-0.5" : "translate-x-5"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
      <KurSeridi />
    </header>
  );
}
