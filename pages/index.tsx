import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { toPng, toJpeg, toBlob, toPixelData, toSvg } from 'html-to-image';
import { motion } from 'framer-motion'

const Dashboard = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [chartConfig, setChartConfig] = useState(null);
  const [description, setDescription] = useState('');
  const [summary, setSummary] = useState(null);
  const [groupedResponses, setGroupedResponses] = useState({});

  useEffect(() => {
    fetch('/api/diseases-groups')
      .then(res => res.json())
      .then(data => {
        setGroupedResponses(data);  // This replaces the mockData!
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading real data:', err);
        setLoading(false);
      });
  }, []);
  


  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch('/api/data?type=summary');
        if (!res.ok) throw new Error('Failed to fetch summary data');
        const json = await res.json();
        setSummary(json.data);
      } catch (err) {
        console.error('Error loading summary:', err);
        // Optional: fallback/default
        setSummary({
          totalDiseases: 0,
          totalResponders: 0,
          diseases: []
        });
      }
    };
  
    fetchSummary();
  }, []);
  //Download charts function
  const downloadChart = async (chartId: string, fileName: string) => {
    const chartElement = document.getElementById(chartId);
    if (!chartElement) return;
  
    try {
      const dataUrl = await toPng(chartElement);
      const link = document.createElement('a');
      link.download = `${fileName}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error downloading chart:', error);
    }
  };


  const generateChartData = async (config: { diseases: string[], variables: string[] }) => {
    const { diseases, variables } = config;
    
    if (diseases.length === 0 || variables.length === 0) {
      return null;
    }
  
    try {
      // Call the API endpoint with proper parameters
      const response = await fetch(`/api/data?type=analytics&diseases=${encodeURIComponent(diseases.join(','))}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch analytics data');
      }
  
      const { data } = await response.json();
      console.log(data)
      
      // The API already processes the data, so we can return it directly
      return data;
    } catch (error) {
      console.error('Error generating chart data:', error);
      throw new Error(error.message || 'Failed to generate chart data. Please try again later.');
    }
  };

  const createChartConfig = (data, config) => {
    const { diseases, variables, chartTypes } = config;
    const charts = [];

    chartTypes.forEach((chartType) => {
      variables.forEach(variable => {
        const chartData = [];
        
        // Get all unique categories for this variable
        const categories = diseases.length > 0 
          ? Object.keys(data[diseases[0]][variable] || {})
          : [];

        categories.forEach(category => {
          const dataPoint = { name: category };
          diseases.forEach(disease => {
            if (data[disease] && data[disease][variable]) {
              dataPoint[disease] = data[disease][variable][category] || 0;
            }
          });
          chartData.push(dataPoint);
        });

        // For pie chart, we need different data format
        if (chartType === 'pie') {
          // Create separate pie chart for each disease
          diseases.forEach(disease => {
            if (data[disease] && data[disease][variable]) {
              const pieData = Object.entries(data[disease][variable]).map(([key, value]) => ({
                name: key,
                value: value
              }));

              charts.push({
                type: chartType,
                variable,
                disease,
                data: pieData,
                title: `${disease.charAt(0).toUpperCase() + disease.slice(1)} Distribution by ${variable.charAt(0).toUpperCase() + variable.slice(1)}`
              });
            }
          });
        } else {
          charts.push({
            type: chartType,
            variable,
            data: chartData,
            diseases,
            title: `${variable.charAt(0).toUpperCase() + variable.slice(1)} Distribution by Disease (${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart)`
          });
        }
      });
    });

    return charts;
  };

  const handleSubmit = async () => {
    if (!query.trim()) return;
  
    setLoading(true);
    
    try {
      // First, use OpenAI to analyze and potentially correct the query
      const analyzedQuery = await analyzeQuery(query);
      
      // Then parse the analyzed/corrected query
      const config = await parseQueryWithAI(analyzedQuery);
      
      if (config.diseases.length === 0 && config.variables.length === 0) {
        // General query - use AI to generate response
        const aiResponse = await getAIResponse(analyzedQuery);
        setResponse(aiResponse);
        setChartData(null);
        setChartConfig(null);
        setDescription('');
      } else {
        // Data visualization query
        const data = await generateChartData(config);
        
        if (data) {
          const charts = createChartConfig(data, config);
          const desc = await generateDescriptionWithAI(config, data);
          
          setChartData(data);
          setChartConfig(charts);
          setDescription(desc);
          setResponse('');
        } else {
          setResponse('Sorry, I could not generate the requested visualization. Please check your query and try again.');
          setChartData(null);
          setChartConfig(null);
          setDescription('');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setResponse('Sorry, there was an error processing your request. Please try again later.');
      setChartData(null);
      setChartConfig(null);
      setDescription('');
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to analyze and potentially correct the query
  const analyzeQuery = async (query) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Please analyze and correct this query for disease data visualization if needed: "${query}". 
          Return only the corrected query without any additional explanation.`
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
  
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format');
      }
  
      const data = await response.json();
      return data.reply || query; // Fallback to original query if API fails
    } catch (error) {
      console.error('Error analyzing query:', error);
      return query; // Fallback to original query
    }
  };

// AI-powered query parser
const parseQueryWithAI = async (query) => {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Extract visualization parameters from: "${query}"`,
        isJSONRequest: true
      }),
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    // Handle both string and object responses
    let jsonString = typeof data.reply === 'string' ? data.reply : JSON.stringify(data.reply);
    
    // Clean the response if it's a string
    if (typeof jsonString === 'string') {
      jsonString = jsonString.replace(/```json|```/g, '').trim();
    }

    // Try to parse the JSON response
    try {
      const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      return {
        diseases: Array.isArray(parsed.diseases) ? parsed.diseases : [],
        variables: Array.isArray(parsed.variables) ? parsed.variables : [],
        chartTypes: Array.isArray(parsed.chartTypes) ? parsed.chartTypes : ['bar']
      };
    } catch (e) {
      console.error('Error parsing AI response:', e);
      console.error('Original response:', data.reply);
      return { diseases: [], variables: [], chartTypes: ['bar'] };
    }
  } catch (error) {
    console.error('Error parsing query with AI:', error);
    return { diseases: [], variables: [], chartTypes: ['bar'] };
  }
};

// Get AI response for general questions
const getAIResponse = async (query) => {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `User asked: "${query}". 
        Please provide a helpful response about disease data analysis.`
      }),
    });
    
    const data = await response.json();
    return data.reply || 'I could not generate a response. Please try again.';
  } catch (error) {
    console.error('Error getting AI response:', error);
    return 'Sorry, there was an error generating a response.';
  }
};

// AI-powered description generator
const generateDescriptionWithAI = async (config, data) => {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Generate a concise description for this data visualization:
        Diseases: ${config.diseases.join(', ')}
        Variables: ${config.variables.join(', ')}
        Chart Types: ${config.chartTypes.join(', ')}
        Data Summary: ${JSON.stringify(data.summary)}`
      }),
    });
    
    const result = await response.json();
    return result.reply || '';
  } catch (error) {
    console.error('Error generating description:', error);
    return '';
  }
};

  const renderChart = (chart, index) => {
    const chartId = `chart-${index}-${Date.now()}`;
    const fileName = chart.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  
    return (
      <div key={index} className="bg-white p-6 rounded-lg shadow-lg mb-6 relative group">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            {chart.title}
          </h3>
          <div 
            onClick={() => downloadChart(chartId, fileName)}
            className="p-2 rounded-full hover:bg-gray-100 cursor-pointer transition-colors"
            title="Download Chart"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-gray-500 hover:text-blue-500 transition-colors" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" 
                clipRule="evenodd" 
              />
            </svg>
          </div>
        </div>
        <div className="h-96" id={chartId}>
          <ResponsiveContainer width="100%" height="100%">
            {chart.type === 'bar' && (
              <BarChart data={chart.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                {chart.diseases.map((disease, idx) => (
                  <Bar 
                    key={disease} 
                    dataKey={disease} 
                    fill={colors[idx % colors.length]}
                    name={`${disease.charAt(0).toUpperCase() + disease.slice(1)} Cases`}
                  />
                ))}
              </BarChart>
            )}
            {chart.type === 'line' && (
              <LineChart data={chart.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                {chart.diseases.map((disease, idx) => (
                  <Line 
                    key={disease} 
                    type="monotone" 
                    dataKey={disease} 
                    stroke={colors[idx % colors.length]}
                    strokeWidth={3}
                    name={`${disease.charAt(0).toUpperCase() + disease.slice(1)} Cases`}
                  />
                ))}
              </LineChart>
            )}
            {chart.type === 'pie' && (
              <PieChart>
                <Pie
                  data={chart.data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chart.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    );
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
<div className="container mx-auto px-4 py-8">
        {/* Sidebar */}

        {/* Header */}

        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="relative">
            {/* Glass morphism background */}
            <div className="absolute inset-0 bg-white/30 backdrop-blur-lg rounded-3xl -z-10" />
            
            {/* Decorative elements */}
            <div className="absolute top-0 left-1/4 w-16 h-16 bg-blue-400/10 rounded-full filter blur-xl" />
            <div className="absolute bottom-0 right-1/4 w-20 h-20 bg-purple-400/10 rounded-full filter blur-xl" />
            
            <div className="p-8 rounded-2xl bg-gradient-to-br from-white/50 to-white/20 border border-white/30 shadow-lg">
              <motion.h1 
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-blue-600 mb-3"
              >
                Disease Data Analysis Dashboard
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="text-xl text-gray-700/90 font-medium"
              >
                <span className="inline-block relative">
                  Analyze disease patterns with
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-400/30 animate-pulse" />
                </span>
                <span className="inline-flex ml-2 items-center bg-blue-100/50 text-blue-600 px-3 py-1 rounded-full text-sm font-semibold">
                  AI-powered
                  <svg 
                    className="w-4 h-4 ml-1 animate-bounce" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </span>
                <span className="inline-block relative ml-2">
                  insights
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-purple-400/30 animate-pulse delay-100" />
                </span>
              </motion.p>
            </div>
          </div>
          
          {/* Animated decorative dots */}
          <div className="flex justify-center mt-6 space-x-2">
            {[1, 2, 3].map((dot) => (
              <motion.div
                key={dot}
                animate={{ y: [0, -5, 0] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: "loop",
                  delay: dot * 0.2
                }}
                className="w-2 h-2 bg-gray-400/50 rounded-full"
              />
            ))}
          </div>
        </motion.div>


        {/* Summary Statistics */}
        {summary && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            {/* Total Diseases */}
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-6 border border-white/30 hover:shadow-md transition-all"
            >
              <div className="flex items-center">
                <motion.div 
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="p-3 rounded-xl bg-blue-100/50 text-blue-600 backdrop-blur-sm"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </motion.div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Diseases</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.totalDiseases}</p>
                </div>
              </div>
              <div className="mt-4 h-1 bg-gradient-to-r from-blue-400/20 to-transparent rounded-full"></div>
            </motion.div>
          
            {/* Total Responders */}
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-6 border border-white/30 hover:shadow-md transition-all"
            >
              <div className="flex items-center">
                <motion.div 
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="p-3 rounded-xl bg-green-100/50 text-green-600 backdrop-blur-sm"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                    />
                  </svg>
                </motion.div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Responders</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.totalResponders}</p>
                </div>
              </div>
              <div className="mt-4 h-1 bg-gradient-to-r from-green-400/20 to-transparent rounded-full"></div>
            </motion.div>
          
            {/* Active Surveys */}
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-6 border border-white/30 hover:shadow-md transition-all"
            >
              <div className="flex items-center">
                <motion.div 
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="p-3 rounded-xl bg-purple-100/50 text-purple-600 backdrop-blur-sm"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </motion.div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Surveys</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.diseases?.length || 0}</p>
                </div>
              </div>
              <div className="mt-4 h-1 bg-gradient-to-r from-purple-400/20 to-transparent rounded-full"></div>
            </motion.div>
          
            {/* Total Responses */}
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-6 border border-white/30 hover:shadow-md transition-all"
            >
              <div className="flex items-center">
                <motion.div 
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="p-3 rounded-xl bg-yellow-100/50 text-yellow-600 backdrop-blur-sm"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M3 10h11M9 21V3m12 6h-4m4 4h-4m4 4h-4"
                    />
                  </svg>
                </motion.div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Responses</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.totalResponses}</p>
                </div>
              </div>
              <div className="mt-4 h-1 bg-gradient-to-r from-yellow-400/20 to-transparent rounded-full"></div>
            </motion.div>
          </motion.div>
        )}

        {/* Disease Overview */}

        {/* Disease Overview */}
        {summary && summary.diseases && (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm p-6 mb-8 border border-gray-100 transition-all duration-300 hover:shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                Disease Overview
              </h2>
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-blue-50 text-blue-600 animate-pulse">
                {summary.diseases.length} {summary.diseases.length > 1 ? 'Diseases' : 'Disease'} Tracked
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {summary.diseases.map((disease, index) => (
                <motion.div 
                  key={disease.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                  className="border border-gray-100 rounded-xl p-5 bg-white hover:bg-gray-50 transition-all duration-200 group"
                >
                  <div className="flex items-start mb-3">
                    <div className="p-2 rounded-lg bg-blue-100/50 group-hover:bg-blue-100 transition-colors duration-200 mr-3">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 capitalize mt-1">{disease.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 pl-11">
                    {disease.description || 'Climate-related health condition being actively monitored.'}
                  </p>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                    <button className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center">
                      Learn more
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}


      {/* Query Input */}
      <div className="flex flex-col md:flex-row gap-8 items-center">
  {/* Chat Illustration SVG */}
  <div className="hidden md:block w-full md:w-1/2 lg:w-2/5">
    <svg viewBox="0 0 500 400" className="w-full h-auto">
      {/* Background bubble */}
      <defs>
        <linearGradient id="bubbleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f0f9ff" />
          <stop offset="100%" stopColor="#e0f2fe" />
        </linearGradient>
        <filter id="softGlow" height="300%" width="300%" x="-75%" y="-75%">
          <feGaussianBlur stdDeviation="8" result="blurred" />
        </filter>
      </defs>
      
      {/* Main chat bubble */}
      <path 
        d="M100,50 C50,50 20,80 20,130 C20,180 50,210 100,210 L120,230 L130,210 L380,210 C430,210 460,180 460,130 C460,80 430,50 380,50 L100,50 Z" 
        fill="url(#bubbleGradient)" 
        stroke="#bfdbfe" 
        strokeWidth="2"
        className="shadow-xl"
      />
      
      {/* User message */}
      <rect x="300" y="80" rx="12" ry="12" width="140" height="40" fill="#3b82f6" opacity="0.9" />
      <text x="370" y="105" fontFamily="'Inter', sans-serif" fontSize="14" fill="white" textAnchor="middle" fontWeight="500">Show me the data</text>
      
      {/* Bot message */}
      <rect x="60" y="80" rx="12" ry="12" width="200" height="80" fill="white" opacity="0.9" />
      <text x="70" y="100" fontFamily="'Inter', sans-serif" fontSize="14" fill="#1f2937" fontWeight="500">
        <tspan x="70" dy="1.2em">Here's your analysis:</tspan>
        <tspan x="70" dy="1.2em">• Correlation: 0.72</tspan>
        <tspan x="70" dy="1.2em">• P-value: 0.003</tspan>
      </text>
      
      {/* Bot avatar */}
      <circle cx="60" cy="120" r="20" fill="#6366f1" />
      <path d="M50,115 A10,10 0 0,1 70,115 M50,125 A10,10 0 0,0 70,125 M60,130 A5,5 0 0,0 60,140" 
        stroke="white" 
        strokeWidth="2" 
        fill="none"
      />
      
      {/* User avatar */}
      <circle cx="440" cy="100" r="20" fill="#10b981" />
      <circle cx="435" cy="95" r="2" fill="white" />
      <circle cx="445" cy="95" r="2" fill="white" />
      <path d="M435,110 Q440,115 445,110" stroke="white" strokeWidth="2" fill="none" />
      
      {/* Decorative elements */}
      <circle cx="400" cy="60" r="8" fill="#60a5fa" opacity="0.3" filter="url(#softGlow)" />
      <circle cx="80" cy="180" r="12" fill="#818cf8" opacity="0.3" filter="url(#softGlow)" />
      <path d="M200,40 Q220,20 240,40" stroke="#93c5fd" strokeWidth="2" fill="none" opacity="0.5" />
    </svg>
  </div>

  {/* Query Input - Right Side */}
  <div className="w-full md:w-1/2 lg:w-3/5">
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-8 border border-white/30 group transition-all duration-300 hover:shadow-2xl hover:border-white/50"
    >
      <div className="space-y-6">
        <div>
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="flex items-center mb-4"
          >
            <div className="p-2 mr-3 bg-blue-100/50 rounded-xl backdrop-blur-sm">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <label htmlFor="query" className="block text-xl font-semibold text-gray-800 tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600">
              Ask anything or request a visualization
            </label>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.005 }}
            className="relative"
          >
            <textarea
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., Show me the correlation between Malaria, Cholera and age/gender using bar and line charts"
              className="w-full px-6 py-4 rounded-2xl border border-gray-200/80 focus:border-2 focus:border-blue-400/70 bg-white/70 focus:bg-white/90 text-gray-900 shadow-inner transition-all duration-300 resize-none placeholder:text-gray-400/80 outline-none ring-0 focus:ring-2 focus:ring-blue-200/30"
              rows="4"
            />
            <div className="absolute inset-0 rounded-2xl pointer-events-none border border-white/50 mix-blend-overlay"></div>
          </motion.div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={loading}
          className="w-full relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-70 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          {loading ? (
            <span className="flex items-center justify-center relative z-10">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Processing...
            </span>
          ) : (
            <span className="flex items-center justify-center relative z-10">
              <svg 
                className="w-5 h-5 mr-2 animate-bounce" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Analyze Data
            </span>
          )}
        </motion.button>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-300/10 rounded-full filter blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-300/10 rounded-full filter blur-3xl -z-10"></div>
    </motion.div>
  </div>
</div>
      {/* Results */}
      {response && (
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-md p-6 mb-8 border border-gray-100">
          <div className="flex items-center mb-4">
            <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-800">Visualization Guide</h2>
          </div>

          <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
            <p>To create effective disease data visualizations, please specify:</p>
            
            <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
              <h3 className="font-medium text-blue-700 mb-2">1. Disease Names</h3>
              <p>Select from: <span className="font-medium">malaria</span>, <span className="font-medium">cholera</span>, or <span className="font-medium">heat stress</span></p>
            </div>

            <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
              <h3 className="font-medium text-blue-700 mb-2">2. Variables</h3>
              <p>Choose from: <span className="font-medium">age</span> (above/below 35), <span className="font-medium">gender</span>, or <span className="font-medium">season</span> (rainy/dry)</p>
            </div>

            <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
              <h3 className="font-medium text-blue-700 mb-2">3. Chart Types</h3>
              <p>Available: <span className="font-medium">bar</span>, <span className="font-medium">line</span>, or <span className="font-medium">pie</span> charts (default: bar)</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-gray-700">Example Request</h3>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText('"Show malaria cases by age and gender using pie charts"');
                    // Add toast notification here if needed
                  }}
                  className="text-xs flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copy
                </button>
              </div>
              <div className="relative">
                <pre className="text-sm bg-white p-3 rounded border border-gray-200 overflow-x-auto">
                  "Show malaria cases by age and gender using pie charts"
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* Charts */}
        {chartConfig && chartConfig.length > 0 && (
          <div>
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Visualization Description:</h2>
              <p className="text-gray-700">{description}</p>
            </div>
            
            {chartConfig.map((chart, index) => renderChart(chart, index))}
          </div>
        )}

        {/* Instructions */}

      <div className="bg-white rounded-xl shadow-lg p-6 mt-8 border border-gray-100 transform transition-all hover:scale-[1.01] hover:shadow-xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <svg 
            className="w-6 h-6 text-blue-500 mr-2 animate-pulse" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          How to Use This Tool
        </h2>
        
        <div className="space-y-4 text-gray-700">
          {/* Data Visualization Section */}
          <div className="p-4 bg-blue-50 rounded-lg animate-fade-in group relative">
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => navigator.clipboard.writeText('Show correlation between Malaria, Cholera and age/gender using bar and line charts')}
                className="text-xs flex items-center px-2 py-1 bg-white/90 rounded-md border border-gray-200 shadow-sm hover:bg-blue-50 transition-all"
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copy
              </button>
            </div>
            <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
              </svg>
              Data Visualization
            </h3>
            <p className="text-gray-800">Include diseases (<span className="font-medium">malaria, cholera, heat stress</span>), variables (<span className="font-medium">age, gender, season</span>), and chart types (<span className="font-medium">bar, line, pie</span>) in your query.</p>
            <div className="mt-3 p-3 bg-white rounded-md border border-blue-100 animate-pulse-slow flex justify-between items-center">
              <p className="text-sm font-mono text-blue-600">
                <span className="text-gray-500">Example:</span> "Show correlation between Malaria, Cholera and age/gender using bar and line charts"
              </p>
              <button 
                onClick={() => navigator.clipboard.writeText('Show correlation between Malaria, Cholera and age/gender using bar and line charts')}
                className="text-xs flex items-center px-2 py-1 ml-2 bg-blue-50 rounded border border-blue-100 hover:bg-blue-100 transition-colors"
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copy
              </button>
            </div>
          </div>

          {/* General Questions Section */}
          <div className="p-4 bg-green-50 rounded-lg animate-fade-in delay-100">
            <h3 className="font-semibold text-green-800 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              General Questions
            </h3>
            <p className="text-gray-800">Ask any question about the data or diseases. The system will analyze available information and provide insights.</p>
          </div>

          {/* Variables Explained Section */}
          <div className="p-4 bg-purple-50 rounded-lg animate-fade-in delay-200">
            <h3 className="font-semibold text-purple-800 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 1a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm4-4a1 1 0 100 2h.01a1 1 0 100-2H13zM9 9a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zM7 8a1 1 0 000 2h.01a1 1 0 000-2H7z" clipRule="evenodd" />
              </svg>
              Variables Explained
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="inline-block bg-white p-1 rounded-full mr-2 border border-purple-200">
                  <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <circle cx="10" cy="10" r="5" />
                  </svg>
                </span>
                <span><strong className="text-gray-900">Age:</strong> Above 35 years vs Below 35 years</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block bg-white p-1 rounded-full mr-2 border border-purple-200">
                  <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <circle cx="10" cy="10" r="5" />
                  </svg>
                </span>
                <span><strong className="text-gray-900">Gender:</strong> Male vs Female</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block bg-white p-1 rounded-full mr-2 border border-purple-200">
                  <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <circle cx="10" cy="10" r="5" />
                  </svg>
                </span>
                <span><strong className="text-gray-900">Season:</strong> Rainy Season (April-October) vs Dry Season (November-March)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Dashboard;