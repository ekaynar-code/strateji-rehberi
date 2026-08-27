import os
import json
from datetime import datetime

import functions_framework
from flask import Request

try:
    import borsapy as bp
except ImportError:
    bp = None


def _cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
    }


def _hata_yaniti(mesaj, kod=500):
    return (json.dumps({"error": mesaj}), kod, {**_cors_headers(), "Content-Type": "application/json"})


def _guvenli(fn, varsayilan=None):
    try:
        return fn()
    except Exception as e:
        return {"hata": str(e)} if varsayilan is None else varsayilan
def _tcmb_verileri():
    sonuc = {}

    def faiz():
        tcmb = bp.TCMB()
        return {
            "politika_faizi": tcmb.policy_rate,
            "gecelik": tcmb.overnight,
        }
    sonuc["faiz"] = _guvenli(faiz)

    def bist():
        xu100 = bp.Index("XU100")
        info = xu100.info
        return {
            "deger": info.get("last") or info.get("close"),
            "degisim_yuzde": info.get("change_percent"),
        }
    sonuc["bist100"] = _guvenli(bist)

    def enflasyon():
        enf = bp.Inflation()
        latest = enf.latest()
        return latest if isinstance(latest, dict) else {"veri": str(latest)}
def _fon_gozlemi():
    try:
        hisse_fonlari = bp.screen_funds(min_return_1m=0)
        if hisse_fonlari is None or len(hisse_fonlari) == 0:
            return {"gozlem": "Fon verisi su anda alinamadi."}

        ortalama_getiri = None
        try:
            ortalama_getiri = float(hisse_fonlari["return_1m"].mean())
        except Exception:
            pass

        return {
            "taranan_fon_sayisi": int(len(hisse_fonlari)),
            "ortalama_1ay_getiri_yuzde": ortalama_getiri,
        }
    except Exception as e:
        return {"hata": str(e)}


def _objektif_yorum(veri):
    yorumlar = []

    faiz = veri.get("tcmb", {}).get("faiz", {})
    if isinstance(faiz, dict) and faiz.get("politika_faizi") is not None:
        yorumlar.append(
            "TCMB politika faizi %" + str(faiz["politika_faizi"]) + ". "
            "Yuksek faiz genellikle TL varliklari gorece cazip kilar."
        )

    bist = veri.get("tcmb", {}).get("bist100", {})
    if isinstance(bist, dict) and bist.get("degisim_yuzde") is not None:
        yon = "yukseldi" if bist["degisim_yuzde"] > 0 else "geriledi"
        yorumlar.append("BIST 100 endeksi bugun %" + str(abs(bist["degisim_yuzde"])) + " " + yon + ".")

    yorumlar.append(
        "Not: Bu bolum objektif piyasa verisi ve genel ekonomik iliskileri "
        "ozetler; kisiye ozel yatirim tavsiyesi niteligi tasimaz."
    )

    return yorumlar


@functions_framework.http
def apiEkonomi(request: Request):
    if request.method == "OPTIONS":
        return ("", 204, _cors_headers())

    api_key = os.environ.get("EKONOMI_API_KEY")
    if not api_key or request.args.get("key") != api_key:
        return _hata_yaniti("Gecersiz API key", 401)

    if bp is None:
        return _hata_yaniti("borsapy kutuphanesi yuklenemedi", 500)

    evds_key = os.environ.get("EVDS_API_KEY")
    if evds_key:
        bp.set_evds_key(evds_key)

    veri = {
        "tcmb": _tcmb_verileri(),
        "fon_gozlemi": _fon_gozlemi(),
        "guncelleme": datetime.utcnow().isoformat() + "Z",
    }
    veri["yorumlar"] = _objektif_yorum(veri)

    return (json.dumps(veri, default=str), 200, {**_cors_headers(), "Content-Type": "application/json"})