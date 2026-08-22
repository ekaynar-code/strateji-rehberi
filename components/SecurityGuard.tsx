"use client";

import { useEffect, useCallback, useRef } from "react";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";

const HAREKETSIZLIK_SURESI_MS = 5 * 60 * 1000; // 5 dakika

export default function SecurityGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  const sonAktiviteRef = useRef(Date.now());

  const handleSignOut = useCallback(async () => {
    await signOut(auth);
    router.replace("/giris");
  }, [router]);

  // --- Hareketsizlik takibi: 5 dakika etkileşim yoksa otomatik çıkış ---
  useEffect(() => {
    if (!user) return;

    function aktiviteYenile() {
      sonAktiviteRef.current = Date.now();
    }

    const olaylar = ["mousedown", "keydown", "touchstart", "scroll"];
    olaylar.forEach((e) => window.addEventListener(e, aktiviteYenile));

    const interval = setInterval(() => {
      if (Date.now() - sonAktiviteRef.current > HAREKETSIZLIK_SURESI_MS) {
        handleSignOut();
      }
    }, 15000);

    return () => {
      olaylar.forEach((e) => window.removeEventListener(e, aktiviteYenile));
      clearInterval(interval);
    };
  }, [user, handleSignOut]);

  return <>{children}</>;
}
