import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  LabelList,
  ReferenceLine,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

import { ChartData } from '../src/types/chat';

interface ChartComponentProps {
  data: ChartData;
}

interface TooltipPayloadEntry {
  color: string;
  name: string;
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

interface LegendPayloadEntry {
  color?: string;
  value: string;
}

interface CustomLegendProps {
  payload?: LegendPayloadEntry[];
}



// Enhanced color palette with better contrast
const COLORS = [
  '#4E79A7', // Blue
  '#F28E2B', // Orange
  '#E15759', // Red
  '#76B7B2', // Teal
  '#59A14F', // Green
  '#EDC948', // Yellow
  '#B07AA1', // Purple
  '#FF9DA7', // Pink
  '#9C755F', // Brown
  '#BAB0AC'  // Gray
];

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 shadow-lg rounded-lg border border-gray-200">
        <p className="font-semibold text-gray-800 mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <div key={`tooltip-${index}`} className="flex items-center">
              <div 
                className="w-3 h-3 mr-2 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-700">
                {entry.name}: <span className="font-medium ml-1">{entry.value}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const renderCustomizedLegend = (props: CustomLegendProps) => {
  const { payload } = props;
  return (
    <div className="flex flex-wrap justify-center gap-3 mt-4">
      {payload?.map((entry, index) => (
        <div key={`legend-${index}`} className="flex items-center">
          <div 
            className="w-3 h-3 mr-2 rounded-full" 
            style={{ backgroundColor: entry.color || '#000' }}
          />
          <span className="text-xs font-medium text-gray-700">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export const ChartComponent: React.FC<ChartComponentProps> = ({ data }) => {
  const { diseases, variables, data: rawData, chartType, title } = data;

  const transformChartData = () => {
    const result: Record<string, Array<Record<string, number | string>>> = {};

    variables.forEach((variable) => {
      const chartData: Array<Record<string, number | string>> = [];
      const categories = new Set<string>();

      diseases.forEach((disease) => {
        if (rawData[disease]?.[variable]) {
          Object.keys(rawData[disease][variable]).forEach((category) => {
            categories.add(category);
          });
        }
      });

      Array.from(categories).forEach((category) => {
        const dataPoint: Record<string, number | string> = { name: category };
        let hasNonZeroValue = false;

        diseases.forEach((disease) => {
          const value = rawData[disease]?.[variable]?.[category] || 0;
          dataPoint[disease] = value;
          if (value !== 0) hasNonZeroValue = true;
        });

        if (hasNonZeroValue) {
          chartData.push(dataPoint);
        }
      });

      result[variable] = chartData;
    });

    return result;
  };

  const transformPieData = () => {
    const result: Record<string, Array<{ name: string; value: number }>> = {};

    variables.forEach((variable) => {
      diseases.forEach((disease) => {
        if (rawData[disease]?.[variable]) {
          const pieEntries = Object.entries(rawData[disease][variable])
            .map(([category, value]) => ({
              name: category,
              value: value || 0,
            }))
            .filter((entry) => entry.value > 0);

          if (pieEntries.length > 0) {
            result[`${disease}-${variable}`] = pieEntries;
          }
        }
      });
    });

    return result;
  };

  const chartData = transformChartData();
  const pieData = transformPieData();

  const hasData = variables.some((variable) =>
    diseases.some((disease) =>
      rawData[disease]?.[variable] &&
      Object.values(rawData[disease][variable]).some((value) => value > 0)
    )
  );

  if (!hasData) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-6 bg-gray-50 rounded-lg text-center"
      >
        <h3 className="text-lg font-medium text-gray-700">{title}</h3>
        <p className="text-gray-500 mt-2">No data available for the selected parameters</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-sm overflow-hidden"
    >
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-xl font-semibold text-gray-800 text-center">
          {title}
        </h3>
      </div>

      <div className="p-6">
        <AnimatePresence>
          {variables.map((variable) => {
            const currentData = chartData[variable] || [];
            const currentHasData = currentData.some((dataPoint) =>
              diseases.some((disease) => (dataPoint[disease] as number || 0) > 0)
            );

            if (chartType === 'pie') {
              const relevantPieData = Object.entries(pieData)
                .filter(([key]) => key.includes(variable))
                .map(([key, data]) => ({
                  disease: key.split('-')[0],
                  data,
                }));

              if (relevantPieData.length === 0) {
                return (
                  <motion.div
                    key={variable}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-6 p-4 bg-gray-50 rounded-lg"
                  >
                    <h4 className="text-md font-medium text-gray-700 mb-2">
                      {variable.replace(/([A-Z])/g, ' $1').trim()}
                    </h4>
                    <p className="text-gray-500">No data available for this variable</p>
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={variable}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="mb-8 w-full"
                >
                  <h4 className="text-lg font-medium text-gray-700 mb-6 text-center">
                    {variable.replace(/([A-Z])/g, ' $1').trim()}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-items-center">
                    {relevantPieData.map(({ disease, data }) => {
                      const total = data.reduce((sum, entry) => sum + entry.value, 0);
                      
                      return (
                        <motion.div
                          key={`${disease}-${variable}`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex flex-col items-center w-full max-w-md"
                        >
                          <h5 className="text-md font-medium mb-4">{disease}</h5>
                          <div className="w-full h-[350px] relative">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={data}
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={100}
                                  innerRadius={60}
                                  paddingAngle={1}
                                  dataKey="value"
                                  nameKey="name"
                                  label={({ percent, midAngle, cx, cy }) => {
                                    const RADIAN = Math.PI / 180;
                                    const radius = 85;
                                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                    
                                    return (
                                      <text
                                        x={x}
                                        y={y}
                                        fill="#fff"
                                        textAnchor="middle"
                                        dominantBaseline="central"
                                        className="text-xs font-bold"
                                        stroke="#333"
                                        strokeWidth={0.5}
                                      >
                                        {percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                                      </text>
                                    );
                                  }}
                                  labelLine={false}
                                >
                                  {data.map((entry, i) => (
                                    <Cell
                                      key={`cell-${i}`}
                                      fill={COLORS[i % COLORS.length]}
                                      stroke="#fff"
                                      strokeWidth={2}
                                    />
                                  ))}
                                </Pie>
                                <Tooltip 
                                  content={<CustomTooltip />}
                                  formatter={(value: number, name: string) => [
                                    `${value} (${((value/total)*100).toFixed(1)}%)`,
                                    name
                                  ]}
                                />
                                <Legend
                                  content={renderCustomizedLegend}
                                  wrapperStyle={{ paddingTop: '40px' }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            }

            if (!currentHasData) {
              return (
                <motion.div
                  key={variable}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mb-6 p-4 bg-gray-50 rounded-lg"
                >
                  <h4 className="text-md font-medium text-gray-700 mb-2">
                    {variable.replace(/([A-Z])/g, ' $1').trim()}
                  </h4>
                  <p className="text-gray-500">No data available for this variable</p>
                </motion.div>
              );
            }

            return (
              <motion.div
                key={variable}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="mb-10"
              >
                <h4 className="text-lg font-medium text-gray-700 mb-6 text-center">
                  {variable.replace(/([A-Z])/g, ' $1').trim()}
                </h4>

                <div className="w-full h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'bar' ? (
                      <BarChart
                        data={currentData}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 60,
                        }}
                        layout="horizontal"
                      >
                        <CartesianGrid 
                          strokeDasharray="3 3" 
                          stroke="#e5e7eb" 
                          vertical={false}
                        />
                        <XAxis 
                          dataKey="name"
                          angle={-45}
                          textAnchor="end"
                          height={60}
                          tick={{ fontSize: 12, fill: '#4b5563' }}
                          axisLine={{ stroke: '#d1d5db' }}
                          tickMargin={10}
                        />
                        <YAxis 
                          tick={{ fontSize: 12, fill: '#4b5563' }}
                          axisLine={{ stroke: '#d1d5db' }}
                          width={80}
                        />
                        <Tooltip 
                          content={<CustomTooltip />}
                          cursor={{ fill: '#f3f4f6' }}
                        />
                        <Legend 
                          content={renderCustomizedLegend}
                          wrapperStyle={{ paddingTop: '10px' }}
                        />
                        <ReferenceLine y={0} stroke="#d1d5db" />
                        {diseases.map((disease, index) => (
                          <Bar
                            key={disease}
                            dataKey={disease}
                            name={disease}
                            fill={COLORS[index % COLORS.length]}
                            radius={[4, 4, 0, 0]}
                          >
                            {currentData.length < 10 && (
                              <LabelList
                                dataKey={disease}
                                position="top"
                                formatter={(value: number) => value.toLocaleString()}
                                style={{ 
                                  fontSize: '11px', 
                                  fill: '#374151',
                                  fontWeight: 500 
                                }}
                              />
                            )}
                          </Bar>
                        ))}
                      </BarChart>
                    ) : (
                      <LineChart
                        data={currentData}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 60,
                        }}
                      >
                        <CartesianGrid 
                          strokeDasharray="3 3" 
                          stroke="#e5e7eb" 
                          vertical={false}
                        />
                        <XAxis 
                          dataKey="name"
                          angle={-45}
                          textAnchor="end"
                          height={60}
                          tick={{ fontSize: 12, fill: '#4b5563' }}
                          axisLine={{ stroke: '#d1d5db' }}
                          tickMargin={10}
                        />
                        <YAxis 
                          tick={{ fontSize: 12, fill: '#4b5563' }}
                          axisLine={{ stroke: '#d1d5db' }}
                          width={80}
                        />
                        <Tooltip 
                          content={<CustomTooltip />}
                          cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                        />
                        <Legend 
                          content={renderCustomizedLegend}
                          wrapperStyle={{ paddingTop: '10px' }}
                        />
                        {diseases.map((disease, index) => (
                          <Line
                            key={disease}
                            type="monotone"
                            dataKey={disease}
                            stroke={COLORS[index % COLORS.length]}
                            strokeWidth={2.5}
                            dot={{ 
                              r: 4,
                              stroke: COLORS[index % COLORS.length],
                              strokeWidth: 1,
                              fill: '#fff'
                            }}
                            activeDot={{ 
                              r: 6, 
                              stroke: COLORS[index % COLORS.length],
                              strokeWidth: 2,
                              fill: '#fff'
                            }}
                            name={disease}
                          />
                        ))}
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};