import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { generateRandomNickname } from '../utils/nickname';
import { createUserProfile, getUserProfile } from '../utils/userManagement';

const AuthComponent = ({ onAuthSuccess, onGuestMode }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let userCredential;
      
      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // 회원가입 시 사용자 프로필 생성
        const nickname = generateRandomNickname();
        await createUserProfile(userCredential.user.uid, {
          email: userCredential.user.email,
          nickname: nickname,
          loginMethod: 'email'
        });
      }

      // 사용자 프로필 정보 가져오기
      const userProfile = await getUserProfile(userCredential.user.uid);
      
      onAuthSuccess({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        nickname: userProfile?.nickname || generateRandomNickname(),
        isAnonymous: false,
        loginMethod: 'email'
      });

    } catch (error) {
      console.error('Email auth error:', error);
      
      let errorMessage = '인증 중 오류가 발생했습니다.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = '등록되지 않은 이메일입니다.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = '잘못된 비밀번호입니다.';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = '이미 사용 중인 이메일입니다.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = '비밀번호가 너무 약합니다. (최소 6자 이상)';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '유효하지 않은 이메일 형식입니다.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };





  return (
    <div className="auth-gate" style={{ 
      padding: '1rem', 
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      justifyContent: 'space-between'
    }}>
      <div>
        <h1 style={{ marginTop: '2rem' }}>ibuddy</h1>
      </div>
      
      <div className="side-section" style={{ 
        width: '100%', 
        maxWidth: '400px', 
        margin: '0 auto',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        {/* Email/Password Form */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <button
              onClick={() => setIsLogin(true)}
              style={{
                backgroundColor: isLogin ? '#58a6ff' : 'transparent',
                color: isLogin ? 'white' : '#58a6ff',
                border: '1px solid #58a6ff',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              로그인
            </button>
            <button
              onClick={() => setIsLogin(false)}
              style={{
                backgroundColor: !isLogin ? '#58a6ff' : 'transparent',
                color: !isLogin ? 'white' : '#58a6ff',
                border: '1px solid #58a6ff',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              회원가입
            </button>
          </div>

          <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                padding: '0.8rem',
                borderRadius: '8px',
                border: '1px solid #444',
                backgroundColor: '#1a1a1a',
                color: 'white',
                fontSize: '1rem'
              }}
            />
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                padding: '0.8rem',
                borderRadius: '8px',
                border: '1px solid #444',
                backgroundColor: '#1a1a1a',
                color: 'white',
                fontSize: '1rem'
              }}
            />
            <button
              type="submit"
              disabled={loading || !email || !password}
              style={{
                backgroundColor: loading || !email || !password ? '#333' : '#58a6ff',
                color: 'white',
                padding: '0.8rem',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
                fontWeight: '500'
              }}
            >
              {loading ? '처리 중...' : (isLogin ? '로그인' : '회원가입')}
            </button>
          </form>

          {error && (
            <p style={{ color: '#ff6b6b', textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem' }}>
              {error}
            </p>
          )}
        </div>

        <div style={{ textAlign: 'center', margin: '1rem 0', color: '#666' }}>
          또는
        </div>

        {/* SSO Buttons */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: '1rem', 
          marginBottom: '2rem',
          width: '100%'
        }}>
          <img src="./sso/apple.svg" alt="Apple" style={{ width: '320px', height: '48px', cursor: 'pointer' }} />
          <img src="./sso/google.svg" alt="Google" style={{ width: '320px', height: '48px', cursor: 'pointer' }} />
          <img src="./sso/fb.svg" alt="Facebook" style={{ width: '320px', height: '48px', cursor: 'pointer' }} />
        </div>

        {/* Demo Mode Button */}
        {onGuestMode && (
          <div style={{ marginTop: '2rem', marginBottom: '3rem' }}>
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

      </div>

      <footer className="chat-footer" style={{
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
  );
};

export default AuthComponent;