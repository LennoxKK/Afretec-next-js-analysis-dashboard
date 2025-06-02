import { useState } from 'react';
import { FiX, FiCopy, FiArrowLeft } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const FullGuide = ({ onClose }: { onClose: () => void }) => {
  const [activeSection, setActiveSection] = useState<'usage' | 'examples' | 'variables'>('usage');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const examples = [
    "Show malaria cases by age using bar chart",
    "Compare cholera and heat stress by gender",
    "Analyze disease patterns during rainy season"
  ];

  const variableMappings = [
    {
      variable: "Age",
      question: "Are you older than 35 years old?",
      mapping: "Above 35 / Below 35"
    },
    {
      variable: "Gender",
      question: "Are you a Male or Female?",
      mapping: "Male / Female"  
    },
    {
      variable: "Season",
      question: "Are you treated more during rainy season?",
      mapping: "Rainy Season / Dry Season"
    }
  ];

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-lg shadow-xl max-w-4xl mx-auto h-full flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-blue-50">
        <motion.button 
          onClick={onClose}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <FiArrowLeft className="text-gray-600" />
        </motion.button>
        <h2 className="text-xl font-bold text-indigo-700">Analytics Guide</h2>
        <motion.button 
          onClick={onClose}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <FiX className="text-gray-600" />
        </motion.button>
      </div>

      {/* Navigation */}
      <div className="flex border-b border-gray-200 bg-white">
        {(['usage', 'examples', 'variables'] as const).map((section) => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={`flex-1 py-3 text-sm font-medium relative ${
              activeSection === section ? 'text-indigo-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {section.charAt(0).toUpperCase() + section.slice(1)}
            {activeSection === section && (
              <motion.div 
                layoutId="underline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 bg-gray-50">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeSection === 'usage' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">How to Use the Analytics Tool</h3>
                <div className="space-y-6">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
                  >
                    <h4 className="font-medium text-gray-800 mb-3">1. Data Visualization Queries</h4>
                    <p className="text-gray-600 mb-3">
                      Structure your queries to include these key elements:
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <span className="inline-block bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded mr-2 mt-0.5">Diseases</span>
                        <span className="text-gray-600">malaria, cholera, heat stress</span>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-block bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded mr-2 mt-0.5">Variables</span>
                        <span className="text-gray-600">age, gender, season</span>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-block bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded mr-2 mt-0.5">Chart Types</span>
                        <span className="text-gray-600">bar, line, pie</span>
                      </li>
                    </ul>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
                  >
                    <h4 className="font-medium text-gray-800 mb-2">2. General Questions</h4>
                    <p className="text-gray-600">
                      You can ask about disease trends, correlations between variables, or request statistical insights.
                    </p>
                  </motion.div>
                </div>
              </div>
            )}

            {activeSection === 'examples' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Example Queries</h3>
                <p className="text-gray-600 mb-5">Try these example queries (click to copy):</p>
                
                <div className="space-y-3">
                  {examples.map((example, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative group"
                    >
                      <div className="bg-white p-3 pl-4 pr-10 rounded-lg text-sm font-mono border border-gray-200 hover:border-indigo-300 transition-colors shadow-sm">
                        {example}
                      </div>
                      <button
                        onClick={() => handleCopy(example, index)}
                        className="absolute right-3 top-3 p-1 rounded hover:bg-gray-100 transition-colors"
                        aria-label="Copy to clipboard"
                      >
                        <AnimatePresence mode="wait">
                          {copiedIndex === index ? (
                            <motion.span
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.5 }}
                              className="text-xs font-medium text-indigo-600 absolute -top-6 -right-2 bg-indigo-50 px-2 py-1 rounded"
                            >
                              Copied!
                            </motion.span>
                          ) : null}
                        </AnimatePresence>
                        <FiCopy className="text-gray-500 group-hover:text-indigo-600 transition-colors" size={16} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'variables' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Variable Mappings</h3>
                <p className="text-gray-600 mb-5">How survey questions map to analysis variables:</p>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="overflow-hidden border border-gray-200 rounded-lg shadow-sm"
                >
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variable</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Survey Question</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Analysis Mapping</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {variableMappings.map((item, index) => (
                        <motion.tr
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            <span className="inline-block bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
                              {item.variable}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 italic">
                            &ldquo;{item.question}&rdquo;
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 font-mono">{item.mapping}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </motion.div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default FullGuide;