import { auth } from "./firebase";

/**
 * Giriş yapmış kullanıcının e-postasının @ öncesi kısmını döner.
 * Örn. "yonetim@pimetri.com" -> "yonetim". Giriş yoksa "bilinmiyor" döner.
 */
export function mevcutKullaniciAdi(): string {
  const email = auth.currentUser?.email;
  if (!email) return "bilinmiyor";
  return email.split("@")[0];
}

export function mevcutKullaniciEposta(): string | null {
  return auth.currentUser?.email || null;
}

/** yonetim@pimetri.com kullanıcısının tüm-log görme yetkisi var. */
export function tumLoglariGorebilirMi(): boolean {
  return mevcutKullaniciEposta() === "yonetim@pimetri.com";
}
