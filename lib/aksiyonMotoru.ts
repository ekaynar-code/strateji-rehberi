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
  hedefSekme: string; // yönlendirilecek sekme yolu
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

/**
 * Farklı modüllerin verisini okuyup basit, açıklanabilir kurallarla bir
 * öncelik listesi üretir. Bu bir yapay zeka yorumlaması değil — her öneri,
 * belirli bir eşik veya koşula dayanır ve açıklamasında bu koşul görünür.
 */
export function aksiyonlariHesapla(girdi: AksiyonMotoruGirdisi): AksiyonOnerisi[] {
  const oneriler: AksiyonOnerisi[] = [];

  // Kural 1 — uzun süredir yanıt bekleyen fırsatlar (7+ gün)
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

  // Kural 2 — süresi geçmiş görevler
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

  // Kural 3 — yaklaşan fuar + o bölgede aktif fırsat yok
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
      if (fuarBolgesi && !aktifBolgeler.has(fuarBolgesi)) {
        oneriler.push({
          id: `fuar-firsat-${f.id}`,
          seviye: "onemli",
          baslik: `${f.ad} yaklaşıyor ama ${BOLGE_LABEL[fuarBolgesi]}'de aktif görüşme yok`,
          aciklama: "Bu fuar öncesinde bölgede hiç aktif satış fırsatı bulunmuyor — fuar öncesi hedef firma belirlemek görüşme kalitesini artırır.",
          hedefSekme: "/panel/fuarlar",
        });
      }
    });

  // Kural 4 — güncel ihale/gelişme + o bölgede fırsat var
  girdi.onemliHaberler.slice(0, 5).forEach((h, i) => {
    const musavirlikUlkesi = h.musavirlik.replace(" Ticaret Müşavirliği", "");
    const eslesenBolgeVarMi = girdi.distributorler.some(
      (d) =>
        musavirlikUlkesi &&
        (d.ulke.toLowerCase().includes(musavirlikUlkesi.toLowerCase()) ||
          musavirlikUlkesi.toLowerCase().includes(d.ulke.toLowerCase().split(" ")[0].toLowerCase()))
    );
    if (eslesenBolgeVarMi) {
      oneriler.push({
        id: `haber-${i}`,
        seviye: "bilgi",
        baslik: h.title,
        aciklama: `${h.musavirlik} bülteninden — mevcut satış fırsatlarınızla ilişkili olabilir.`,
        hedefSekme: "/panel/piyasa-nabzi",
      });
    }
  });

  // Kural 5 — hedefin gerisinde kalma (yılın geçen oranına göre)
  if (girdi.hedef) {
    const yilBasi = new Date(girdi.hedef.yil, 0, 1).getTime();
    const yilSonu = new Date(girdi.hedef.yil, 11, 31).getTime();
    const simdi = Date.now();
    const yilYuzdesi = Math.max(0, Math.min(1, (simdi - yilBasi) / (yilSonu - yilBasi)));
    const ciroYuzdesi = girdi.gerceklesenCiroTry / girdi.hedef.hedefTry;

    if (yilYuzdesi > 0.25 && ciroYuzdesi < yilYuzdesi - 0.15) {
      oneriler.push({
        id: "hedef-geride",
        seviye: "onemli",
        baslik: `${girdi.hedef.yil} ciro hedefinin gerisinde kalınıyor`,
        aciklama: `Yılın %${Math.round(yilYuzdesi * 100)}'i geçti ama hedefin sadece %${Math.round(ciroYuzdesi * 100)}'i gerçekleşti. Bekleyen fırsatları hızlandırmak gerekebilir.`,
        hedefSekme: "/panel",
      });
    }
  }

  // Önce seviyeye göre sırala (acil > önemli > bilgi)
  return oneriler.sort((a, b) => SEVIYE_SIRASI[a.seviye] - SEVIYE_SIRASI[b.seviye]);
}

function fuarBolgesindenDistributorBolgesi(fuarBolge: string): Bolge | null {
  if (fuarBolge === "korfez" || fuarBolge === "balkanlar" || fuarBolge === "afrika") return fuarBolge;
  if (fuarBolge === "yurt_ici") return "turkiye";
  return null;
}
