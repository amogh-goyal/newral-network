import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBars, FaTimes, FaChartPie, FaUser, FaCog, FaRoad,
  FaPlus, FaComments, FaStar, FaEye, FaGraduationCap, FaSearch,
  FaTrash, FaExclamationTriangle, FaCheck, FaLock, FaUserEdit, FaSpinner,
  FaArrowRight
} from "react-icons/fa";
import { BiMap } from "react-icons/bi";

export default function Home() {
  const [showDashboard, setShowDashboard] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState("username");
  const [settingsMessage, setSettingsMessage] = useState({ type: "", text: "" });

  // Form states
  const [newUsername, setNewUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Loading states
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [popularRoadmaps, setPopularRoadmaps] = useState([]);
  const [isLoadingPopular, setIsLoadingPopular] = useState(true);
  const [popularError, setPopularError] = useState(null);

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          window.location.href = '/signup';
          return;
        }
        const response = await fetch('http://localhost:3001/signin', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok && data.authenticated) {
          setUser({ username: data.username, email: data.email });
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          window.location.href = '/signup';
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        window.location.href = '/signup';
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Fetch popular roadmaps
  useEffect(() => {
    const fetchPopularRoadmaps = async () => {
      try {
        setIsLoadingPopular(true);
        const response = await fetch('http://localhost:3001/samples');
        if (!response.ok) throw new Error('Failed to fetch popular roadmaps');
        const data = await response.json();
        setPopularRoadmaps(data.samples && data.samples.length > 0 ? data.samples : [
          { _id: '1', id: '1', main_thumbnail: "/api/placeholder/400/250", enrolled: 2458, roadmap: { title: "Web Development", description: "Master HTML, CSS, JavaScript and popular frameworks.", topic: "Web Development" } },
          { _id: '2', id: '2', main_thumbnail: "/api/placeholder/400/250", enrolled: 1985, roadmap: { title: "Data Science", description: "Learn Python, statistics, and machine learning algorithms.", topic: "Data Science" } },
          { _id: '3', id: '3', main_thumbnail: "/api/placeholder/400/250", enrolled: 1562, roadmap: { title: "Mobile App Development", description: "Build native apps for iOS and Android platforms.", topic: "Mobile Development" } }
        ]);
      } catch (err) {
        console.error('Error fetching popular roadmaps:', err);
        setPopularError(err.message);
        setPopularRoadmaps([
          { _id: '1', id: '1', main_thumbnail: "/api/placeholder/400/250", enrolled: 2458, roadmap: { title: "Web Development", description: "Master HTML, CSS, JavaScript and popular frameworks.", topic: "Web Development" } },
          { _id: '2', id: '2', main_thumbnail: "/api/placeholder/400/250", enrolled: 1985, roadmap: { title: "Data Science", description: "Learn Python, statistics, and machine learning algorithms.", topic: "Data Science" } },
          { _id: '3', id: '3', main_thumbnail: "/api/placeholder/400/250", enrolled: 1562, roadmap: { title: "Mobile App Development", description: "Build native apps for iOS and Android platforms.", topic: "Mobile Development" } }
        ]);
      } finally {
        setIsLoadingPopular(false);
      }
    };
    fetchPopularRoadmaps();
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  };

  return (
    <div className="relative w-full min-h-screen text-white overflow-hidden bg-gradient-to-b from-gray-900 via-gray-800 to-gray-950">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-600 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute top-1/3 -left-20 w-80 h-80 bg-purple-600 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500 rounded-full opacity-10 blur-3xl"></div>
      </div>

      {/* Navigation Bar with Glassmorphism */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 py-4 bg-gray-900 bg-opacity-70 backdrop-blur-md border-b border-gray-700 shadow-lg">
        <div className="flex items-center">
          <button onClick={() => setShowDashboard(true)} className="text-xl hover:text-blue-400 transition mr-4" aria-label="Open dashboard">
            <FaBars />
          </button>
          <h1 className="text-2xl font-bold tracking-wide uppercase flex items-center">
            <BiMap className="mr-2 text-blue-500" /> Map-It
          </h1>
        </div>
        <div className="relative">
          {isSearchOpen ? (
            <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: "250px", opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search roadmaps..."
                className="w-full bg-gray-800 bg-opacity-70 backdrop-blur-sm text-white px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              <button onClick={() => setIsSearchOpen(false)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white">
                <FaTimes />
              </button>
            </motion.div>
          ) : (
            <button onClick={() => setIsSearchOpen(true)} className="text-xl hover:text-blue-400 transition mr-6" aria-label="Open search">
              <FaSearch />
            </button>
          )}
        </div>
        <nav>
          <ul className="flex gap-8 items-center">
            {isLoading ? (
              <li className="w-8 h-8 rounded-full bg-gray-700 animate-pulse"></li>
            ) : user ? (
              <>
                <li>
                  <button className="flex items-center gap-2 hover:text-blue-400 transition">
                    <FaUser /> {user.username}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('username'); window.location.href = '/'; }}
                    className="bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 px-4 py-2 rounded-full transition"
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <li>
                <button onClick={() => window.location.href = "/signup"} className="hover:text-blue-400 transition">
                  Sign In
                </button>
              </li>
            )}
          </ul>
        </nav>
      </header>

      {/* Sidebar Dashboard with Glassmorphism */}
      <AnimatePresence>
        {showDashboard && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex" onClick={() => setShowDashboard(false)}>
            <motion.div
              className="w-72 h-full bg-gray-900 bg-opacity-70 backdrop-blur-md p-6 shadow-lg relative border-r border-gray-800"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold">Dashboard</h2>
                <button className="text-gray-400 hover:text-white text-xl transition" onClick={() => setShowDashboard(false)} aria-label="Close dashboard">
                  <FaTimes />
                </button>
              </div>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-10 bg-gray-800 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : user ? (
                <div>
                  <div className="flex flex-col items-center mb-6 pb-6 border-b border-gray-800">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mb-4 flex items-center justify-center text-3xl">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-lg font-semibold">{user.username}</p>
                    <p className="text-gray-400 text-sm">{user.email}</p>
                  </div>
                  <ul className="space-y-4">
                    <li className="flex items-center gap-3 hover:text-blue-500 transition cursor-pointer p-2 rounded hover:bg-gray-800" onClick={() => window.location.href = "/create-roadmap"}>
                      <FaPlus /> Add New Roadmap
                    </li>
                    <li className="flex items-center gap-3 hover:text-blue-500 transition cursor-pointer p-2 rounded hover:bg-gray-800" onClick={() => window.location.href = "/roadmaps"}>
                      <FaRoad /> My Roadmaps
                    </li>
                    <li className="flex items-center gap-3 hover:text-blue-500 transition cursor-pointer p-2 rounded hover:bg-gray-800" onClick={() => window.location.href = "/progress"}>
                      <FaGraduationCap /> My Progress
                    </li>
                    <li className="flex items-center gap-3 hover:text-blue-500 transition cursor-pointer p-2 rounded hover:bg-gray-800" onClick={() => { setShowSettings(true); setShowDashboard(false); }}>
                      <FaCog /> Settings
                    </li>
                  </ul>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-4">
                  <p className="text-gray-400 mb-2">Sign in to access your roadmaps</p>
                  <button onClick={() => window.location.href = "/signin"} className="w-full bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 py-3 rounded text-center transition">
                    Sign In
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Settings Modal with Glassmorphism and Sliding Tabs */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
            <motion.div
              className="bg-gray-900 bg-opacity-70 backdrop-blur-md rounded-xl w-full max-w-md border border-gray-700 shadow-2xl"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-800">
                <h2 className="text-2xl font-bold">Account Settings</h2>
                <button className="text-gray-400 hover:text-white text-xl transition" onClick={() => { setShowSettings(false); setSettingsMessage({ type: "", text: "" }); resetFormStates(); }}>
                  <FaTimes />
                </button>
              </div>
              <div className="relative">
                <div className="flex border-b border-gray-800">
                  {['username', 'password', 'delete'].map((tab) => (
                    <button
                      key={tab}
                      className={`flex-1 py-3 px-4 font-medium flex items-center justify-center gap-2 ${settingsTab === tab ? (tab === 'delete' ? 'text-red-500' : 'text-blue-500') : 'text-gray-400 hover:text-white'} transition`}
                      onClick={() => { setSettingsTab(tab); setSettingsMessage({ type: "", text: "" }); }}
                    >
                      {tab === 'username' && <FaUserEdit />}
                      {tab === 'password' && <FaLock />}
                      {tab === 'delete' && <FaTrash />}
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
                <motion.div
                  className="absolute bottom-0 left-0 h-0.5 bg-blue-500"
                  initial={false}
                  animate={{ x: ['username', 'password', 'delete'].indexOf(settingsTab) * (100 / 3) + '%' }}
                  style={{ width: '33.333%' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              </div>
              {settingsMessage.text && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mx-6 mt-4 p-3 rounded-lg ${settingsMessage.type === 'success' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'} flex items-center gap-2`}
                >
                  {settingsMessage.type === 'success' ? <FaCheck /> : <FaExclamationTriangle />}
                  <span>{settingsMessage.text}</span>
                </motion.div>
              )}
              <div className="p-6">
                {settingsTab === 'username' && (
                  <form onSubmit={handleUsernameUpdate} className="space-y-4">
                    <div>
                      <label className="block text-gray-400 mb-1">Current Username</label>
                      <input type="text" value={user?.username || ""} disabled className="w-full bg-gray-800 bg-opacity-70 backdrop-blur-sm text-white px-4 py-2 rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 transition" />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1">New Username</label>
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="Enter new username"
                        className="w-full bg-gray-800 bg-opacity-70 backdrop-blur-sm text-white px-4 py-2 rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        required
                        minLength={3}
                      />
                    </div>
                    <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-2 rounded font-medium transition flex items-center justify-center" disabled={isUpdatingUsername}>
                      {isUpdatingUsername ? 'Updating...' : 'Update Username'}
                    </button>
                  </form>
                )}
                {settingsTab === 'password' && (
                  <form onSubmit={handlePasswordUpdate} className="space-y-4">
                    <div>
                      <label className="block text-gray-400 mb-1">Current Password</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="w-full bg-gray-800 bg-opacity-70 backdrop-blur-sm text-white px-4 py-2 rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full bg-gray-800 bg-opacity-70 backdrop-blur-sm text-white px-4 py-2 rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        required
                        minLength={6}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full bg-gray-800 bg-opacity-70 backdrop-blur-sm text-white px-4 py-2 rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        required
                      />
                    </div>
                    <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-2 rounded font-medium transition flex items-center justify-center" disabled={isUpdatingPassword}>
                      {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                    </button>
                  </form>
                )}
                {settingsTab === 'delete' && (
                  <form onSubmit={handleDeleteAccount} className="space-y-4">
                    <div className="bg-red-900 bg-opacity-30 p-4 rounded-lg border border-red-800 mb-4">
                      <div className="flex items-center gap-2 text-red-400 mb-2">
                        <FaExclamationTriangle />
                        <span className="font-semibold">Warning: This action cannot be undone</span>
                      </div>
                      <p className="text-gray-300 text-sm">Deleting your account will permanently remove all your data, including roadmaps and progress.</p>
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1">Your Password</label>
                      <input
                        type="password"
                        value={deleteConfirmPassword}
                        onChange={(e) => setDeleteConfirmPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full bg-gray-800 bg-opacity-70 backdrop-blur-sm text-white px-4 py-2 rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1">Type "DELETE" to confirm</label>
                      <input
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder='Type "DELETE" to confirm'
                        className="w-full bg-gray-800 bg-opacity-70 backdrop-blur-sm text-white px-4 py-2 rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        required
                      />
                    </div>
                    <button type="submit" className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 py-2 rounded font-medium transition flex items-center justify-center" disabled={isDeleting || deleteConfirmText !== "DELETE"}>
                      {isDeleting ? 'Deleting...' : 'Delete Account'}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Section */}
      <main className="relative flex flex-col items-center justify-center text-center pt-32 px-6 mt-16">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-8 pb-4 tracking-wide bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
            Find Your Learning Path
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto text-gray-300">
            Discover personalized roadmaps with curated courses from Udemy, YouTube, Coursera, and more.
          </p>
          <div className="flex flex-col md:flex-row gap-6 max-w-lg mx-auto">
            <motion.button
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6 py-4 text-lg rounded-lg shadow-lg flex items-center justify-center gap-2 font-semibold transition transform hover:-translate-y-1"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = "/create-roadmap"}
            >
              <FaPlus /> Add New Roadmap
            </motion.button>
            <motion.button
              className="bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 px-6 py-4 text-lg rounded-lg shadow baselineshadow-lg flex items-center justify-center gap-2 font-semibold transition transform hover:-translate-y-1"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = "/roadmaps"}
            >
              <FaRoad /> See Roadmaps
            </motion.button>
          </div>
        </motion.div>
      </main>

      {/* Popular Learning Paths with Enhanced Cards */}
      <section className="px-6 text-center max-w-6xl mx-auto mt-24">
        <h2 className="text-3xl font-bold mb-2">Popular Learning Paths</h2>
        <p className="text-gray-400 mb-10">Explore trending roadmaps chosen by our community</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {isLoadingPopular ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-800 bg-opacity-70 backdrop-blur-sm rounded-xl overflow-hidden shadow-xl border border-gray-700 flex flex-col animate-pulse">
                <div className="relative h-48 overflow-hidden bg-gray-700"></div>
                <div className="p-6 flex-grow">
                  <div className="h-6 bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-700 rounded mb-4"></div>
                  <div className="flex justify-between items-center text-sm text-gray-400">
                    <div className="h-4 w-20 bg-gray-700 rounded"></div>
                    <div className="h-4 w-16 bg-gray-700 rounded"></div>
                  </div>
                </div>
                <div className="px-6 py-4 bg-gray-900 flex justify-between items-center">
                  <div className="h-4 w-12 bg-gray-700 rounded"></div>
                  <div className="h-10 w-24 bg-gray-700 rounded-lg"></div>
                </div>
              </div>
            ))
          ) : popularError ? (
            <div className="text-red-500 text-center col-span-3">{popularError}</div>
          ) : popularRoadmaps.length === 0 ? (
            <div className="text-gray-400 text-center col-span-3">No popular roadmaps found</div>
          ) : (
            popularRoadmaps.map((roadmap) => (
              <motion.div
                key={roadmap.id}
                className="bg-gray-800 bg-opacity-70 backdrop-blur-sm rounded-xl overflow-hidden shadow-xl border border-gray-700 flex flex-col"
                whileHover={{ scale: 1.05, boxShadow: "0px 10px 30px rgba(0,0,0,0.2)" }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={roadmap.main_thumbnail || roadmap.image || "/api/placeholder/400/250"}
                    alt={roadmap.roadmap?.title || roadmap.title || "Roadmap"}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = "/api/placeholder/400/250"; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-70"></div>
                </div>
                <div className="p-6 flex-grow">
                  <h3 className="text-xl font-bold mb-2">{roadmap.roadmap?.title || roadmap.title || 'Untitled Roadmap'}</h3>
                  <p className="text-gray-300 mb-4">
                    {roadmap.roadmap?.description ? (roadmap.roadmap.description.length > 100 ? roadmap.roadmap.description.substring(0, 100) + '...' : roadmap.roadmap.description) : 'No description available'}
                  </p>
                  <div className="flex justify-between items-center text-sm text-gray-400">
                    <div className="flex items-center">
                      <FaEye className="mr-1" /> {(roadmap.enrolled || 0).toLocaleString()} enrolled
                    </div>
                    <div className="flex items-center">
                      <FaStar className="text-yellow-400 mr-1" /> {roadmap.rating || 4.5}
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 bg-gray-900 flex justify-between items-center">
                  <span className="text-sm">{roadmap.roadmap?.options?.length || 0} options</span>
                  <button
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-4 py-2 rounded-lg text-sm font-medium transition"
                    onClick={() => window.location.href = `/sample-roadmap/${roadmap._id || roadmap.id}`}
                  >
                    View Roadmap
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="mt-24 px-6 text-center max-w-6xl mx-auto">
        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
          <motion.h2 variants={itemVariants} className="text-3xl font-bold mb-2">How It Works</motion.h2>
          <motion.p variants={itemVariants} className="text-gray-400 mb-12">Follow these simple steps to create your personalized learning journey</motion.p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { icon: <FaSearch className="text-3xl" />, title: "Choose Topic", desc: "Select your desired learning area, language, and budget" },
              { icon: <FaRoad className="text-3xl" />, title: "Get Roadmap", desc: "Receive a personalized learning path with curated resources" },
              { icon: <FaChartPie className="text-3xl" />, title: "Track Progress", desc: "Follow your roadmap and mark courses as completed" }
            ].map((step, index) => (
              <motion.div key={index} variants={itemVariants} className="flex flex-col items-center relative z-10">
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-full w-20 h-20 flex items-center justify-center mb-6 shadow-lg relative">
                  <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20"></div>
                  <span className="absolute top-0 right-0 bg-gray-900 w-8 h-8 rounded-full flex items-center justify-center border-2 border-blue-600 text-lg font-bold">
                    {index + 1}
                  </span>
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-gray-300">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Featured Platforms as Badges */}
      <section className="mt-24 px-6 py-12 bg-gray-900 bg-opacity-70 backdrop-blur-md">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-2xl font-semibold mb-10">Courses From Top Learning Platforms</h2>
          <div className="flex flex-wrap justify-center items-center gap-4">
            {["Udemy", "YouTube", "Coursera", "edX", "Khan Academy", "Pluralsight"].map((platform, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0.5 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="px-4 py-2 bg-gray-800 bg-opacity-70 backdrop-blur-sm rounded-full text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition cursor-pointer"
              >
                {platform}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* Chatbot Button */}
      <div className="fixed bottom-8 right-8 z-40">
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1.5, type: "spring", stiffness: 260, damping: 20 }} className="relative group">
          <motion.button
            className="bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 w-16 h-16 rounded-full shadow-xl flex items-center justify-center"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => window.location.href = "/chatbot"}
          >
            <FaComments className="text-2xl" />
            <div className="absolute inset-0 rounded-full bg-blue-500 opacity-30 animate-ping"></div>
          </motion.button>
          <motion.div
            className="absolute -top-12 right-0 bg-gray-900 bg-opacity-70 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 2 }}
            onClick={() => window.location.href = "/chatbot"}
          >
            Ask Cartographer <span className="ml-1">🗺️</span>
          </motion.div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="py-10 bg-gray-950 text-center border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div className="mb-6 md:mb-0">
              <h1 className="text-2xl font-bold tracking-wide uppercase flex items-center justify-center md:justify-start">
                <BiMap className="mr-2 text-blue-500" /> Map-It
              </h1>
              <p className="text-gray-400 mt-2">Your personalized learning journey</p>
            </div>
            <div className="flex gap-6">
              {["About", "Contact", "Privacy", "Terms", "FAQ"].map((item, i) => (
                <a key={i} href={`/${item.toLowerCase()}`} className="text-gray-400 hover:text-white transition">
                  {item}
                </a>
              ))}
            </div>
          </div>
          <div className="pt-6 border-t border-gray-800 text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} Map-It. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );

  function resetFormStates() {
    setNewUsername("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setDeleteConfirmPassword("");
    setDeleteConfirmText("");
    setIsUpdatingUsername(false);
    setIsUpdatingPassword(false);
    setIsDeleting(false);
  }

  async function handleUsernameUpdate(e) {
    e.preventDefault();
    setIsUpdatingUsername(true);
    setSettingsMessage({ type: "", text: "" });
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/user/username', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ newUsername })
      });
      const data = await response.json();
      if (response.ok) {
        setSettingsMessage({ type: 'success', text: 'Username updated successfully!' });
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        setUser(prev => ({ ...prev, username: data.username }));
        setNewUsername("");
      } else {
        setSettingsMessage({ type: 'error', text: data.error || 'Failed to update username' });
      }
    } catch (error) {
      console.error('Error updating username:', error);
      setSettingsMessage({ type: 'error', text: 'An error occurred while updating username' });
    } finally {
      setIsUpdatingUsername(false);
    }
  }

  async function handlePasswordUpdate(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setSettingsMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    setIsUpdatingPassword(true);
    setSettingsMessage({ type: "", text: "" });
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await response.json();
      if (response.ok) {
        setSettingsMessage({ type: 'success', text: 'Password updated successfully!' });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setSettingsMessage({ type: 'error', text: data.error || 'Failed to update password' });
      }
    } catch (error) {
      console.error('Error updating password:', error);
      setSettingsMessage({ type: 'error', text: 'An error occurred while updating password' });
    } finally {
      setIsUpdatingPassword(false);
    }
  }

  async function handleDeleteAccount(e) {
    e.preventDefault();
    if (deleteConfirmText !== "DELETE") {
      setSettingsMessage({ type: 'error', text: 'Please type "DELETE" to confirm' });
      return;
    }
    setIsDeleting(true);
    setSettingsMessage({ type: "", text: "" });
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ password: deleteConfirmPassword })
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        window.location.href = '/signin';
      } else {
        setSettingsMessage({ type: 'error', text: data.error || 'Failed to delete account' });
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      setSettingsMessage({ type: 'error', text: 'An error occurred while deleting account' });
    } finally {
      setIsDeleting(false);
    }
  }
}