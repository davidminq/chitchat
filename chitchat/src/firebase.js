import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  OAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase 설정 (환경변수 우선, 없으면 기본값)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "your-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "your-app-id"
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// Firebase 서비스들
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// OAuth Providers 설정
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

// OAuth 로그인 함수들
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return {
      success: true,
      user: result.user,
      provider: 'google'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      provider: 'google'
    };
  }
};

export const signInWithApple = async () => {
  try {
    const result = await signInWithPopup(auth, appleProvider);
    return {
      success: true,
      user: result.user,
      provider: 'apple'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      provider: 'apple'
    };
  }
};

// 이메일/비밀번호 로그인
export const signInWithEmail = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return {
      success: true,
      user: result.user,
      provider: 'email'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      provider: 'email'
    };
  }
};

// 이메일/비밀번호 회원가입
export const createUserWithEmail = async (email, password) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return {
      success: true,
      user: result.user,
      provider: 'email'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      provider: 'email'
    };
  }
};

// 로그아웃
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      code: error.code 
    };
  }
};

// 현재 사용자 상태 확인
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Firebase 설정 상태 확인
export const isFirebaseConfigured = () => {
  return firebaseConfig.apiKey !== "your-api-key";
};

// 프로바이더들 export (호환성)
export { googleProvider, appleProvider };

export default app;