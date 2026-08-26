"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { subscribePanelAyarlari } from "@/lib/panelAyarlari";

export default function SecurityGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  const sonAktiviteRef = useRef(Date.now());
  const [hareketsizlikSuresiMs, setHareketsizlikSuresiMs] = useState(5 * 60 * 1000);

  useEffect(() => {
    const unsub = subscribePanelAyarlari(
      (ayarlar) => {
        setHareketsizlikSuresiMs(ayarlar.hareketsizlikSuresiDakika * 60 * 1000);
        document.documentElement.classList.toggle("dark", ayarlar.tema === "koyu");
      },
      () => {}
    );
    return () => unsub();
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut(auth);
    router.replace("/giris");
  }, [router]);

  // --- Hareketsizlik takibi: ayarlarda belirlenen süre kadar etkileşim yoksa otomatik çıkış ---
  useEffect(() => {
    if (!user) return;

    function aktiviteYenile() {
      sonAktiviteRef.current = Date.now();
    }

    const olaylar = ["mousedown", "keydown", "touchstart", "scroll"];
    olaylar.forEach((e) => window.addEventListener(e, aktiviteYenile));

    const interval = setInterval(() => {
      if (Date.now() - sonAktiviteRef.current > hareketsizlikSuresiMs) {
        handleSignOut();
      }
    }, 15000);

    return () => {
      olaylar.forEach((e) => window.removeEventListener(e, aktiviteYenile));
      clearInterval(interval);
    };
  }, [user, handleSignOut, hareketsizlikSuresiMs]);

  return <>{children}</>;
}
