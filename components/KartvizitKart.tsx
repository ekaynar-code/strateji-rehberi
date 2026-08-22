"use client";

import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { type Kartvizit, vCardOlustur, kartvizitSil } from "@/lib/kartvizitler";

export default function KartvizitKart({ item }: { item: Kartvizit }) {
  const [qrAcik, setQrAcik] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!qrAcik || !canvasRef.current) return;
    const vcard = vCardOlustur(item);
    QRCode.toCanvas(canvasRef.current, vcard, { width: 220, margin: 1 }).catch(() => {});
  }, [qrAcik, item]);

  async function handleDelete() {
    setBusy(true);
    try {
      await kartvizitSil(item.id);
    } finally {
      setBusy(false);
    }
  }

  async function handlePaylas() {
    const vcard = vCardOlustur(item);
    if (navigator.share) {
      try {
        await navigator.share({ title: item.adSoyad, text: vcard });
        return;
      } catch {
        // kullanıcı paylaşımı iptal etti veya desteklenmiyor, aşağıdaki kopyalamaya düş
      }
    }
    try {
      await navigator.clipboard.writeText(vcard);
      alert("Kartvizit bilgisi panoya kopyalandı.");
    } catch {
      // sessizce geç
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium text-gray-900">{item.adSoyad}</div>
          {(item.unvan || item.sirket) && (
            <div className="mt-0.5 text-sm text-gray-500">
              {item.unvan}
              {item.unvan && item.sirket ? " · " : ""}
              {item.sirket}
            </div>
          )}
          {item.telefon && <div className="mt-1 text-sm text-gray-600">{item.telefon}</div>}
          {item.eposta && <div className="text-sm text-gray-600">{item.eposta}</div>}
          {item.web && <div className="text-sm text-gray-600">{item.web}</div>}
        </div>
      </div>

      {qrAcik && (
        <div className="mt-3 flex flex-col items-center gap-2 rounded-lg bg-gray-50 p-3">
          <canvas ref={canvasRef} />
          <p className="text-xs text-gray-400">Telefon kamerasıyla okutup kişi olarak ekleyebilirsiniz.</p>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => setQrAcik((q) => !q)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            {qrAcik ? "QR'ı gizle" : "QR göster"}
          </button>
          <button
            onClick={handlePaylas}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            Paylaş
          </button>
        </div>

        {confirmDelete ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Silinsin mi?</span>
            <button onClick={handleDelete} disabled={busy} className="font-medium text-red-600 hover:underline">
              Evet
            </button>
            <button onClick={() => setConfirmDelete(false)} className="text-gray-500 hover:underline">
              Vazgeç
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(true)} className="text-xs text-gray-400 hover:text-red-600">
            Sil
          </button>
        )}
      </div>
    </div>
  );
}
