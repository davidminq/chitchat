import { useState, useEffect } from "react";
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

export default function AdminDashboard() {
  const [adminEmail, setAdminEmail] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated as admin
    const isAuthenticated = localStorage.getItem("adminAuth");
    const email = localStorage.getItem("adminEmail");
    
    if (!isAuthenticated || isAuthenticated !== "true") {
      // Redirect to admin login if not authenticated
      navigate("/admin-login");
      return;
    }
    
    setAdminEmail(email || "admin@chitchat.com");
  }, [navigate]);

  const handleLogout = () => {
    // Clear admin session
    localStorage.removeItem("adminAuth");
    localStorage.removeItem("adminEmail");
    
    console.log("Admin logout");
    navigate("/admin-login");
  };

  const handleBackToApp = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black" style={fontStyles.body}>
      {/* Header */}
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-sm">🔐</span>
              </div>
              <h1 className="text-lg sm:text-xl text-white truncate" style={fontStyles.heading}>
                <span className="hidden sm:inline">Admin Dashboard</span>
                <span className="sm:hidden">Admin</span>
              </h1>
            </div>
            
            {/* Desktop Header */}
            <div className="hidden md:flex items-center gap-4">
              <span className="text-gray-400 text-sm" style={fontStyles.body}>
                {adminEmail}
              </span>
              <button
                onClick={handleBackToApp}
                className="px-4 py-2.5 text-gray-400 hover:text-white text-sm transition-colors duration-200 touch-manipulation min-h-[44px]"
                style={fontStyles.body}
              >
                View App
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 rounded-lg text-sm transition-all duration-200 border border-red-600/30 touch-manipulation min-h-[44px]"
                style={fontStyles.medium}
              >
                Logout
              </button>
            </div>
            
            {/* Mobile Header */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={handleBackToApp}
                className="p-2 text-gray-400 hover:text-white transition-colors duration-200 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                style={fontStyles.body}
                title="View App"
              >
                <span className="text-lg">🏠</span>
              </button>
              <button
                onClick={handleLogout}
                className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 rounded-lg text-sm transition-all duration-200 border border-red-600/30 touch-manipulation min-h-[44px]"
                style={fontStyles.medium}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile User Info */}
        <div className="md:hidden mb-6 bg-gray-800/30 backdrop-blur-sm rounded-2xl p-4 border border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs mb-1" style={fontStyles.body}>Logged in as</p>
              <p className="text-white text-sm" style={fontStyles.medium}>{adminEmail}</p>
            </div>
            <button
              onClick={handleBackToApp}
              className="px-3 py-2 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white rounded-lg text-sm transition-all duration-200 touch-manipulation min-h-[44px]"
              style={fontStyles.body}
            >
              🏠 View App
            </button>
          </div>
        </div>
        
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h2 className="text-2xl sm:text-3xl text-white mb-2" style={fontStyles.heading}>
            Welcome to ChitChat Admin
          </h2>
          <p className="text-gray-400" style={fontStyles.subheading}>
            Manage your chat application from this central dashboard
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {[
            { title: "Active Users", value: "1,247", icon: "👥", change: "+12%" },
            { title: "Total Messages", value: "45,892", icon: "💬", change: "+8%" },
            { title: "Active Rooms", value: "324", icon: "🏠", change: "+5%" },
            { title: "Reports", value: "23", icon: "⚠️", change: "-15%" }
          ].map((stat) => (
            <div
              key={stat.title}
              className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl">{stat.icon}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  stat.change.startsWith('+') 
                    ? 'bg-green-600/20 text-green-400' 
                    : 'bg-red-600/20 text-red-400'
                }`} style={fontStyles.body}>
                  {stat.change}
                </span>
              </div>
              <h3 className="text-2xl text-white mb-1" style={fontStyles.heading}>
                {stat.value}
              </h3>
              <p className="text-gray-400 text-sm" style={fontStyles.body}>
                {stat.title}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Action Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {[
            {
              title: "User Management",
              description: "View and manage user accounts, permissions, and bans",
              icon: "👤",
              action: "Manage Users"
            },
            {
              title: "Chat Moderation",
              description: "Monitor chat rooms, review reports, and moderate content",
              icon: "🛡️",
              action: "Open Moderation"
            },
            {
              title: "System Settings",
              description: "Configure application settings, features, and policies",
              icon: "⚙️",
              action: "Settings"
            },
            {
              title: "Analytics",
              description: "View detailed analytics and usage statistics",
              icon: "📊",
              action: "View Analytics"
            },
            {
              title: "Reports & Logs",
              description: "Access system logs, error reports, and audit trails",
              icon: "📋",
              action: "View Reports"
            },
            {
              title: "Backup & Maintenance",
              description: "Manage database backups and system maintenance",
              icon: "🔧",
              action: "Maintenance"
            }
          ].map((card) => (
            <div
              key={card.title}
              className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{card.icon}</span>
                <h3 className="text-lg text-white" style={fontStyles.heading}>
                  {card.title}
                </h3>
              </div>
              <p className="text-gray-400 text-sm mb-4 leading-relaxed" style={fontStyles.body}>
                {card.description}
              </p>
              <button
                onClick={() => console.log(`${card.title} clicked`)}
                className="w-full px-4 py-3 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white rounded-xl transition-all duration-200 text-sm touch-manipulation min-h-[48px]"
                style={fontStyles.medium}
              >
                {card.action}
              </button>
            </div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-8 bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50"
        >
          <h3 className="text-xl text-white mb-4" style={fontStyles.heading}>
            Quick Actions
          </h3>
          <div className="flex flex-wrap gap-3">
            {[
              "Send System Message",
              "Emergency Shutdown",
              "Clear Cache",
              "Export Data",
              "Run Backup"
            ].map((action) => (
              <button
                key={action}
                onClick={() => console.log(`${action} clicked`)}
                className="px-4 py-2.5 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white rounded-lg text-sm transition-all duration-200 touch-manipulation min-h-[44px]"
                style={fontStyles.body}
              >
                {action}
              </button>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}