import { useState, useEffect, useCallback, useMemo } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase';
import ChatComponent from './components/ChatComponent';
import LandingPage from './components/LandingPage';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';

// Color palette moved outside component to prevent re-creation
const COLOR_PALETTE = [
  '#FF0000', // Red
  '#0000FF', // Blue
  '#008000', // Green
  '#FF69B4', // HotPink
  '#FF4500', // OrangeRed
  '#FF7F50', // Coral
  '#9ACD32', // YellowGreen
  '#2E8B57', // SeaGreen
  '#DAA520', // GoldenRod
  '#D2691E', // Chocolate
  '#5F9EA0', // CadetBlue
  '#1E90FF', // DodgerBlue
  '#8A2BE2', // BlueViolet
  '#00FF7F', // SpringGreen
  '#B22222'  // Firebrick
];

// Loading component for better reusability
const LoadingScreen = () => (
  <div className="flex justify-center items-center h-screen text-white bg-black">
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
      <p>Loading...</p>
    </div>
  </div>
);

// Main App Component
function MainApp() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Memoize random color function
  const getRandomColor = useCallback(() => {
    return COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
  }, []);

  // Memoize guest mode handler
  const handleGuestMode = useCallback(() => {
    const guestUser = {
      uid: `guest_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      nickname: `Guest${Math.floor(Math.random() * 1000)}`,
      email: null,
      isAnonymous: true,
      isBlueCheck: false,
      color: getRandomColor(),
      loginMethod: 'guest'
    };
    setUser(guestUser);
  }, [getRandomColor]);

  // Memoize logout handler
  const handleLogout = useCallback(async () => {
    try {
      if (user?.loginMethod === 'guest') {
        // For guest users, just clear the state
        setUser(null);
      } else {
        // For authenticated users, sign out from Firebase
        await auth.signOut();
        setUser(null);
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if Firebase signOut fails
      setUser(null);
    }
  }, [user?.loginMethod]);

  useEffect(() => {
    let unsubscribe;
    
    const initializeAuth = async () => {
      try {
        // Check Firebase configuration
        if (!isFirebaseConfigured()) {
          console.log('Firebase not configured, enabling guest mode only');
          setLoading(false);
          return;
        }

        // Set up Firebase auth listener
        unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
          if (firebaseUser && !firebaseUser.isAnonymous) {
            // Real authenticated user
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              nickname: firebaseUser.displayName || 'User',
              isAnonymous: false,
              isBlueCheck: false,
              color: getRandomColor(),
              loginMethod: 'firebase'
            });
          } else {
            // No user or anonymous user - show landing page
            setUser(null);
          }
          setLoading(false);
        });
      } catch (error) {
        console.error('Firebase initialization error:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [getRandomColor]);

  // Memoize main app styles
  const appStyles = useMemo(() => ({
    backgroundColor: '#000',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh'
  }), []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div style={appStyles}>
      {user ? (
        <ChatComponent user={user} onLogout={handleLogout} />
      ) : (
        <LandingPage onGuestMode={handleGuestMode} />
      )}
    </div>
  )
}

// App with Router
function App() {
  useEffect(() => {
    // Handle GitHub Pages SPA routing
    (function(l) {
      if (l.search[1] === '/' ) {
        var decoded = l.search.slice(1).split('&').map(function(s) { 
          return s.replace(/~and~/g, '&')
        }).join('?');
        window.history.replaceState(null, null,
          l.pathname.slice(0, -1) + decoded + l.hash
        );
      }
    }(window.location));
  }, []);

  return (
    <Router basename="/ibuddy">
      <Routes>
        {/* Main app routes */}
        <Route path="/" element={<MainApp />} />
        
        {/* Hidden admin routes */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;