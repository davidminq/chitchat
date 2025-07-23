import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import AuthComponent from './components/AuthComponent';
import ChatComponent from './components/ChatComponent';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guestMode, setGuestMode] = useState(false);

  useEffect(() => {
    // Firebase 설정 확인 - placeholder 값이면 게스트 모드로 설정
    if (auth.app.options.apiKey === "your-api-key") {
      console.log('Firebase not configured, enabling guest mode');
      setGuestMode(true);
      setLoading(false);
      return;
    }

    // Firebase가 올바르게 설정된 경우
    try {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          // User is signed in
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            nickname: firebaseUser.displayName || 'Anonymous',
            isAnonymous: firebaseUser.isAnonymous,
            isBlueCheck: false, // Will be loaded from Firestore
            color: getRandomColor()
          });
        } else {
          // User is signed out
          setUser(null);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      // Firebase 설정 오류시에도 AuthComponent를 보여줌
      console.log('Firebase error, showing auth component:', error);
      setLoading(false);
    }
  }, []);

  const handleAuthSuccess = (userData) => {
    setUser({
      ...userData,
      isBlueCheck: false, // Default value, will be loaded from Firestore
      color: getRandomColor()
    });
  };

  const handleGuestMode = () => {
    // 게스트 모드로 임시 사용자 생성
    const guestUser = {
      uid: 'guest_' + Date.now(),
      nickname: 'Guest' + Math.floor(Math.random() * 1000),
      email: null,
      isAnonymous: true,
      isBlueCheck: false,
      color: getRandomColor(),
      loginMethod: 'guest'
    };
    setUser(guestUser);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getRandomColor = () => {
    const colors = ['#FF69B4', '#1E90FF', '#FFD700', '#00FA9A', '#BA55D3', '#FF4500'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        color: 'white' 
      }}>
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh' }}>
      {user ? (
        <ChatComponent user={user} onLogout={handleLogout} />
      ) : (
        <AuthComponent onAuthSuccess={handleAuthSuccess} onGuestMode={handleGuestMode} />
      )}
    </div>
  )
}

export default App;