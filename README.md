# Strateji Rehberi — kurulum rehberi

Bu, ilk modülü (distribütör/tedarikçi ortağı takibi) çalışan bir web
uygulaması olarak içeren proje. Aşağıdaki adımları sırayla takip edin.

## 1. Firebase projesinden bilgileri alın

1. https://console.firebase.google.com adresine gidin, açtığınız yeni
   projeyi seçin.
2. Sol üstteki dişli ikonuna tıklayın → **Project settings**.
3. **General** sekmesinde aşağı kaydırın, **Your apps** bölümünde
   **Web** simgesine (`</>`) tıklayarak yeni bir web app kaydedin
   (isim önemli değil, örn. "panel").
4. Karşınıza çıkan `firebaseConfig` nesnesindeki değerleri not edin —
   bir sonraki adımda kullanacaksınız.

## 2. Authentication'ı etkinleştirin

1. Sol menüden **Build > Authentication** açın.
2. **Get started** butonuna tıklayın.
3. **Sign-in method** sekmesinde **Email/Password** sağlayıcısını
   etkinleştirin.
4. **Users** sekmesinden **Add user** ile kendinize (ve ihtiyaç
   duyduğunuz diğer yetkililere) bir e-posta/şifre girişi oluşturun.
   Bu panel şimdilik açık kayıt (sign-up) içermiyor — kullanıcılar
   sadece buradan elle eklenir.

## 3. Firestore veritabanını etkinleştirin

1. Sol menüden **Build > Firestore Database** açın.
2. **Create database** ile veritabanını oluşturun (üretim modu / production
   mode seçin, konum olarak `eur3` veya size yakın bir Avrupa bölgesi
   uygundur).

## 4. Proje dosyalarını hazırlayın

Bu klasörü bilgisayarınıza indirip bir terminalde içine girin, sonra:

```bash
npm install
```

`.env.local.example` dosyasını `.env.local` olarak kopyalayın ve
1. adımda not ettiğiniz Firebase değerlerini içine yapıştırın:

```bash
cp .env.local.example .env.local
```

`.env.local` dosyasını bir editörle açıp değerleri doldurun:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

`.firebaserc.example` dosyasını `.firebaserc` olarak kopyalayıp içindeki
`BURAYA_FIREBASE_PROJE_ID_YAZIN` yazan yeri gerçek proje ID'nizle
değiştirin (proje ID'sini Firebase Console'un ana sayfasında, proje
adının hemen altında görebilirsiniz):

```bash
cp .firebaserc.example .firebaserc
```

## 5. Yerelde deneyin (opsiyonel ama tavsiye edilir)

```bash
npm run dev
```

Tarayıcıda `http://localhost:3000` adresini açın. Firebase Console'da
2. adımda oluşturduğunuz e-posta/şifre ile giriş yapabilmelisiniz.
Giriş sonrası "+ Yeni kayıt" ile bir distribütör ekleyip listede
göründüğünü doğrulayın — bu, Firestore bağlantısının çalıştığını
gösterir.

## 6. Firestore güvenlik kurallarını yükleyin

Bu adım önemli — kurallar yüklenmeden veri okunamaz/yazılamaz:

```bash
firebase deploy --only firestore:rules
```

(Daha önce başka bir projede `firebase login` yaptıysanız tekrar
gerekmez; gerekirse `firebase login` ile giriş yapın.)

## 7. Hosting'e deploy edin

```bash
firebase deploy --only hosting
```

Komut bittiğinde terminalde size bir `https://PROJE_ID.web.app` adresi
verecek — bu, panelin canlı adresi. Bu adresi yetkili kişilerle
paylaşabilirsiniz; her biri kendi Firebase Authentication kullanıcı
bilgisiyle giriş yapar.

## Sonraki adımlar

Bu ilk sürümde sadece **distribütör/tedarikçi ortağı takibi** modülü
var. Bir sonraki modül (fuar ve etkinlik takibi) için bana haber
verin, aynı yapıda ekleyelim.
