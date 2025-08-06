import { useState, useCallback, useMemo, useEffect } from "react";
import { Button } from "./ui/button";
import { motion } from "framer-motion";
import { GoogleIcon } from "./icons/GoogleIcon";
import { AppleIcon } from "./icons/AppleIcon";
import { FacebookIcon } from "./icons/FacebookIcon";

// Animation variants for better performance
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
};

// Font styles - moved outside component to prevent re-creation
const fontStyles = {
  heading: { fontFamily: 'Poppins, sans-serif', fontWeight: 700 },
  subheading: { fontFamily: 'Poppins, sans-serif', fontWeight: 400 },
  button: { fontFamily: 'Poppins, sans-serif', fontWeight: 600 },
  body: { fontFamily: 'Poppins, sans-serif', fontWeight: 400 },
  medium: { fontFamily: 'Poppins, sans-serif', fontWeight: 500 },
};

export default function LandingPage({ onGuestMode }) {
  const [isStarting, setIsStarting] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1247);

  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCount(prev => {
        const change = Math.floor(Math.random() * 21) - 10; // -10 to +10
        const newCount = Math.max(900, Math.min(2000, prev + change));
        return newCount;
      });
    }, 2000 + Math.random() * 3000); // 2-5 seconds random interval

    return () => clearInterval(interval);
  }, []);

  const handleStartChat = useCallback(() => {
    if (isStarting || !onGuestMode) return;
    
    setIsStarting(true);
    // Anonymous chat start logic with proper error handling
    setTimeout(() => {
      try {
        onGuestMode();
      } catch (error) {
        console.error('Failed to start guest mode:', error);
      } finally {
        setIsStarting(false);
      }
    }, 2000);
  }, [isStarting, onGuestMode]);

  const handleSSOLogin = useCallback((provider) => {
    console.log(`${provider} login started`);
    // TODO: Implement SSO login logic
  }, []);

  // Memoize social logins to prevent re-creation on every render
  const socialLogins = useMemo(() => [
    { 
      name: "Google", 
      icon: <GoogleIcon size={20} />, 
      bg: "bg-white hover:bg-gray-100 text-black border border-white/20",
      textColor: "text-black"
    },
    { 
      name: "Apple", 
      icon: <AppleIcon size={20} />, 
      bg: "bg-black hover:bg-gray-800 text-white border border-gray-600",
      textColor: "text-white"
    },
    { 
      name: "Facebook", 
      icon: <FacebookIcon size={20} />, 
      bg: "bg-blue-600 hover:bg-blue-700 text-white",
      textColor: "text-white"
    }
  ], []);

  // Memoize safety tips to prevent re-creation
  const safetyTips = useMemo(() => [
    "Never share personal information",
    "Report inappropriate behavior", 
    "Be respectful to others"
  ], []);


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-start py-4 sm:py-8 px-3 sm:px-4" style={fontStyles.body}>
      <div className="w-full max-w-lg text-center">
        {/* Main logo */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h1 className="text-4xl sm:text-6xl mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent" style={fontStyles.heading}>
            Chit Chat
          </h1>
          <p className="text-slate-400 text-base sm:text-lg" style={fontStyles.subheading}>
            Anonymous random chat with strangers
          </p>
        </motion.div>

        {/* Main action card */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-700/50 mb-8"
        >
          {/* Anonymous chat description */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" aria-hidden="true"></div>
              <span className="text-slate-300 text-sm" style={fontStyles.medium}>
                Completely Anonymous
              </span>
            </div>
          </div>

          {/* Main start button */}
          <Button
            onClick={handleStartChat}
            disabled={isStarting || !onGuestMode}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl py-6 sm:py-6 mb-6 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] text-lg sm:text-lg min-h-[60px] touch-manipulation"
            size="lg"
            style={fontStyles.button}
            aria-label={isStarting ? "Finding someone to chat" : "Start anonymous chat"}
          >
            {isStarting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true"></div>
                Finding someone to chat...
              </div>
            ) : (
              "Start Anonymous Chat"
            )}
          </Button>


          {/* Chat stats */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-700/30 rounded-2xl border border-slate-600/50 mt-4">
            <div className="text-center">
              <motion.p 
                key={onlineCount}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-2xl text-white mb-1" 
                style={fontStyles.button}
              >
                {onlineCount.toLocaleString()}
              </motion.p>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" aria-hidden="true"></div>
                <p className="text-slate-400 text-xs" style={fontStyles.body}>
                  Online Now
                </p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-2xl text-white mb-1" style={fontStyles.button}>
                24/7
              </p>
              <p className="text-slate-400 text-xs" style={fontStyles.body}>
                Available
              </p>
            </div>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          variants={fadeIn}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.6, delay: 0.4 }}
          className="space-y-6"
        >
          {/* Feature highlights */}
          <div className="grid grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-8">
            <div className="text-center p-3 sm:p-4">
              <div className="mx-auto mb-3 sm:mb-3">
                <span className="text-2xl sm:text-3xl">🎲</span>
              </div>
              <p className="text-slate-300 text-sm sm:text-base font-medium" style={fontStyles.medium}>
                Random
              </p>
            </div>
            <div className="text-center p-3 sm:p-4">
              <div className="mx-auto mb-3 sm:mb-3">
                <span className="text-2xl sm:text-3xl">🔒</span>
              </div>
              <p className="text-slate-300 text-sm sm:text-base font-medium" style={fontStyles.medium}>
                Anonymous
              </p>
            </div>
            <div className="text-center p-3 sm:p-4">
              <div className="mx-auto mb-3 sm:mb-3">
                <span className="text-2xl sm:text-3xl">⚡</span>
              </div>
              <p className="text-slate-300 text-sm sm:text-base font-medium" style={fontStyles.medium}>
                Instant
              </p>
            </div>
          </div>

          {/* Safety notice */}
          <div className="bg-slate-800/30 rounded-2xl p-4 border border-slate-700/50">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-yellow-400" aria-hidden="true">⚠️</span>
              <p className="text-slate-300 text-sm" style={fontStyles.medium}>
                Stay Safe Online
              </p>
            </div>
            <div className="space-y-1">
              {safetyTips.map((tip, index) => (
                <p key={index} className="text-slate-400 text-xs" style={fontStyles.body}>
                  • {tip}
                </p>
              ))}
            </div>
          </div>

          {/* Footer links */}
          <div className="flex justify-center gap-6 sm:gap-8 text-sm sm:text-base text-slate-500 mt-8 sm:mt-8">
            <button 
              className="hover:text-slate-300 transition-colors py-3 px-4 min-h-[48px] min-w-[80px] touch-manipulation rounded-lg" 
              style={fontStyles.body}
              onClick={() => console.log('Terms of Service clicked')}
            >
              Terms
            </button>
            <button 
              className="hover:text-slate-300 transition-colors py-3 px-4 min-h-[48px] min-w-[80px] touch-manipulation rounded-lg" 
              style={fontStyles.body}
              onClick={() => console.log('Privacy Policy clicked')}
            >
              Privacy
            </button>
            <button 
              className="hover:text-slate-300 transition-colors py-3 px-4 min-h-[48px] min-w-[80px] touch-manipulation rounded-lg" 
              style={fontStyles.body}
              onClick={() => console.log('Report clicked')}
            >
              Report
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}