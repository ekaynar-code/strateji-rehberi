"use client";

import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import KurSeridi from "@/components/KurSeridi";

export default function TopBar() {
  const { user } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut(auth);
    router.replace("/giris");
  }

  return (
    <header className="sticky top-0 z-10 bg-white">
      <div className="border-b border-gray-200">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div>
            <div className="text-xs font-medium tracking-wide text-gray-500 uppercase">
              strateji rehberi
            </div>
            <div className="text-base font-medium text-gray-900">
              satış ve ihracat paneli
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user?.email && (
              <span className="hidden text-sm text-gray-500 sm:inline">{user.email}</span>
            )}
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
    </header>
  );
}
