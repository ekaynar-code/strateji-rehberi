"use client";

import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";

export default function TopBar() {
  const { user } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut(auth);
    router.replace("/giris");
  }

  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div>
          <div className="text-xs font-medium tracking-wide text-stone-500 uppercase">
            strateji rehberi
          </div>
          <div className="text-base font-medium text-stone-900">
            satış ve ihracat paneli
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user?.email && (
            <span className="hidden text-sm text-stone-500 sm:inline">{user.email}</span>
          )}
          <button
            onClick={handleSignOut}
            className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-700 transition hover:bg-stone-50"
          >
            Çıkış yap
          </button>
        </div>
      </div>
    </header>
  );
}
