import { v4 as uuidv4 } from 'uuid';
import { Message } from '../types/chat';

console.debug('Initializing chatUtils.ts');

// Define enums for fixed values
enum ChartType {
  Bar = 'bar',
  Line = 'line',
  Pie = 'pie'
}

interface DataRequest {
  diseases: string[];
  variables: string[];
  title: string;
  chartTypes: ChartType[];
}

interface CategoryData {
  [category: string]: number;
}

interface VariableData {
  [variable: string]: CategoryData;
}

interface AnalyticsData {
  [disease: string]: VariableData;
}

interface ChartData {
  chartTypes: ChartType[];
  title: string;
  data: AnalyticsData;
  diseases: string[];
  variables: string[];
}

interface SendMessageParams {
  input: string;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  apiEndpoint: string;
  onChartData?: (charts: ChartData[]) => void;
}

// Type guard with proper typing
const isDataRequest = (json: unknown): json is DataRequest => {
  if (!json || typeof json !== 'object') return false;
  
  const request = json as Partial<DataRequest>;
  
  const isValid = (
    Array.isArray(request.diseases) &&
    request.diseases.every(d => typeof d === 'string') &&
    Array.isArray(request.variables) &&
    request.variables.every(v => typeof v === 'string') &&
    typeof request.title === 'string' &&
    Array.isArray(request.chartTypes) &&
    request.chartTypes.every(t => Object.values(ChartType).includes(t as ChartType))
  );
  
  if (!isValid) {
    console.warn('Invalid DataRequest format:', json);
  }
  
  return isValid;
};

interface AnalyticsResponse {
  success: boolean;
  data?: AnalyticsData;
  error?: string;
}

const fetchAnalyticsData = async (
  diseases: string[],
  variables: string[]
): Promise<AnalyticsData | null> => {
  try {
    console.log('Fetching analytics data for:', { diseases, variables });
    const diseasesParam = encodeURIComponent(diseases.join(','));
    const variablesParam = encodeURIComponent(variables.join(','));
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const url = `${apiUrl}/api/data?type=analytics&diseases=${diseasesParam}&variables=${variablesParam}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: AnalyticsResponse = await response.json();
    console.log('Received analytics data:', data);
    
    if (data.success && data.data) {
      return data.data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return null;
  }
};

interface BotResponse {
  success: boolean;
  reply: string;
  error?: string;
}

export const handleSendMessage = async ({
  input,
  setMessages,
  setInput,
  apiEndpoint,
  onChartData,
}: SendMessageParams): Promise<void> => {
  if (!input.trim()) return;

  console.log('Sending message:', input);

  const userMessage: Message = {
    id: uuidv4(),
    type: 'text',
    sender: 'user',
    text: input,
    timestamp: new Date()
  };
  setMessages(prev => [...prev, userMessage]);
  setInput('');

  try {
    const encodedQuestion = encodeURIComponent(input);
    const url = `${apiEndpoint}?type=general&question=${encodedQuestion}`;
    console.log('Making API request to:', url);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: BotResponse = await response.json();
    console.log('Received API response:', data);

    if (!data.success) {
      throw new Error(data.error || 'Unknown error');
    }

    let dataRequests: DataRequest[] = [];
    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(data.reply);
      } catch {
        const jsonMatch = data.reply.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[1]);
        } else {
          const looseJsonMatch = data.reply.match(/\{[\s\S]*\}/);
          if (looseJsonMatch) {
            parsed = JSON.parse(looseJsonMatch[0]);
          } else {
            throw new Error('No valid JSON found in response');
          }
        }
      }

      if (Array.isArray(parsed) && parsed.every(isDataRequest)) {
        dataRequests = parsed;
      } else if (isDataRequest(parsed)) {
        dataRequests = [parsed];
      } else {
        console.log('Response did not contain valid data requests:', parsed);
      }
    } catch {
      console.log('Could not parse JSON from response, treating as plain text');
    }

    if (dataRequests.length > 0) {
      console.log('Processing data requests:', dataRequests);
      
      const typingMessage: Message = {
        id: uuidv4(),
        type: 'typing',
        sender: 'bot',
        text: 'Fetching data...',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, typingMessage]);

      const dataMessages: Message[] = [];
      const charts: ChartData[] = [];

      for (const request of dataRequests) {
        console.log('Processing request:', request);
        const analyticsData = await fetchAnalyticsData(request.diseases, request.variables);

        if (analyticsData) {
          const chartPayload: ChartData = {
            chartTypes: request.chartTypes,
            title: request.title,
            data: analyticsData,
            diseases: request.diseases,
            variables: request.variables
          };
          charts.push(chartPayload);

          dataMessages.push({
            id: uuidv4(),
            type: 'text',
            sender: 'bot',
            text: `📊 Preparing ${request.chartTypes.join(' and ')} charts for "${request.title}"...`,
            timestamp: new Date()
          });
        } else {
          dataMessages.push({
            id: uuidv4(),
            type: 'text',
            sender: 'bot',
            text: `⚠️ Failed to fetch data for: ${request.title}`,
            timestamp: new Date()
          });
        }
      }

      if (onChartData && charts.length > 0) {
        console.log('Sending charts to parent:', charts);
        onChartData(charts);
      }

      setMessages(prev => [...prev.slice(0, -1), ...dataMessages]);
    } else {
      console.log('No data requests found, using plain text response');
      setMessages(prev => [...prev, {
        id: uuidv4(),
        type: 'text',
        sender: 'bot',
        text: data.reply,
        timestamp: new Date()
      }]);
    }
  } catch (error) {
    console.error('Error in handleSendMessage:', error);
    setMessages(prev => [...prev, {
      id: uuidv4(),
      type: 'text',
      sender: 'bot',
      text: "⚠️ Error processing your request. Please try again.",
      timestamp: new Date()
    }]);
  }
};