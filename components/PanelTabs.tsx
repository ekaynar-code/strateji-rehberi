"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SEKMELER = [
  { href: "/panel", label: "Genel Bakış" },
  { href: "/panel/distributorler", label: "Satış Fırsatları" },
  { href: "/panel/fuarlar", label: "Fuarlar" },
  { href: "/panel/piyasa-nabzi", label: "Piyasa Nabzı" },
  { href: "/panel/yapilacaklar", label: "Yapılacaklar" },
];

const AYARLAR_HREF = "/panel/ayarlar";

function DisliIkonu({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 15a3 3 0 100-6 3 3 0 000 6z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M19.4 13a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V19a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H4a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H10a1.65 1.65 0 001-1.51V4a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V10a1.65 1.65 0 001.51 1H20a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function PanelTabs() {
  const pathname = usePathname();
  const [mobilAcik, setMobilAcik] = useState(false);

  const ayarlarAktif = pathname === AYARLAR_HREF;

  return (
    <nav className="border-b border-gray-200 bg-white">
      {/* Masaüstü: yatay sekmeler + dişli ikonu */}
      <div className="mx-auto hidden max-w-5xl items-center justify-between px-4 sm:flex">
        <div className="flex gap-1 overflow-x-auto">
          {SEKMELER.map((s) => {
            const active = pathname === s.href;
            return (
              <Link
                key={s.href}
                href={s.href}
                className={`shrink-0 border-b-2 px-3 py-3 text-sm font-medium transition ${
                  active
                    ? "border-brand-400 text-brand-500"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {s.label}
              </Link>
            );
          })}
        </div>
        <Link
          href={AYARLAR_HREF}
          aria-label="Ayarlar"
          title="Ayarlar"
          className={`shrink-0 border-b-2 px-3 py-3 transition ${
            ayarlarAktif
              ? "border-brand-400 text-brand-500"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          <DisliIkonu className="h-5 w-5" />
        </Link>
      </div>

      {/* Mobil: açılır/kapanır menü */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between px-4 py-2.5">
          <button
            onClick={() => setMobilAcik((a) => !a)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
              <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            {SEKMELER.find((s) => s.href === pathname)?.label ||
              (ayarlarAktif ? "Ayarlar" : "Menü")}
          </button>
          <Link
            href={AYARLAR_HREF}
            aria-label="Ayarlar"
            className={`shrink-0 p-1 ${ayarlarAktif ? "text-brand-500" : "text-gray-400"}`}
          >
            <DisliIkonu className="h-5 w-5" />
          </Link>
        </div>

        {mobilAcik && (
          <div className="flex flex-col border-t border-gray-100 pb-1">
            {SEKMELER.map((s) => {
              const active = pathname === s.href;
              return (
                <Link
                  key={s.href}
                  href={s.href}
                  onClick={() => setMobilAcik(false)}
                  className={`px-4 py-2.5 text-sm font-medium transition ${
                    active ? "bg-brand-50 text-brand-500" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {s.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
