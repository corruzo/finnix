import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || "AIzaSyBnoaMEn5K5ejjguJc3MFvy_X-S3c6l5OM",
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || "finnixapp.firebaseapp.com",
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || "finnixapp",
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || "finnixapp.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "364238569830",
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || "1:364238569830:web:bc200e91c5408a4a1788a7",
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID     || "G-0GTMMB1QJ4",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db   = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});
export const googleProvider = new GoogleAuthProvider();

// Always false – real Firebase credentials are always present
export const isMockMode = false;

export default app;
