import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FiMenu, FiX } from 'react-icons/fi';
import Sidebar from './components/Sidebar';
import FullGuide from './components/FullGuide';
import { handleSendMessage } from './src/utils/chatUtils';
import { API_CONFIG } from './api/config/endpoints';
import { v4 as uuidv4 } from 'uuid';
import { Chat } from './components/Chat';
import { Message, ChartData } from './src/types/chat';





const ChatApp = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [charts, setCharts] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFullGuide, setShowFullGuide] = useState(false);
  const processedChartIds = useRef<Set<string>>(new Set());

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
      if (!isMobileView) {
        setIsSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  // Process charts data
  useEffect(() => {
    if (charts.length === 0) return;

    const newChartMessages: Message[] = [];
    
    charts.forEach(chart => {
      if (!processedChartIds.current.has(chart.id)) {
        processedChartIds.current.add(chart.id);
        
        chart.chartTypes.forEach(chartType => {
          newChartMessages.push({
            id: uuidv4(),
            sender: 'bot',
            type: 'chart',
            text: `📊 ${chartType} chart for "${chart.title}"`,
            timestamp: new Date(),
            chartData: {
              ...chart,
              chartTypes: chart.chartTypes,
              chartType: chartType
            },
          });
        });
      }
    });

    if (newChartMessages.length > 0) {
      setMessages(prev => [...prev, ...newChartMessages]);
    }
    
    setCharts([]);
  }, [charts]);

  const handleSendMessageWrapper = useCallback(
    async (input: string) => {
      setIsLoading(true);
      
      const userMessage: Message = {
        id: uuidv4(),
        sender: 'user',
        type: 'text',
        text: input,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);

      const typingMessage: Message = {
        id: uuidv4(),
        sender: 'bot',
        type: 'typing',
        text: '',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, typingMessage]);

      try {
        await handleSendMessage({
          input,
          setMessages: (updateFn) => {
            setMessages((prev) => {
              const withoutTyping = prev.filter(msg => msg.type !== 'typing');
              return typeof updateFn === 'function' ? updateFn(withoutTyping) : updateFn;
            });
          },
          setInput: () => {},
          apiEndpoint: API_CONFIG.chatEndpoint,
          onChartData: (newCharts) => {
            const chartsWithIds = newCharts.map((chart) => ({
              ...chart,
              id: uuidv4(),
            }));
            
            setCharts(chartsWithIds);
          },
        });
      } catch (error) {
        console.error('Error sending message:', error);
        setMessages((prev) => {
          const withoutTyping = prev.filter(msg => msg.type !== 'typing');
          return [
            ...withoutTyping,
            {
              id: uuidv4(),
              sender: 'bot',
              type: 'text',
              text: 'Sorry, I encountered an error while processing your request. Please try again.',
              timestamp: new Date(),
            },
          ];
        });
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 overflow-hidden">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        onShowFullGuide={() => {
          setIsSidebarOpen(false);
          setShowFullGuide(true);
        }}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={toggleSidebar}
              className="md:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none transition-colors"
              aria-label="Toggle Sidebar"
            >
              {isSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
            <h1 className="text-lg font-semibold hidden md:block">Disease Analytics</h1>
            <h2 className="text-lg font-semibold block md:hidden">Disease Analytics Assistant</h2>
            {showFullGuide && (
              <button
                onClick={() => setShowFullGuide(false)}
                className="flex items-center text-sm text-indigo-600 hover:text-indigo-800"
              >
                <FiX className="mr-1" /> Close Guide
              </button>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto relative">
          {showFullGuide ? (
            <div className="absolute inset-0 bg-white z-10 p-4 md:p-6">
              <FullGuide onClose={() => setShowFullGuide(false)} />
            </div>
          ) : (
            <Chat 
              messages={messages} 
              onSendMessage={handleSendMessageWrapper} 
              isLoading={isLoading} 
            />
          )}
        </main>
      </div>

      {/* Mobile overlay */}
      {isSidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default ChatApp;