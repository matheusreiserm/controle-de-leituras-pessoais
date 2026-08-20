import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  browserLocalPersistence,
  browserSessionPersistence,
  indexedDBLocalPersistence,
  inMemoryPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { initializeFirestore, memoryLocalCache } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Prioritize browserLocalPersistence & session persistence over IndexedDB
// to prevent "Database is closing/hidden" errors in iframe environments
let authInstance;
try {
  authInstance = initializeAuth(app, {
    persistence: [browserLocalPersistence, browserSessionPersistence, indexedDBLocalPersistence, inMemoryPersistence],
  });
} catch (e) {
  authInstance = getAuth(app);
}

export const auth = authInstance;

export const FIRESTORE_DATABASE_ID = 'ai-studio-controledeleitur-520bd858-2710-4e37-997f-1e910d1267f6';

// Initialize Firestore on the dedicated named database with memoryLocalCache
export const db = initializeFirestore(
  app,
  {
    localCache: memoryLocalCache(),
  },
  'ai-studio-controledeleitur-520bd858-2710-4e37-997f-1e910d1267f6'
);

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');

export const ALLOWED_EMAIL = 'matheusreiserm@gmail.com';

const TOKEN_STORAGE_KEY = 'google_drive_oauth_token';
const TOKEN_TIME_KEY = 'google_drive_oauth_token_time';
const TOKEN_MAX_AGE_MS = 50 * 60 * 1000; // 50 minutes (Google tokens typically last 60 minutes)

let cachedAccessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      try {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
        localStorage.setItem(TOKEN_TIME_KEY, Date.now().toString());
        sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
      } catch (e) {
        // storage quota / privacy mode fallback
      }
    } else {
      try {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(TOKEN_TIME_KEY);
        sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      } catch (e) {
        // ignore
      }
    }
  }
};

export const getAccessToken = (): string | null => {
  if (cachedAccessToken) return cachedAccessToken;
  
  if (typeof window !== 'undefined') {
    try {
      const storedTime = localStorage.getItem(TOKEN_TIME_KEY);
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY) || sessionStorage.getItem(TOKEN_STORAGE_KEY);
      
      if (storedToken && storedTime) {
        const age = Date.now() - parseInt(storedTime, 10);
        if (age < TOKEN_MAX_AGE_MS) {
          cachedAccessToken = storedToken;
          return cachedAccessToken;
        } else {
          // Token expired, clean it up
          setAccessToken(null);
          return null;
        }
      } else if (storedToken) {
        cachedAccessToken = storedToken;
        return cachedAccessToken;
      }
    } catch (e) {
      return null;
    }
  }
  return null;
};

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      setAccessToken(credential.accessToken);
    }
    return { user: result.user, accessToken: credential?.accessToken || getAccessToken() };
  } catch (error: any) {
    if (error?.code !== 'auth/popup-closed-by-user' && error?.code !== 'auth/cancelled-popup-request') {
      console.warn('Error signing in with Google:', error);
    }
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
    setAccessToken(null);
  } catch (error) {
    console.error('Error signing out:', error);
  }
};

