import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { manuelCiroEkle } from "./manuelCiro";
import type { UretimOzet } from "./uretimApi";
import type { Hedef } from "./hedefler";

/**
 * Bir tarihin (YYYY-MM-DD), verilen hedef döneminin (başlangıç-bitiş) içinde
 * olup olmadığını kontrol eder.
 */
function tarihDonemIcindeMi(tarih: string, hedef: Hedef): boolean {
  return tarih >= hedef.baslangic && tarih <= hedef.bitis;
}

/**
 * uretimfinal API'sinden gelen aktif sipariş listesini kontrol eder. Daha
 * önce manuel ciro kaydına eklenmemiş (kaynakSiparisNo ile işaretlenmemiş)
 * ve aktif hedef döneminin içine düşen yeni siparişleri otomatik olarak
 * ekler.
 *
 * Para birimi: API artık her sipariş için para_birimi alanını (TRY/USD/EUR)
 * döndürüyor, bu yüzden kayıt doğru para biriminde ekleniyor.
 */
export async function yeniSiparisleriCiroyaEkle(
  ozet: UretimOzet,
  hedef: Hedef | null
): Promise<{ eklenen: number; atlananTutarsiz: number }> {
  if (!hedef) return { eklenen: 0, atlananTutarsiz: 0 };

  // API şu an sipariş bazlı liste döndürmüyorsa (sadece özet sayılar
  // geliyorsa), otomatik ekleme yapacak bir şey yok — sessizce çık.
  const liste = ozet.siparisler?.liste;
  if (!liste || liste.length === 0) {
    return { eklenen: 0, atlananTutarsiz: 0 };
  }

  // Daha önce hangi sipariş no'larının eklendiğini kontrol etmek için
  // manuel_ciro koleksiyonundaki tüm kayıtları çekip client tarafında
  // filtreliyoruz — böylece ekstra bir Firestore composite index gerekmiyor.
  const snap = await getDocs(collection(db, "manuel_ciro"));
  const eklenmisSiparisNolar = new Set(
    snap.docs
      .map((d) => d.data().kaynakSiparisNo as string | undefined)
      .filter((s): s is string => !!s)
  );

  let eklenen = 0;
  let atlananTutarsiz = 0;

  for (const siparis of liste) {
    if (eklenmisSiparisNolar.has(siparis.siparis_no)) continue;

    if (siparis.teslim && siparis.teslim !== "-" && !tarihDonemIcindeMi(siparis.teslim, hedef)) {
      continue;
    }

    const siparisTutari = siparis.tutar;
    if (typeof siparisTutari !== "number" || siparisTutari <= 0) {
      atlananTutarsiz++;
      continue;
    }

    // Para birimi API'den gelmiyorsa güvenli tarafta kalıp TRY varsayıyoruz,
    // ama normalde her siparişte bu alan dolu gelmeli.
    const paraBirimi = siparis.para_birimi || "TRY";

    const bugun = new Date().toISOString().slice(0, 10);
    await manuelCiroEkle(
      siparisTutari,
      paraBirimi,
      `Sipariş: ${siparis.musteri}`,
      siparis.teslim && siparis.teslim !== "-" ? siparis.teslim : bugun,
      siparis.siparis_no
    );
    eklenen++;
  }

  return { eklenen, atlananTutarsiz };
}
