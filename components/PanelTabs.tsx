"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SEKMELER = [
  { href: "/panel", label: "Distribütörler" },
  { href: "/panel/fuarlar", label: "Fuarlar" },
];

export default function PanelTabs() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4">
        {SEKMELER.map((s) => {
          const active = pathname === s.href;
          return (
            <Link
              key={s.href}
              href={s.href}
              className={`shrink-0 border-b-2 px-3 py-3 text-sm font-medium transition ${
                active
                  ? "border-stone-900 text-stone-900"
                  : "border-transparent text-stone-500 hover:text-stone-700"
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
