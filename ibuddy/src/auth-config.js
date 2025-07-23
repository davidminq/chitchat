// Firebase Auth 설정 (Google, Apple, Kakao OAuth)
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  OAuthProvider,
  signInWithPopup,
  signOut
} from 'firebase/auth';

// Firebase 설정 (환경변수로 관리)
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
export const auth = getAuth(app);

// OAuth Providers 설정
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

// Kakao OAuth는 별도 SDK 사용
const kakaoProvider = new OAuthProvider('oidc.kakao');
kakaoProvider.addScope('profile_nickname');
kakaoProvider.addScope('account_email');

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
      provider: 'apple'
    };
  }
};

export const signInWithKakao = async () => {
  try {
    const result = await signInWithPopup(auth, kakaoProvider);
    return {
      success: true,
      user: result.user,
      provider: 'kakao'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      provider: 'kakao'
    };
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// 현재 사용자 상태 확인
export const getCurrentUser = () => {
  return auth.currentUser;
};