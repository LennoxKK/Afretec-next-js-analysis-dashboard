// types/index.ts
export interface CategoryData {
  [category: string]: number;
}

export interface VariableData {
  [variable: string]: CategoryData;
}

export interface DiseaseData {
  [disease: string]: VariableData;
}

export interface ChartData {
  id: string;
  chartTypes: ('bar' | 'line' | 'pie')[];
  chartType?: 'bar' | 'line' | 'pie';
  title: string;
  data: DiseaseData;
  diseases: string[];
  variables: string[];
}


// src/types/chat.ts
export interface Message {
  id: string;
  sender: 'user' | 'bot';
  type: 'text' | 'chart' | 'typing';
  text: string;
  timestamp: Date;
  chartData?: ChartData;
}

export interface ApiResponse {
  success: boolean;
  reply?: string; // Make reply optional
  chartData?: ChartData;
}