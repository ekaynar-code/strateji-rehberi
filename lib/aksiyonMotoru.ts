import type { Distributor } from "./distributors";
import type { Fuar } from "./fuarlar";
import type { Todo } from "./todos";
import type { MusavirlikYazisi } from "./haberler";
import type { Hedef } from "./hedefler";
import { kalanGun } from "./fuarlar";
import { todoKalanGun } from "./todos";
import { BOLGE_LABEL, type Bolge } from "./distributors";

export type OncelikSeviyesi = "acil" | "onemli" | "bilgi";

export interface AksiyonOnerisi {
  id: string;
  seviye: OncelikSeviyesi;
  baslik: string;
  aciklama: string;
  hedefSekme: string;
}

const SEVIYE_SIRASI: Record<OncelikSeviyesi, number> = { acil: 0, onemli: 1, bilgi: 2 };

interface AksiyonMotoruGirdisi {
  distributorler: Distributor[];
  fuarlar: Fuar[];
  todos: Todo[];
  onemliHaberler: MusavirlikYazisi[];
  hedef: Hedef | null;
  gerceklesenCiroTry: number;
}

export function aksiyonlariHesapla(girdi: AksiyonMotoruGirdisi): AksiyonOnerisi[] {
  const oneriler: AksiyonOnerisi[] = [];

  girdi.distributorler
    .filter((d) => d.durum === "yanit_bekleniyor")
    .forEach((d) => {
      const gunSayisi = d.updatedAt
        ? Math.floor((Date.now() - d.updatedAt.toMillis()) / (1000 * 60 * 60 * 24))
        : 0;
      if (gunSayisi >= 7) {
        oneriler.push({
          id: `bekleyen-${d.id}`,
          seviye: gunSayisi >= 14 ? "acil" : "onemli",
          baslik: `${d.firmaAdi} — ${gunSayisi} gündür yanıt bekliyor`,
          aciklama: `${BOLGE_LABEL[d.bolge]} bölgesindeki bu görüşme ${gunSayisi} gündür yanıt bekleniyor durumunda. Takip etmenin zamanı gelmiş olabilir.`,
          hedefSekme: "/panel/distributorler",
        });
      }
    });

  girdi.todos
    .filter((t) => !t.tamamlandi && t.sonTarih && todoKalanGun(t.sonTarih) < 0)
    .forEach((t) => {
      const gecenGun = Math.abs(todoKalanGun(t.sonTarih!));
      oneriler.push({
        id: `gorev-${t.id}`,
        seviye: "acil",
        baslik: `"${t.baslik}" görevi ${gecenGun} gün gecikti`,
        aciklama: "Bu görevin son tarihi geçti ve hâlâ tamamlanmadı işaretlenmemiş.",
        hedefSekme: "/panel/yapilacaklar",
      });
    });

  const aktifBolgeler = new Set(
    girdi.distributorler
      .filter((d) => ["temas_edildi", "yanit_bekleniyor", "gorusme_planlandi"].includes(d.durum))
      .map((d) => d.bolge)
  );
  girdi.fuarlar
    .filter((f) => {
      const gun = kalanGun(f.tarih);
      return gun >= 0 && gun <= 60 && f.durum !== "tamamlandi" && f.durum !== "katilinmayacak";
    })
    .forEach((f) => {
      const fuarBolgesi = fuarBolgesindenDistributorBolgesi(f.bolge);
      if (fuarBolgesi