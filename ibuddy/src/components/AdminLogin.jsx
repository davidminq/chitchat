import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

// Font styles consistent with the app
const fontStyles = {
  heading: { fontFamily: 'Poppins, sans-serif', fontWeight: 700 },
  subheading: { fontFamily: 'Poppins, sans-serif', fontWeight: 400 },
  button: { fontFamily: 'Poppins, sans-serif', fontWeight: 600 },
  body: { fontFamily: 'Poppins, sans-serif', fontWeight: 400 },
  medium: { fontFamily: 'Poppins, sans-serif', fontWeight: 500 },
};

export default function AdminLogin() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Simulate API call
    setTimeout(() => {
      // Temporary client-side authentication
      // Replace with actual backend authentication later
      if (formData.email === "admin@chitchat.com" && formData.password === "admin123") {
        // Store admin session (temporary)
        localStorage.setItem("adminAuth", "true");
        localStorage.setItem("adminEmail", formData.email);
        
        console.log("Admin login successful");
        navigate("/admin-dashboard");
      } else {
        setError("Invalid email or password");
      }
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4" style={fontStyles.body}>
      <div className="w-full max-w-md">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-red-600 to-orange-600 rounded-full flex items-center justify-center">
              <span className="text-2xl">🔐</span>
            </div>
          </div>
          <h1 className="text-3xl text-white mb-2" style={fontStyles.heading}>
            Admin Portal
          </h1>
          <p className="text-gray-400" style={fontStyles.subheading}>
            Authorized personnel only
          </p>
        </motion.div>

        {/* Login Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-gray-700/50"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-900/50 border border-red-600/50 rounded-xl p-3"
              >
                <p className="text-red-300 text-sm text-center" style={fontStyles.body}>
                  {error}
                </p>
              </motion.div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-300" style={fontStyles.medium}>
                Administrator Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="admin@chitchat.com"
                className="w-full px-4 py-4 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 touch-manipulation"
                style={{...fontStyles.body, minHeight: '56px', fontSize: '16px'}}
                required
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-300" style={fontStyles.medium}>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter admin password"
                className="w-full px-4 py-4 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 touch-manipulation"
                style={{...fontStyles.body, minHeight: '56px', fontSize: '16px'}}
                required
              />
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold py-4 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 transform hover:scale-[1.02] transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none touch-manipulation"
              style={{...fontStyles.button, minHeight: '56px', fontSize: '1.1rem'}}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Authenticating...
                </div>
              ) : (
                "Access Admin Panel"
              )}
            </button>
          </form>

          {/* Security Notice */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-6 pt-6 border-t border-gray-700/50"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-yellow-400">⚠️</span>
              <p className="text-gray-400 text-xs" style={fontStyles.medium}>
                Security Notice
              </p>
            </div>
            <p className="text-gray-500 text-xs text-center leading-relaxed" style={fontStyles.body}>
              This area is restricted to authorized administrators only. All access attempts are logged and monitored.
            </p>
          </motion.div>
        </motion.div>

        {/* Back to Home */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-6"
        >
          <button
            onClick={() => navigate("/")}
            className="text-gray-400 hover:text-gray-300 text-base transition-colors duration-200 py-3 px-2 touch-manipulation"
            style={{...fontStyles.body, minHeight: '44px'}}
          >
            ← Back to Home
          </button>
        </motion.div>

      </div>
    </div>
  );
}