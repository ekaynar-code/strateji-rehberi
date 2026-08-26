"use client";

import { useEffect, useState } from "react";

export default function BaglantiDurumu() {
  const [cevrimici, setCevrimici] = useState(true);
  const [oncedenCevrimdisiydi, setOncedenCevrimdisiydi] = useState(false);
  const [tekrarBagalandiMesaji, setTekrarBaglandiMesaji] = useState(false);

  useEffect(() => {
    setCevrimici(navigator.onLine);

    function handleOnline() {
      setCevrimici(true);
      if (oncedenCevrimdisiydi) {
        setTekrarBaglandiMesaji(true);
        setTimeout(() => setTekrarBaglandiMesaji(false), 4000);
      }
      setOncedenCevrimdisiydi(false);
    }

    function handleOffline() {
      setCevrimici(false);
      setOncedenCevrimdisiydi(true);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oncedenCevrimdisiydi]);

  if (!cevrimici) {
    return (
      <div className="border-b border-gray-300 bg-gray-100 px-4 py-2 text-center text-xs text-gray-700">
        İnternet bağlantısı yok — yaptığınız değişiklikler kaydedilecek ve bağlantı geri gelince otomatik gönderilecek.
      </div>
    );
  }

  if (tekrarBagalandiMesaji) {
    return (
      <div className="border-b border-brand-200 bg-brand-50 px-4 py-2 text-center text-xs text-brand-600">
        Bağlantı geri geldi — bekleyen değişiklikler gönderiliyor.
      </div>
    );
  }

  return null;
}
