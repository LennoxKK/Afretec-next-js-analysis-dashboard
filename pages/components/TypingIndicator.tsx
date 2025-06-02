import { motion } from 'framer-motion';
import React from 'react';

export const TypingIndicator = () => (
  <div className="flex items-center space-x-2 p-3">
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-indigo-600 rounded-full"
          animate={{ y: [0, -5, 0] }}
          transition={{
            repeat: Infinity,
            duration: 0.8,
            delay: i * 0.2,
            repeatType: 'reverse',
          }}
        />
      ))}
    </div>
    <span className="text-sm text-gray-600">Analyzing data...</span>
  </div>
);