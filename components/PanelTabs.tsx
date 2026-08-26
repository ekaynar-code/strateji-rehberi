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
        d="M12 8a4 4 0 100 8 4 4 0 000-8z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.55 1.55M6.85 17.15L5.3 18.7M18.7 18.7l-1.55-1.55M6.85 6.85L5.3 5.3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
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
