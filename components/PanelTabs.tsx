"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SEKMELER = [
  { href: "/panel", label: "Genel Bakış" },
  { href: "/panel/distributorler", label: "Satış Fırsatları" },
  { href: "/panel/fuarlar", label: "Fuarlar" },
  { href: "/panel/piyasa-nabzi", label: "Piyasa Nabzı" },
  { href: "/panel/yapilacaklar", label: "Yapılacaklar" },
  { href: "/panel/kartvizitler", label: "Kartvizitler" },
];

export default function PanelTabs() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4">
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
    </nav>
  );
}
