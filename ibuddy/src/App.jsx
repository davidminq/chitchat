import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase';
import AuthComponent from './components/AuthComponent';
import ChatComponent from './components/ChatComponent';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check Firebase configuration - set to guest mode if placeholder values
    if (!isFirebaseConfigured()) {
      console.log('Firebase not configured, enabling guest mode');
      setLoading(false);
      return;
    }

    // If Firebase is properly configured
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
      // Show AuthComponent even if Firebase configuration error
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
    // Create temporary user for guest mode
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
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#000' }}>
      {user ? (
        <ChatComponent user={user} onLogout={handleLogout} />
      ) : (
        <AuthComponent onAuthSuccess={handleAuthSuccess} onGuestMode={handleGuestMode} />
      )}
    </div>
  )
}

export default App;