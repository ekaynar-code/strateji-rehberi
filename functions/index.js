const { onRequest } = require("firebase-functions/v2/https");
const https = require("https");

function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        },
        (res) => {
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            fetchHtml(res.headers.location).then(resolve).catch(reject);
            return;
          }
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => resolve(data));
        }
      )
      .on("error", reject);
  });
}

function decodeHtmlEntities(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

/**
 * T.C. Ticaret Bakanlığı Ticaret Müşavirlikleri blog sayfasını (dtybs.ticaret.gov.tr)
 * HTML olarak ayrıştırır.
 */
function parseBlogPosts(html) {
  const posts = [];
  // Gerçek yapı: <a href="/blog/post/ID/"><h3 class="h4">Başlık...</h3></a>
  // Link ile başlık arasında img'li bir <a> bloğu daha var (görsel), o yüzden
  // doğrudan "href sonrası <h3" kalıbını arıyoruz.
  const postRegex = /href="(\/blog\/post\/(\d+)\/)">\s*<h3[^>]*>([\s\S]*?)<\/h3>/g;

  const gorulenIdler = new Set();
  let match;
  while ((match = postRegex.exec(html)) !== null) {
    const [, path, id, rawTitle] = match;
    if (gorulenIdler.has(id)) continue;
    gorulenIdler.add(id);

    const title = decodeHtmlEntities(rawTitle.replace(/<[^>]+>/g, "").trim());
    if (!title) continue;

    // Başlıktan önceki pencerede (görsel bloğu dahil) müşavirlik adı
    // genelde img alt metninde geçiyor.
    const oncekiPencere = html.slice(Math.max(0, match.index - 400), match.index);
    const musavirlikMatch = oncekiPencere.match(/alt="([^"]*Ticaret\s+Müşavirliği)"/);

    // Tarih, başlıktan sonra bir saat ikonunun yanında geçiyor — geniş bir
    // pencerede arayıp ilk "GG Ay YYYY SS:DD" kalıbını alıyoruz.
    const sonrakiPencere = html.slice(match.index, match.index + 1200);
    const tarihMatch = sonrakiPencere.match(/(\d{1,2}\s+[A-Za-zİıÖöÜüÇçŞşĞğ]{3}\s+\d{4}\s+\d{2}:\d{2})/);

    posts.push({
      title,
      link: `https://dtybs.ticaret.gov.tr${path}`,
      musavirlik: musavirlikMatch ? musavirlikMatch[1] : "",
      tarih: tarihMatch ? tarihMatch[1] : "",
      sektorleIlgili: sektorleIlgiliMi(title),
    });
  }

  return posts;
}

// Ticaret Müşavirlikleri, bulundukları ülkenin başkenti/büyük şehri adıyla
// anılıyor (örn. "Sofya Ticaret Müşavirliği" = Bulgaristan). Kullanıcı ülke
// adı girdiğinde bu haritayı kullanarak şehir bazlı müşavirlik adlarını
// doğru ülkeyle eşleştiriyoruz.
const SEHIR_ULKE_ESLEME = {
  Sofya: "Bulgaristan",
  Bükreş: "Romanya",
  Belgrad: "Sırbistan",
  Kahire: "Mısır",
  Rabat: "Fas",
  Kazablanka: "Fas",
  Lagos: "Nijerya",
  Abuja: "Nijerya",
  Riyad: "Suudi Arabistan",
  Cidde: "Suudi Arabistan",
  Dubai: "Birleşik Arap Emirlikleri",
  "Abu Dabi": "Birleşik Arap Emirlikleri",
  Kigali: "Ruanda",
  Zagrep: "Hırvatistan",
  Kito: "Ekvador",
  Nairobi: "Kenya",
  Cezayir: "Cezayir",
  Tunus: "Tunus",
  Trablus: "Libya",
  Amman: "Ürdün",
  Beyrut: "Lübnan",
  Kuveyt: "Kuveyt",
  Doha: "Katar",
  Manama: "Bahreyn",
  Maskat: "Umman",
};

function musavirlikUlkesi(musavirlikAdi) {
  const sehir = musavirlikAdi.replace(" Ticaret Müşavirliği", "").trim();
  return SEHIR_ULKE_ESLEME[sehir] || sehir;
}

// Sektörle (ahşap iç kapı, yangın kapısı, doğrama, otel/okul/işyeri projeleri)
// ilgili anahtar kelimeler — başlıkta geçtiğinde yazı "sektörle ilgili" sayılır.
const SEKTOR_ANAHTAR_KELIMELERI = [
  // Ürün / malzeme
  "kapı", "kapılar", "doğrama", "ahşap", "yangın", "cam", "cephe",
  "pencere", "mobilya", "mdf", "kereste", "panel",
  // Proje tipi
  "otel", "okul", "hastane", "konut", "villa", "rezidans", "ofis",
  "alışveriş merkezi", "avm",
  // İnşaat / sektör genel
  "inşaat", "yapı", "yüklenici", "müteahhit", "restorasyon", "renovasyon",
  "tadilat", "dekorasyon", "iç mimari",
  // Mevzuat / süreç
  "yönetmelik", "standart", "sertifika", "ihale", "teklif", "fuar",
  "ithalat", "ihracat", "gümrük",
];

function sektorleIlgiliMi(title) {
  const lower = title.toLowerCase();
  return SEKTOR_ANAHTAR_KELIMELERI.some((k) => lower.includes(k));
}

const KATEGORILER = { ihaleler: 41, guncel: 1 };

/**
 * HTTP endpoint: ?ulkeler=Bulgaristan,Romanya&kategori=ihaleler (veya guncel)
 * ile çağrılır. Ticaret Bakanlığı Ticaret Müşavirlikleri blog'undan ilgili
 * kategorideki son yazıları çekip, başlıkta/müşavirlik adında geçen ülke adına
 * göre filtreler.
 */
exports.musavirlikBultenGetir = onRequest(
  { cors: true, region: "europe-west1", timeoutSeconds: 40 },
  async (req, res) => {
    const kategoriParam = String(req.query.kategori || "ihaleler");
    const kategoriId = KATEGORILER[kategoriParam] || KATEGORILER.ihaleler;
    const ulkelerParam = String(req.query.ulkeler || "");
    const ulkeler = ulkelerParam
      .split(",")
      .map((u) => u.trim())
      .filter(Boolean);

    try {
      // Sitede sayfalama var (?page=2, 3, ...) — sadece ilk sayfa çok az yazı
      // döndürdüğü için ilk 6 sayfayı paralel çekip birleştiriyoruz.
      const SAYFA_SAYISI = 6;
      const sayfaUrlleri = Array.from({ length: SAYFA_SAYISI }, (_, i) => {
        const sayfaNo = i + 1;
        const base = `https://dtybs.ticaret.gov.tr/blog/?kategori=${kategoriId}`;
        return sayfaNo === 1 ? base : `${base}&page=${sayfaNo}`;
      });

      const htmlSayfalari = await Promise.all(sayfaUrlleri.map((u) => fetchHtml(u).catch(() => "")));
      const tumPosts = [];
      const gorulenLinkler = new Set();
      for (const html of htmlSayfalari) {
        if (!html) continue;
        for (const post of parseBlogPosts(html)) {
          if (gorulenLinkler.has(post.link)) continue;
          gorulenLinkler.add(post.link);
          tumPosts.push(post);
        }
      }
      const debugTotalParsed = tumPosts.length;

      let posts = tumPosts;
      if (ulkeler.length > 0) {
        posts = posts.filter((p) => {
          const ulke = musavirlikUlkesi(p.musavirlik);
          return ulkeler.some(
            (u) =>
              ulke.toLowerCase().includes(u.toLowerCase()) ||
              u.toLowerCase().includes(ulke.toLowerCase()) ||
              p.title.toLowerCase().includes(u.toLowerCase())
          );
        });
      }

      res.status(200).json({ items: posts.slice(0, 20), debugTotalParsed });
    } catch (err) {
      res.status(500).json({ error: "Bülten alınamadı", detail: String(err) });
    }
  }
);

// ---------------------------------------------------------------------------
// Ekonomi Analizi — TCMB EVDS2 REST servisinden güncel ekonomik göstergeleri
// çeker. Kişisel/eğitim amaçlı kullanım içindir. Belirli fon/hisse önermez,
// sadece objektif piyasa verisi ve genel ekonomik ilişkileri özetler.
// ---------------------------------------------------------------------------

function fetchJsonWithKey(url, apiKey, redirectSayisi = 0) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            key: apiKey,
            Accept: "application/json",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        },
        (res) => {
          // TCMB EVDS bazen yönlendirme (302) döner — bunu takip ediyoruz.
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            if (redirectSayisi >= 5) {
              resolve({ statusCode: res.statusCode, body: null, raw: `Çok fazla yönlendirme, son hedef: ${res.headers.location}` });
              return;
            }
            fetchJsonWithKey(res.headers.location, apiKey, redirectSayisi + 1).then(resolve).catch(reject);
            return;
          }
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            try {
              resolve({ statusCode: res.statusCode, body: JSON.parse(data), finalUrl: url });
            } catch (e) {
              resolve({ statusCode: res.statusCode, body: null, raw: data, finalUrl: url });
            }
          });
        }
      )
      .on("error", reject);
  });
}

function bugunTarihiEvdsFormati(gunOncesi = 0) {
  const d = new Date();
  d.setDate(d.getDate() - gunOncesi);
  const gg = String(d.getDate()).padStart(2, "0");
  const aa = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${gg}-${aa}-${yyyy}`;
}

/**
 * Bir EVDS serisinin son geçerli (null olmayan) gözlemini bulur — hafta
 * sonu/tatil günlerinde veri boş gelebildiği için son 10 günü tarayıp ilk
 * dolu değeri döner.
 */
function sonGecerliDeger(items, alanAdi) {
  if (!Array.isArray(items)) return null;
  for (let i = items.length - 1; i >= 0; i--) {
    let deger = items[i][alanAdi];
    // Formül uygulanmış seriler bazen farklı bir alan adıyla dönebiliyor —
    // tam eşleşme yoksa, "Tarih"/"UNIXTIME" dışındaki ilk sayısal alanı kullan.
    if (deger === null || deger === undefined || deger === "") {
      const digerAlan = Object.entries(items[i]).find(
        ([k, v]) => k !== "Tarih" && k !== "UNIXTIME" && v !== null && v !== undefined && v !== ""
      );
      deger = digerAlan ? digerAlan[1] : undefined;
    }
    if (deger !== null && deger !== undefined && deger !== "") {
      return { tarih: items[i].Tarih, deger: parseFloat(deger) };
    }
  }
  return null;
}

async function evdsSeriGetir(apiKey, seriKodu, alanAdi, gunOncesi = 40, ekstraParam = "") {
  const baslangic = bugunTarihiEvdsFormati(gunOncesi);
  const bitis = bugunTarihiEvdsFormati(0);
  const url = `https://evds3.tcmb.gov.tr/igmevdsms-dis/series=${encodeURIComponent(
    seriKodu
  )}&startDate=${baslangic}&endDate=${bitis}&type=json${ekstraParam}`;

  const { statusCode, body, raw, finalUrl } = await fetchJsonWithKey(url, apiKey);
  if (statusCode !== 200 || !body || !Array.isArray(body.items)) {
    return {
      hata: `EVDS isteği başarısız (${statusCode})`,
      detay: raw ? String(raw).slice(0, 200) : undefined,
      finalUrl,
      istekUrl: url,
    };
  }
  const sonuc = sonGecerliDeger(body.items, alanAdi);
  if (!sonuc) return { hata: "Bu dönemde veri bulunamadı" };
  return sonuc;
}

function objektifYorumUret(veri) {
  const yorumlar = [];

  const faiz = veri.politikaFaizi;
  if (faiz && faiz.deger !== undefined) {
    yorumlar.push(
      `TCMB ağırlıklı ortalama fonlama maliyeti yaklaşık %${faiz.deger.toFixed(
        2
      )}. Yüksek faiz genellikle TL varlıkları görece cazip kılar ve ithalat maliyetlerini düşürücü yönde etki yapabilir; ihracat gelirlerinizin TL karşılığını ise baskılayabilir.`
    );
  }

  const usd = veri.usdTry;
  const eur = veri.eurTry;
  if (usd && eur && usd.deger && eur.deger) {
    yorumlar.push(
      `USD/TRY ${usd.deger.toFixed(2)}, EUR/TRY ${eur.deger.toFixed(
        2
      )} seviyesinde. Kurlardaki değişim, döviz bazlı satışlarınızın TL karşılığını doğrudan etkiler.`
    );
  }

  const enflasyon = veri.enflasyonYillik;
  if (enflasyon && enflasyon.deger !== undefined) {
    yorumlar.push(
      `Yıllık TÜFE artışı yaklaşık %${enflasyon.deger.toFixed(
        1
      )}. Yüksek enflasyon, girdi/hammadde maliyetlerinizi ve fiyatlandırma stratejinizi doğrudan etkileyen bir faktördür.`
    );
  }

  const disTicaret = veri.disTicaretDengesi;
  if (disTicaret && disTicaret.deger !== undefined) {
    const yon = disTicaret.deger < 0 ? "açık" : "fazla";
    yorumlar.push(
      `Dış ticaret dengesi ${yon} veriyor (yaklaşık ${Math.abs(disTicaret.deger).toLocaleString(
        "tr-TR"
      )} milyon USD). Bu, genel ihracat/ithalat trendinin yönü hakkında bir gösterge sunar.`
    );
  }

  yorumlar.push(
    "Not: Bu bölüm objektif piyasa verisi ve genel ekonomik ilişkileri özetler; kişiye özel yatırım tavsiyesi niteliği taşımaz."
  );

  return yorumlar;
}

/**
 * HTTP endpoint: ?key=API_ANAHTARINIZ ile çağrılır. TCMB EVDS'den güncel
 * politika faizi, USD/TRY, EUR/TRY, yıllık enflasyon ve dış ticaret dengesini
 * çekip, objektif ekonomik yorumlarla birlikte döner.
 */
exports.apiEkonomi = onRequest(
  { cors: true, region: "europe-west1", timeoutSeconds: 30, secrets: ["EKONOMI_API_KEY", "EVDS_API_KEY"] },
  async (req, res) => {
    const apiKey = process.env.EKONOMI_API_KEY;
    if (!apiKey || req.query.key !== apiKey) {
      res.status(401).json({ error: "Geçersiz API key" });
      return;
    }

    const evdsKey = process.env.EVDS_API_KEY;
    if (!evdsKey) {
      res.status(500).json({ error: "EVDS_API_KEY tanımlı değil" });
      return;
    }

    try {
      const [politikaFaizi, usdTry, eurTry, enflasyonYillik, disTicaretDengesi] = await Promise.all([
        evdsSeriGetir(evdsKey, "TP.APIFON4", "TP_APIFON4"),
        evdsSeriGetir(evdsKey, "TP.DK.USD.A.YTL", "TP_DK_USD_A_YTL"),
        evdsSeriGetir(evdsKey, "TP.DK.EUR.A.YTL", "TP_DK_EUR_A_YTL"),
        // TÜFE genel endeks — yıllık yüzde değişim formülüyle (formulas=3) direkt
        // "yıllık enflasyon %" değeri isteniyor, ham endeks puanı değil.
        evdsSeriGetir(evdsKey, "TP.FG.J0", "TP_FG_J0", 60, "&formulas=3&frequency=5"),
        // Dış ticaret dengesi aylık ve gecikmeli yayınlanır — daha geniş pencere.
        evdsSeriGetir(evdsKey, "TP.DTP", "TP_DTP", 90),
      ]);

      const veri = {
        politikaFaizi,
        usdTry,
        eurTry,
        enflasyonYillik,
        disTicaretDengesi,
        guncelleme: new Date().toISOString(),
      };
      veri.yorumlar = objektifYorumUret(veri);

      res.status(200).json(veri);
    } catch (err) {
      res.status(500).json({ error: "Ekonomi verileri alınamadı", detail: String(err) });
    }
  }
);
