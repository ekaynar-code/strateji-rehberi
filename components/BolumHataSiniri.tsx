"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  bolumAdi: string;
}

interface State {
  hataVar: boolean;
}

/**
 * Genel Bakış'taki her bölümü (Personel Durumu, Sipariş/Üretim, Arıza/
 * Sorunlar, Ekonomi Analizi, Aksiyon Motoru vb.) birbirinden izole eder.
 * Bir bölümün render sırasında beklenmedik bir hata fırlatması (örn. API
 * yanıtı beklenenden farklı bir yapıda geldiğinde oluşan TypeError), React'te
 * normal try/catch ile yakalanamayan bir durumdur — bu hata yakalanmazsa
 * tüm sayfa beyaz ekrana düşer. Bu bileşen, hatayı kendi sınırında durdurup
 * sadece ilgili bölümde küçük bir uyarı gösterir, diğer bölümler etkilenmez.
 */
export default class BolumHataSiniri extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hataVar: false };
  }

  static getDerivedStateFromError() {
    return { hataVar: true };
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error(`[${this.props.bolumAdi}] bölümünde hata:`, error);
  }

  render() {
    if (this.state.hataVar) {
      return (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-3 text-xs text-gray-400">
          {this.props.bolumAdi} şu anda yüklenemedi.
        </div>
      );
    }
    return this.props.children;
  }
}
