import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { 
  FiHome, 
  FiBarChart2, 
  FiDatabase, 
  FiSettings, 
  FiHelpCircle, 
  FiUsers,
  FiChevronRight,
  FiUser
} from 'react-icons/fi';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const router = useRouter();

  const navItems = [
    { path: '/', name: 'Dashboard', icon: <FiHome className="flex-shrink-0" /> },
    { path: '/analytics', name: 'Analytics', icon: <FiBarChart2 className="flex-shrink-0" /> },
    { path: '/data', name: 'Raw Data', icon: <FiDatabase className="flex-shrink-0" /> },
    { path: '/responders', name: 'Responders', icon: <FiUsers className="flex-shrink-0" /> },
  ];

  const secondaryItems = [
    { path: '/settings', name: 'Settings', icon: <FiSettings className="flex-shrink-0" /> },
    { path: '/help', name: 'Help Center', icon: <FiHelpCircle className="flex-shrink-0" /> },
  ];

  const isActive = (path: string) => router.pathname === path;

  return (
    <motion.aside
      initial={{ x: -300 }}
      animate={{ x: isOpen ? 0 : -300 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-xl border-r border-gray-200 flex flex-col lg:static lg:translate-x-0`}
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">DT</span>
            </div>
            <h1 className="text-lg font-semibold text-gray-900">DiseaseTrack</h1>
          </div>
          <button 
            onClick={toggleSidebar}
            className="p-1 rounded-md text-gray-500 hover:bg-gray-100 lg:hidden"
          >
            <FiChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
          Main
        </h2>
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <button
                onClick={() => router.push(item.path)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive(item.path)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className={`${isActive(item.path) ? 'text-blue-500' : 'text-gray-400'}`}>
                  {item.icon}
                </span>
                <span>{item.name}</span>
              </button>
            </li>
          ))}
        </ul>

        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-6 mb-2 px-2">
          Preferences
        </h2>
        <ul className="space-y-1">
          {secondaryItems.map((item) => (
            <li key={item.path}>
              <button
                onClick={() => router.push(item.path)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive(item.path)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className={`${isActive(item.path) ? 'text-blue-500' : 'text-gray-400'}`}>
                  {item.icon}
                </span>
                <span>{item.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <FiUser className="w-5 h-5 text-gray-500" />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">John Doe</p>
            <p className="text-xs text-gray-500">Administrator</p>
          </div>
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;