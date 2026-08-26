import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

// Bu bilgileri Firebase Console > Project settings > General > Your apps
// bölümünden alıp aşağıya yapıştırın. Değerleri .env.local dosyasında
// tutuyoruz, bu dosyaya doğrudan yazmayın (bkz. .env.local.example).
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Kalıcı yerel önbellek: internet bağlantısı kesildiğinde yapılan
// değişiklikler (ekleme/güncelleme/silme) tarayıcıda kuyruğa alınır,
// bağlantı geri geldiğinde otomatik olarak Firestore'a gönderilir.
// persistentMultipleTabManager, panel birden fazla sekmede açıksa da
// önbelleğin tutarlı kalmasını sağlar.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export default app;
