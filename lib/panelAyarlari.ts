import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

export interface PanelAyarlari {
  hareketsizlikSuresiDakika: number; // 5 dakika varsayılan
  tema: "acik" | "koyu";
}

const VARSAYILAN_AYARLAR: PanelAyarlari = {
  hareketsizlikSuresiDakika: 5,
  tema: "acik",
};

const COLLECTION = "ayarlar";
const DOC_ID = "genel";

function belgeYolu() {
  return doc(db, COLLECTION, DOC_ID);
}

export function subscribePanelAyarlari(
  callback: (ayarlar: PanelAyarlari) => void,
  onError: (err: Error) => void
) {
  return onSnapshot(
    belgeYolu(),
    (snap) => {
      if (!snap.exists()) {
        callback(VARSAYILAN_AYARLAR);
        return;
      }
      const data = snap.data();
      callback({
        hareketsizlikSuresiDakika: data.hareketsizlikSuresiDakika ?? VARSAYILAN_AYARLAR.hareketsizlikSuresiDakika,
        tema: data.tema ?? VARSAYILAN_AYARLAR.tema,
      });
    },
    (err) => onError(err as Error)
  );
}

export async function panelAyarlariKaydet(ayarlar: Partial<PanelAyarlari>) {
  await setDoc(belgeYolu(), ayarlar, { merge: true });
}

export async function panelAyarlariGetir(): Promise<PanelAyarlari> {
  const snap = await getDoc(belgeYolu());
  if (!snap.exists()) return VARSAYILAN_AYARLAR;
  const data = snap.data();
  return {
    hareketsizlikSuresiDakika: data.hareketsizlikSuresiDakika ?? VARSAYILAN_AYARLAR.hareketsizlikSuresiDakika,
    tema: data.tema ?? VARSAYILAN_AYARLAR.tema,
  };
}
