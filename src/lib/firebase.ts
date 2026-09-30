import { getAccessToken, setAccessToken } from './driveToken';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { initializeFirestore, memoryLocalCache } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

export const FIRESTORE_DATABASE_ID = '(default)';

// Initialize Firestore on the default database with memoryLocalCache
export const db = initializeFirestore(
  app,
  {
    localCache: memoryLocalCache(),
  }
);

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');

// Força a exibição da tela de consentimento para incluir escopos adicionais (Google Drive)
googleProvider.setCustomParameters({
  prompt: 'consent',
});

export const ALLOWED_EMAIL = 'matheusreiserm@gmail.com';

export { getAccessToken, setAccessToken } from './driveToken';

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
