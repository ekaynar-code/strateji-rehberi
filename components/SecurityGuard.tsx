"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { pinBelirlenmisMi, pinKaydet, pinDogrula } from "@/lib/kullaniciPin";

const HAREKETSIZLIK_SURESI_MS = 5 * 60 * 1000; // 5 dakika

export default function SecurityGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  const [kilitli, setKilitli] = useState(false);
  const [pinKurulumGerekli, setPinKurulumGerekli] = useState(false);
  const [pinKontrolEdildi, setPinKontrolEdildi] = useState(false);

  const sonAktiviteRef = useRef(Date.now());
  const kilitliRef = useRef(false);

  useEffect(() => {
    kilitliRef.current = kilitli;
  }, [kilitli]);

  // Kullanıcı giriş yaptığında PIN'i olup olmadığını kontrol et.
  useEffect(() => {
    if (!user) {
      setPinKontrolEdildi(false);
      return;
    }
    pinBelirlenmisMi(user.uid)
      .then((varMi) => {
        setPinKurulumGerekli(!varMi);
        setPinKontrolEdildi(true);
      })
      .catch(() => setPinKontrolEdildi(true));
  }, [user]);

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

  // --- Sekme gizlenince bulanıklaştır, geri gelince kilitle ---
  useEffect(() => {
    if (!user) return;

    function handleVisibility() {
      if (document.hidden) {
        kilitliRef.current = true;
      } else if (kilitliRef.current) {
        setKilitli(true);
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [user]);

  if (!user) return <>{children}</>;

  return (
    <>
      {children}

      <style jsx global>{`
        body.sr-blur-active {
          filter: blur(12px);
          pointer-events: none;
          user-select: none;
        }
      `}</style>
      <BulaniklastirmaTetikleyici />

      {kilitli && pinKontrolEdildi && (
        <KilitEkrani
          uid={user.uid}
          pinKurulumGerekli={pinKurulumGerekli}
          onAcildi={() => setKilitli(false)}
          onPinKuruldu={() => setPinKurulumGerekli(false)}
          onCikisYap={handleSignOut}
        />
      )}
    </>
  );
}

function BulaniklastirmaTetikleyici() {
  useEffect(() => {
    function handleVisibility() {
      document.body.classList.toggle("sr-blur-active", document.hidden);
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      document.body.classList.remove("sr-blur-active");
    };
  }, []);
  return null;
}

function KilitEkrani({
  uid,
  pinKurulumGerekli,
  onAcildi,
  onPinKuruldu,
  onCikisYap,
}: {
  uid: string;
  pinKurulumGerekli: boolean;
  onAcildi: () => void;
  onPinKuruldu: () => void;
  onCikisYap: () => void;
}) {
  const [pin, setPin] = useState("");
  const [pinTekrar, setPinTekrar] = useState("");
  const [hata, setHata] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.body.classList.remove("sr-blur-active");
  }, []);

  async function handleKurulum(e: React.FormEvent) {
    e.preventDefault();
    setHata("");
    if (pin.length < 4) {
      setHata("PIN en az 4 haneli olmalı.");
      return;
    }
    if (pin !== pinTekrar) {
      setHata("PIN'ler eşleşmiyor.");
      return;
    }
    setBusy(true);
    try {
      await pinKaydet(uid, pin);
      onPinKuruldu();
      onAcildi();
    } catch {
      setHata("PIN kaydedilemedi, tekrar deneyin.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDogrulama(e: React.FormEvent) {
    e.preventDefault();
    setHata("");
    setBusy(true);
    try {
      const dogruMu = await pinDogrula(uid, pin);
      if (dogruMu) {
        onAcildi();
      } else {
        setHata("PIN hatalı.");
        setPin("");
      }
    } catch {
      setHata("Doğrulama başarısız, tekrar deneyin.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/95 p-4">
      <div className="w-full max-w-xs rounded-xl bg-white p-6 text-center shadow-xl">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
          <span className="text-xl font-bold text-brand-400">Pi</span>
        </div>

        {pinKurulumGerekli ? (
          <>
            <h2 className="mb-1 text-base font-medium text-gray-900">Kilit PIN&apos;i oluşturun</h2>
            <p className="mb-4 text-xs text-gray-500">
              Ekran gizlendikten sonra tekrar açmak için kullanılacak, size özel bir PIN belirleyin.
            </p>
            <form onSubmit={handleKurulum} className="flex flex-col gap-2">
              <input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Yeni PIN (4-6 hane)"
                className="rounded-lg border border-gray-300 px-3 py-2 text-center text-lg tracking-widest outline-none focus:border-brand-400"
                autoFocus
              />
              <input
                type="password"
                inputMode="numeric"
                value={pinTekrar}
                onChange={(e) => setPinTekrar(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="PIN tekrar"
                className="rounded-lg border border-gray-300 px-3 py-2 text-center text-lg tracking-widest outline-none focus:border-brand-400"
              />
              {hata && <p className="text-xs text-red-600">{hata}</p>}
              <button
                type="submit"
                disabled={busy}
                className="mt-1 rounded-lg bg-brand-400 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-60"
              >
                {busy ? "Kaydediliyor…" : "PIN'i oluştur"}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="mb-1 text-base font-medium text-gray-900">Kilitli</h2>
            <p className="mb-4 text-xs text-gray-500">Devam etmek için PIN&apos;inizi girin.</p>
            <form onSubmit={handleDogrulama} className="flex flex-col gap-2">
              <input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="PIN"
                className="rounded-lg border border-gray-300 px-3 py-2 text-center text-lg tracking-widest outline-none focus:border-brand-400"
                autoFocus
              />
              {hata && <p className="text-xs text-red-600">{hata}</p>}
              <button
                type="submit"
                disabled={busy || pin.length < 4}
                className="mt-1 rounded-lg bg-brand-400 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-60"
              >
                {busy ? "Kontrol ediliyor…" : "Kilidi aç"}
              </button>
            </form>
            <button onClick={onCikisYap} className="mt-3 text-xs text-gray-400 hover:text-red-600">
              PIN&apos;i unuttum, oturumu kapat
            </button>
          </>
        )}
      </div>
    </div>
  );
}
