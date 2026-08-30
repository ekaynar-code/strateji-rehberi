"use client";

import { useAuth } from "@/lib/AuthContext";
import { useKullaniciYetkisi } from "@/lib/useKullaniciYetkisi";
import { moduleErisimiVarMi, MODUL_LABEL, type ModulAdi } from "@/lib/kullaniciYetkileri";

export default function ModulErisimKorumasi({
  modul,
  children,
}: {
  modul: ModulAdi;
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const yetki = useKullaniciYetkisi();

  if (loading) return null;

  const erisimVar = moduleErisimiVarMi(yetki, modul, user?.email);

  if (!erisimVar) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
          <p className="text-sm text-gray-500">
            <strong>{MODUL_LABEL[modul]}</strong> bölümüne erişim yetkiniz yok.
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Erişim için yönetici hesabıyla iletişime geçin.
          </p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
