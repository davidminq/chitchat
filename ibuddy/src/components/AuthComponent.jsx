import { useState } from 'react';
import { signInWithPopup, signInAnonymously } from 'firebase/auth';
import { auth, googleProvider, appleProvider } from '../firebase';
import { generateRandomNickname } from '../utils/nickname';
import { createUserProfile, getUserProfile } from '../utils/userManagement';
import appleIcon from '../assets/icons/btn_apple.svg';
import googleIcon from '../assets/icons/btn_google.svg';

const AuthComponent = ({ onAuthSuccess, onGuestMode }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user profile exists, if not create one
      let userProfile = await getUserProfile(user.uid);
      
      if (!userProfile) {
        const nickname = generateRandomNickname();
        userProfile = await createUserProfile(user.uid, {
          nickname: nickname,
          email: user.email,
          isAnonymous: false,
          loginMethod: 'google'
        });
      }
      
      onAuthSuccess(userProfile);
    } catch (error) {
      console.error('Google login error:', error);
      setError('구글 로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await signInWithPopup(auth, appleProvider);
      const user = result.user;
      
      let userProfile = await getUserProfile(user.uid);
      
      if (!userProfile) {
        const nickname = generateRandomNickname();
        userProfile = await createUserProfile(user.uid, {
          nickname: nickname,
          email: user.email,
          isAnonymous: false,
          loginMethod: 'apple'
        });
      }
      
      onAuthSuccess(userProfile);
    } catch (error) {
      console.error('Apple login error:', error);
      setError('애플 로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleKakaoLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      // 카카오 로그인은 현재 구현되지 않음
      setError('카카오 로그인은 준비 중입니다.');
    } catch (error) {
      console.error('Kakao login error:', error);
      setError('카카오 로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await signInAnonymously(auth);
      const user = result.user;
      
      let userProfile = await getUserProfile(user.uid);
      
      if (!userProfile) {
        const nickname = generateRandomNickname();
        userProfile = await createUserProfile(user.uid, {
          nickname: nickname,
          email: null,
          isAnonymous: true,
          loginMethod: 'guest'
        });
      }
      
      onAuthSuccess(userProfile);
    } catch (error) {
      console.error('Guest login error:', error);
      setError('게스트 로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-gate" style={{ padding: '1rem', textAlign: 'center' }}>
      <h1>ibuddy</h1>
      <div className="side-section" style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
        
        {/* Social Login Options */}
        <div className="social-login" style={{ marginTop: '2rem', textAlign: 'center' }}>
          <p style={{ marginBottom: '0.8rem', color: '#ccc' }}>소셜 계정으로 로그인</p>
          
          {error && (
            <div style={{ color: '#ff4444', marginBottom: '1rem', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '0.8rem', padding: '0 1rem' }}>
            {/* Google 로그인 */}
            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{ 
                backgroundColor: 'white', 
                color: '#333', 
                padding: '0.8rem 1rem', 
                borderRadius: '8px', 
                border: '1px solid #ddd', 
                cursor: loading ? 'not-allowed' : 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontWeight: '500',
                fontSize: '0.95rem',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#f8f9fa'}
              onMouseOut={(e) => e.target.style.backgroundColor = 'white'}
            >
              <img src={googleIcon} alt="Google" style={{ width: '20px', height: '20px', marginRight: '12px', objectFit: 'contain' }} />
              {loading ? '로그인 중...' : 'Google로 계속하기'}
            </button>
            
            {/* Apple 로그인 */}
            <button 
              onClick={handleAppleLogin}
              disabled={loading}
              style={{ 
                backgroundColor: '#000', 
                color: 'white', 
                padding: '0.8rem 1rem', 
                borderRadius: '8px', 
                border: 'none', 
                cursor: loading ? 'not-allowed' : 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontWeight: '500',
                fontSize: '0.95rem',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#333'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#000'}
            >
              <img src={appleIcon} alt="Apple" style={{ width: '20px', height: '20px', marginRight: '12px', objectFit: 'contain', filter: 'invert(1)' }} />
              {loading ? '로그인 중...' : 'Apple로 계속하기'}
            </button>

            {/* 카카오 로그인 */}
            <button 
              onClick={handleKakaoLogin}
              disabled={loading}
              style={{ 
                backgroundColor: '#FEE500', 
                color: '#000', 
                padding: '0.8rem 1rem', 
                borderRadius: '8px', 
                border: 'none', 
                cursor: loading ? 'not-allowed' : 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontWeight: '500',
                fontSize: '0.95rem',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#FFD700'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#FEE500'}
            >
              <span style={{ fontSize: '20px', marginRight: '12px' }}>💬</span>
              {loading ? '로그인 중...' : '카카오로 계속하기'}
            </button>
          </div>
        </div>

        {/* Guest Login */}
        <div style={{ marginTop: '2rem' }}>
          <button 
            onClick={handleGuestLogin}
            disabled={loading}
            className="guest-button"
            style={{
              backgroundColor: '#58a6ff',
              color: 'white',
              padding: '0.8rem 1.2rem',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? '로그인 중...' : '게스트로 시작'}
          </button>
        </div>

        {/* Demo Mode Button */}
        {onGuestMode && (
          <div style={{ marginTop: '2rem' }}>
            <button 
              onClick={onGuestMode}
              style={{
                backgroundColor: 'transparent',
                color: '#58a6ff',
                padding: '0.8rem 1.2rem',
                border: '1px solid #58a6ff',
                borderRadius: '8px',
                fontWeight: '500',
                cursor: 'pointer',
                fontSize: '0.9rem',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#58a6ff';
                e.target.style.color = 'white';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#58a6ff';
              }}
            >
              데모 모드로 체험하기
            </button>
          </div>
        )}

        <footer className="chat-footer" style={{
          marginTop: '4rem',
          padding: '1rem 0',
          backgroundColor: 'transparent',
          textAlign: 'center'
        }}>
          <div className="footer-meta" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            color: '#bbb',
            gap: '0.3rem'
          }}>
            <small style={{ display: 'block' }}>
              © 2025 Concrete Lab — All rights reserved. v1.0.3
            </small>
            <small style={{ display: 'block', marginTop: '0.25rem' }}>
              현재 접속자: 익명 사용자들
            </small>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AuthComponent;