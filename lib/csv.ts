/**
 * Basit CSV ayrıştırıcı — virgülle ayrılmış, çift tırnak içinde virgül/yeni satır
 * destekler. Excel/Google Sheets'ten dışa aktarılan standart CSV'ler için yeterli.
 */
export function csvAyristir(metin: string): string[][] {
  const satirlar: string[][] = [];
  let satir: string[] = [];
  let alan = "";
  let tirnakIcinde = false;

  for (let i = 0; i < metin.length; i++) {
    const c = metin[i];
    const sonraki = metin[i + 1];

    if (tirnakIcinde) {
      if (c === '"' && sonraki === '"') {
        alan += '"';
        i++;
      } else if (c === '"') {
        tirnakIcinde = false;
      } else {
        alan += c;
      }
    } else {
      if (c === '"') {
        tirnakIcinde = true;
      } else if (c === ",") {
        satir.push(alan);
        alan = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && sonraki === "\n") i++;
        satir.push(alan);
        satirlar.push(satir);
        satir = [];
        alan = "";
      } else {
        alan += c;
      }
    }
  }
  if (alan.length > 0 || satir.length > 0) {
    satir.push(alan);
    satirlar.push(satir);
  }
  return satirlar.filter((s) => s.some((f) => f.trim() !== ""));
}

export interface CsvSatirSonucu {
  satirNo: number;
  ad: string;
  basarili: boolean;
  hata?: string;
}
