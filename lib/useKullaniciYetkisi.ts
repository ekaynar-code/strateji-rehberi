"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { subscribeKullaniciYetkisi, type KullaniciYetkisi } from "./kullaniciYetkileri";

export function useKullaniciYetkisi(): KullaniciYetkisi | null {
  const { user } = useAuth();
  const [yetki, setYetki] = useState<KullaniciYetkisi | null>(null);

  useEffect(() => {
    if (!user?.email) {
      setYetki(null);
      return;
    }
    const unsub = subscribeKullaniciYetkisi(
      user.email,
      (y) => setYetki(y),
      () => setYetki(null)
    );
    return () => unsub();
  }, [user?.email]);

  return yetki;
}
