import type { Distributor, Durum } from "./distributors";

export type MesajDili = "tr" | "en";
export type MesajTipi = "ilk_temas" | "takip" | "sertifika" | "gorusme_teyit";

const MESAJ_TIPI_LABEL: Record<MesajTipi, { tr: string; en: string }> = {
  ilk_temas: { tr: "İlk temas", en: "First contact" },
  takip: { tr: "Takip mesajı", en: "Follow-up" },
  sertifika: { tr: "Sertifika paylaşımı", en: "Certification info" },
  gorusme_teyit: { tr: "Görüşme teyidi", en: "Meeting confirmation" },
};

// Bir kayıt için hangi mesaj tiplerinin mantıklı olduğunu, durumuna göre belirler.
export function uygunMesajTipleri(durum: Durum): MesajTipi[] {
  switch (durum) {
    case "arastirmada":
      return ["ilk_temas"];
    case "temas_edildi":
      return ["takip", "sertifika"];
    case "yanit_bekleniyor":
      return ["takip", "sertifika"];
    case "gorusme_planlandi":
      return ["gorusme_teyit", "sertifika"];
    default:
      return ["ilk_temas", "takip", "sertifika", "gorusme_teyit"];
  }
}

export function mesajTipiEtiketi(tip: MesajTipi, dil: MesajDili): string {
  return MESAJ_TIPI_LABEL[tip][dil];
}

interface SirketBilgisi {
  yetkiliAdi?: string; // gönderen tarafın adı, opsiyonel
}

interface SablonGirdi {
  alici: string;
  firma: string;
  ulke: string;
  segment?: string;
  sirket: SirketBilgisi;
}

function selamlamaTr(alici: string): string {
  return alici ? `Sayın ${alici},` : "Merhaba,";
}

function selamlamaEn(alici: string): string {
  return alici ? `Dear ${alici},` : "Hello,";
}

function mesajTr(tip: MesajTipi, g: SablonGirdi): { konu: string; govde: string } {
  const { alici, firma, ulke } = g;
  const imza = g.sirket.yetkiliAdi ? `\n\nSaygılarımla,\n${g.sirket.yetkiliAdi}` : "\n\nSaygılarımla,";

  if (tip === "ilk_temas") {
    return {
      konu: `İşbirliği Fırsatı — Ahşap İç Kapı ve Yangın Kapısı Üretimi`,
      govde:
        `${selamlamaTr(alici)}\n\n` +
        `${firma} ile ${ulke} pazarında olası bir tedarikçi/distribütör iş birliği için sizinle temasa geçmek istedik.\n\n` +
        `Firmamız Afyon'da üretim tesisi, İstanbul'da showroom'u bulunan bir ahşap iç kapı üreticisidir. Standart iç oda kapılarının yanı sıra, test edilmiş ve sertifikalandırılmış yangına dayanımlı kapı modellerimiz de mevcuttur — otel, okul ve kurumsal projeler için uygundur.\n\n` +
        `Ürün kataloğumuzu ve sertifika bilgilerimizi paylaşmaktan memnuniyet duyarız. Kısa bir görüşme için uygun olduğunuz bir zaman var mı?` +
        imza,
    };
  }
  if (tip === "takip") {
    return {
      konu: `Takip — ${firma} İş Birliği Görüşmesi`,
      govde:
        `${selamlamaTr(alici)}\n\n` +
        `Daha önce ilettiğimiz iş birliği önerimizle ilgili görüşünüzü almak isteriz. Ürünlerimiz ve sertifikalarımızla ilgili ek bilgiye ihtiyacınız olursa memnuniyetle paylaşırız.\n\n` +
        `Görüşmemizi devam ettirmek için uygun olduğunuz bir zaman varsa lütfen bildirin.` +
        imza,
    };
  }
  if (tip === "sertifika") {
    return {
      konu: `Yangına Dayanımlı Kapı Sertifikalarımız Hakkında Bilgi`,
      govde:
        `${selamlamaTr(alici)}\n\n` +
        `Yangına dayanımlı iç kapı ürünlerimiz bağımsız test kuruluşları tarafından test edilmiş ve sertifikalandırılmıştır. ${ulke} pazarındaki proje gereksinimlerinize uygun sertifika belgelerini sizinle paylaşmak isteriz.\n\n` +
        `İlgili sertifika dosyalarını iletebilmemiz için hangi standarda (örn. EN, UL, yerel yönetmelik) göre belge gerektiğini bildirirseniz, size en uygun dokümantasyonu hazırlarız.` +
        imza,
    };
  }
  return {
    konu: `Görüşme Teyidi — ${firma}`,
    govde:
      `${selamlamaTr(alici)}\n\n` +
      `Planladığımız görüşmeyi teyit etmek isteriz. Görüşmede ürün gamımızı, sertifikalarımızı ve olası iş birliği modelini detaylandırmayı planlıyoruz.\n\n` +
      `Görüşme saati/platformu ile ilgili bir değişiklik olursa lütfen bize bildirin.` +
      imza,
  };
}

function mesajEn(tip: MesajTipi, g: SablonGirdi): { konu: string; govde: string } {
  const { alici, firma, ulke } = g;
  const imza = g.sirket.yetkiliAdi ? `\n\nBest regards,\n${g.sirket.yetkiliAdi}` : "\n\nBest regards,";

  if (tip === "ilk_temas") {
    return {
      konu: `Partnership Opportunity — Wooden Interior & Fire-Rated Doors`,
      govde:
        `${selamlamaEn(alici)}\n\n` +
        `We are reaching out to explore a potential supplier/distributor partnership with ${firma} in the ${ulke} market.\n\n` +
        `Our company manufactures wooden interior doors at our production facility in Afyon, Turkey, with a showroom in Istanbul. In addition to standard interior doors, we offer tested and certified fire-rated door models suitable for hotel, school, and institutional projects.\n\n` +
        `We would be happy to share our product catalog and certification details. Would you be available for a brief call to discuss further?` +
        imza,
    };
  }
  if (tip === "takip") {
    return {
      konu: `Follow-up — Partnership Discussion with ${firma}`,
      govde:
        `${selamlamaEn(alici)}\n\n` +
        `We would like to follow up on our previous partnership proposal. If you need any additional information about our products or certifications, we would be glad to provide it.\n\n` +
        `Please let us know a convenient time to continue our discussion.` +
        imza,
    };
  }
  if (tip === "sertifika") {
    return {
      konu: `Fire-Rated Door Certification Information`,
      govde:
        `${selamlamaEn(alici)}\n\n` +
        `Our fire-rated interior door products have been tested and certified by independent testing bodies. We would like to share the relevant certification documents suited to your project requirements in the ${ulke} market.\n\n` +
        `If you could let us know which standard (e.g. EN, UL, or local regulation) applies to your project, we will prepare the most relevant documentation for you.` +
        imza,
    };
  }
  return {
    konu: `Meeting Confirmation — ${firma}`,
    govde:
      `${selamlamaEn(alici)}\n\n` +
      `We would like to confirm our upcoming meeting. We plan to walk through our product range, certifications, and a potential partnership model.\n\n` +
      `Please let us know if there are any changes to the meeting time or platform.` +
      imza,
  };
}

/**
 * Bir Satış Fırsatı kaydına ve seçilen mesaj tipine göre dinamik olarak
 * doldurulmuş bir taslak mesaj/e-posta metni üretir. Şablonlar sabit ama
 * içindeki firma adı, ülke, ürün segmenti gibi alanlar kayıttan otomatik
 * çekiliyor.
 */
export function mesajOlustur(
  kayit: Distributor,
  tip: MesajTipi,
  dil: MesajDili,
  sirket: SirketBilgisi
): { konu: string; govde: string } {
  const alici = kayit.iletisimKisisi?.trim() || "";
  const firma = kayit.firmaAdi;
  const ulke = kayit.ulke;
  const segment = kayit.urunSegmenti?.trim();

  const girdi: SablonGirdi = { alici, firma, ulke, segment, sirket };
  return dil === "tr" ? mesajTr(tip, girdi) : mesajEn(tip, girdi);
}
