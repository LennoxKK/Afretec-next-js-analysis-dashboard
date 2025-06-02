import { useState } from 'react';
import {
  FiMessageSquare,
  FiSettings,
  FiUser,
  FiHelpCircle,
  FiChevronRight,
  FiX,
  FiCopy,
  FiChevronDown,
  FiCheck,
} from 'react-icons/fi';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onShowFullGuide: () => void;
}

const Guide = ({ onShowFullGuide }: { onShowFullGuide: () => void }) => {
  const examples = [
    'Show malaria cases by age using bar chart',
    'Compare cholera and heat stress by gender',
    'Analyze disease patterns during rainy season',
  ];
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="p-4 bg-gray-50 rounded-xl my-4 border border-gray-100">
      <div className="flex items-center mb-3">
        <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 mr-3">
          <FiHelpCircle size={16} />
        </div>
        <h3 className="font-semibold text-sm text-gray-800">Quick Guide</h3>
      </div>
      <p className="text-xs text-gray-500 mb-3">Try one of these queries:</p>

      {examples.map((example, index) => (
        <div key={index} className="relative group mb-2">
          <code className="block bg-white px-3 py-2 pr-8 rounded-lg text-xs font-mono border border-gray-200 text-gray-700 hover:border-indigo-200 transition-colors">
            {example}
          </code>
          <button
            onClick={() => handleCopy(example, index)}
            className="absolute right-2 top-2 p-1 rounded hover:bg-gray-100 transition-colors"
            aria-label="Copy to clipboard"
          >
            {copiedIndex === index ? (
              <FiCheck className="text-green-500" size={14} />
            ) : (
              <FiCopy className="text-gray-400 group-hover:text-gray-600" size={14} />
            )}
          </button>
          {copiedIndex === index && (
            <div className="absolute -right-2 -top-2 bg-green-50 text-green-600 text-xs px-2 py-1 rounded-full shadow-sm animate-fade-in flex items-center">
              <FiCheck size={10} className="mr-1" />
              Copied!
            </div>
          )}
        </div>
      ))}

      <button
        onClick={onShowFullGuide}
        className="text-xs text-indigo-600 hover:text-indigo-700 mt-2 flex items-center font-medium transition-colors"
      >
        View full guide
        <FiChevronRight className="ml-1" size={14} />
      </button>
    </div>
  );
};

const Sidebar = ({ isOpen, onClose, onShowFullGuide }: SidebarProps) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'guide' | 'settings' | 'profile'>('chat');
  const [showQuickGuide, setShowQuickGuide] = useState(true);

  const handleTabClick = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (tab === 'guide') {
      setShowQuickGuide(true);
    }
  };

  return (
    <div
      className={`bg-white shadow-lg transform top-0 left-0 w-72 fixed h-full overflow-auto transition-all duration-300 ease-in-out z-30
      ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
      md:relative md:translate-x-0 flex flex-col border-r border-gray-100`}
    >
      <button
        onClick={onClose}
        className="md:hidden absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <FiX className="text-gray-500" size={18} />
      </button>

      <div className="p-5 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-800 flex items-center">
          <span className="bg-indigo-600 text-white p-1.5 rounded-lg mr-3">
            <FiMessageSquare size={18} />
          </span>
          Disease Analytics
        </h1>
        <p className="text-sm text-gray-500 mt-1">AI-powered Health Insights</p>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => handleTabClick('chat')}
              className={`flex items-center justify-between w-full p-3 rounded-xl transition-all ${
                activeTab === 'chat'
                  ? 'bg-indigo-50 text-indigo-600 font-medium'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <FiMessageSquare className="mr-3" size={18} />
                <span>Chat</span>
              </div>
              {activeTab === 'chat' && <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>}
            </button>
          </li>

          <li>
            <button
              onClick={() => handleTabClick('settings')}
              className={`flex items-center justify-between w-full p-3 rounded-xl transition-all ${
                activeTab === 'settings'
                  ? 'bg-indigo-50 text-indigo-600 font-medium'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <FiSettings className="mr-3" size={18} />
                <span>Settings</span>
              </div>
              {activeTab === 'settings' && <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>}
            </button>
          </li>

          <li>
            <button
              onClick={() => handleTabClick('guide')}
              className={`flex items-center justify-between w-full p-3 rounded-xl transition-all ${
                activeTab === 'guide'
                  ? 'bg-indigo-50 text-indigo-600 font-medium'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <FiHelpCircle className="mr-3" size={18} />
                <span>Guide</span>
              </div>
              <FiChevronDown
                className={`transition-transform duration-200 ${showQuickGuide && activeTab === 'guide' ? 'rotate-180' : ''}`}
                size={16}
              />
            </button>
          </li>
        </ul>

        {activeTab === 'guide' && showQuickGuide && <Guide onShowFullGuide={onShowFullGuide} />}

        {activeTab === 'chat' && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Recent Chats
              </h3>
              <button className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                Clear all
              </button>
            </div>
            <ul className="space-y-1">
              {['Malaria trends analysis', 'Cholera prevention', 'Heat stress cases'].map((chat, i) => (
                <li key={i}>
                  <button className="w-full text-left p-3 text-sm rounded-lg hover:bg-gray-50 text-gray-700 flex items-center justify-between transition-colors">
                    <span className="truncate">{chat}</span>
                    <FiChevronRight className="text-gray-400 ml-2" size={16} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="mt-8">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Preferences
            </h3>
            <div className="space-y-1">
              {['Notification Settings', 'Data & Privacy', 'Appearance'].map((item, i) => (
                <button
                  key={i}
                  className="w-full text-left p-3 text-sm rounded-lg hover:bg-gray-50 text-gray-700 flex items-center justify-between transition-colors"
                >
                  <span>{item}</span>
                  <FiChevronRight className="text-gray-400 ml-2" size={16} />
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
            <FiUser size={18} />
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">User Account</p>
            <p className="text-xs text-gray-500 truncate">Afri · Health</p>
          </div>
          <FiChevronRight className="text-gray-400 ml-2" size={16} />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;