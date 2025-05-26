import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AnimatedChatInterface = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);

  // Sample data for charts
  const barData = [
    { name: 'Jan', malaria: 45, cholera: 23 },
    { name: 'Feb', malaria: 52, cholera: 18 },
    { name: 'Mar', malaria: 38, cholera: 31 },
    { name: 'Apr', malaria: 61, cholera: 26 },
    { name: 'May', malaria: 33, cholera: 19 }
  ];

  const pieData = [
    { name: 'Age 0-18', value: 35, color: '#3b82f6' },
    { name: 'Age 19-35', value: 28, color: '#10b981' },
    { name: 'Age 36-50', value: 22, color: '#f59e0b' },
    { name: 'Age 50+', value: 15, color: '#ef4444' }
  ];

  const lineData = [
    { month: 'Jan', trend: 68 },
    { month: 'Feb', trend: 70 },
    { month: 'Mar', trend: 69 },
    { month: 'Apr', trend: 87 },
    { month: 'May', trend: 52 }
  ];

  // Animated chat simulation
  const simulateChat = async () => {
    setLoading(true);
    setIsAnimating(true);
    setChatMessages([]);

    const userQuery = query.trim() || "Show me the correlation between Malaria, Cholera and age/gender using bar and line charts";

    // User message appears
    setTimeout(() => {
      setChatMessages([{
        type: 'user',
        content: userQuery,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 500);

    // Bot typing indicator
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        type: 'bot',
        content: 'typing',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1500);

    // Bot response with analysis
    setTimeout(() => {
      setChatMessages(prev => prev.map(msg => 
        msg.content === 'typing' 
          ? {
              ...msg,
              content: 'analysis',
              analysis: {
                correlation: 0.72,
                pValue: 0.003,
                significance: 'High',
                recommendation: 'Strong correlation detected between age groups and disease prevalence'
              }
            }
          : msg
      ));
    }, 3000);

    // Charts appear
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        type: 'bot',
        content: 'charts',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 4000);

    setLoading(false);
    setTimeout(() => setIsAnimating(false), 4500);
  };

  // Auto-play animation on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      simulateChat();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = () => {
    simulateChat();
  };

  // Restart animation every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        simulateChat();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [loading]);

  const TypingIndicator = () => (
    <div className="flex items-center space-x-1 p-3">
      <div className="flex space-x-1">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
      <span className="text-sm text-gray-500 ml-2">Analyzing data...</span>
    </div>
  );

  const ChatMessage = ({ message, index }) => {
    const isUser = message.type === 'user';
    
    return (
      <div
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 animate-fadeInUp`}
        style={{ animationDelay: `${index * 0.2}s` }}
      >
        <div className={`max-w-4xl ${isUser ? 'order-2' : 'order-1'}`}>
          <div className={`flex items-end space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
              isUser ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-gray-700 to-gray-900'
            }`}>
              {isUser ? (
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
            </div>

            {/* Message content */}
            <div className={`rounded-2xl px-6 py-4 shadow-lg backdrop-blur-sm ${
              isUser 
                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white' 
                : 'bg-white/90 border border-gray-200 text-gray-800'
            }`}>
              {message.content === 'typing' ? (
                <TypingIndicator />
              ) : message.content === 'analysis' ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-semibold text-lg">Analysis Complete</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="font-medium text-blue-900">Correlation</div>
                      <div className="text-2xl font-bold text-blue-700">{message.analysis.correlation}</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="font-medium text-green-900">P-Value</div>
                      <div className="text-2xl font-bold text-green-700">{message.analysis.pValue}</div>
                    </div>
                  </div>
                  <div className="bg-amber-50 p-3 rounded-lg">
                    <div className="font-medium text-amber-900 mb-1">Key Insight</div>
                    <div className="text-sm text-amber-800">{message.analysis.recommendation}</div>
                  </div>
                </div>
              ) : message.content === 'charts' ? (
                <div className="space-y-6">
                  <div className="text-lg font-semibold mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                    </svg>
                    Visual Analysis
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Bar Chart */}
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <h4 className="font-medium mb-3 text-gray-700">Disease Cases by Month</h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={barData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="name" fontSize={12} />
                          <YAxis fontSize={12} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              border: '1px solid #e5e7eb', 
                              borderRadius: '8px',
                              fontSize: '14px'
                            }} 
                          />
                          <Bar dataKey="malaria" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="cholera" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Pie Chart */}
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <h4 className="font-medium mb-3 text-gray-700">Age Distribution</h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={80}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              border: '1px solid #e5e7eb', 
                              borderRadius: '8px',
                              fontSize: '14px'
                            }} 
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Line Chart */}
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <h4 className="font-medium mb-3 text-gray-700">Trend Analysis</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={lineData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="month" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e5e7eb', 
                            borderRadius: '8px',
                            fontSize: '14px'
                          }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="trend" 
                          stroke="#f59e0b" 
                          strokeWidth={3}
                          dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="text-sm leading-relaxed">
                  {message.content}
                </div>
              )}
              
              <div className={`text-xs mt-2 opacity-70 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                {message.timestamp}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 mb-4">
            AI Data Analysis Studio
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Professional data insights with interactive visualizations and real-time analysis
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Query Input Section */}
          <div className="order-2 xl:order-1">
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-8 border border-white/50 hover:shadow-2xl transition-all duration-300">
              <div className="space-y-6">
                <div className="flex items-center mb-6">
                  <div className="p-3 mr-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Query Interface</h2>
                    <p className="text-gray-600">Describe your data analysis needs</p>
                  </div>
                </div>
                
                <div className="relative">
                  <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., Show me the correlation between Malaria, Cholera and age/gender using bar and line charts with statistical analysis"
                    className="w-full px-6 py-4 rounded-2xl border-2 border-gray-200 focus:border-blue-400 bg-gray-50 focus:bg-white text-gray-900 transition-all duration-300 resize-none placeholder:text-gray-400 outline-none"
                    rows="4"
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading || !query.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing Analysis...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Start Analysis
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Chat Interface Section */}
          <div className="order-1 xl:order-2">
            <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl border border-white/50 h-[600px] flex flex-col overflow-hidden">
              {/* Chat Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-t-3xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <h3 className="font-semibold">AI Data Analyst</h3>
                  </div>
                  <div className="text-sm opacity-75">Live Analysis</div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {chatMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p className="text-lg font-medium">Ready for Analysis</p>
                      <p className="text-sm">Submit your query to see the AI in action</p>
                    </div>
                  </div>
                ) : (
                  chatMessages.map((message, index) => (
                    <ChatMessage key={index} message={message} index={index} />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default AnimatedChatInterface;