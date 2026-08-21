"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? "/panel" : "/giris");
  }, [user, loading, router]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-sm text-stone-500">Yükleniyor…</p>
    </div>
  );
}
