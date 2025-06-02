// pages/api/data.js
import { 
    getAnalyticsData, 
    getDiseases, 
    getQuestions,
    getTotalResponses, 
    getResponderCount 
  } from '../../lib/database';
  
  // Cache configuration
  const CACHE_TTL = 60 * 1000; // 1 minute cache
  let cache = {
    diseases: null,
    questions: null,
    summary: null,
    lastUpdated: {
      diseases: 0,
      questions: 0,
      summary: 0
    }
  };
  
  // Valid data types
  const VALID_TYPES = new Set(['analytics', 'diseases', 'questions', 'summary', 'general']);

  export default async function handler(req, res) {
    if (req.method !== 'GET') {
      return res.status(405).json({ 
        error: 'Method not allowed',
        message: 'Only GET requests are supported'
      });
    }
  
    try {
      const { diseases, variables, type } = req.query;
      
      // Validate type parameter
      if (!type || !VALID_TYPES.has(type)) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'Missing or invalid type parameter',
          validTypes: Array.from(VALID_TYPES)
        });
      }
  
      // Parse and validate query parameters
      const diseaseList = diseases 
        ? diseases.split(',').map(d => d.trim().toLowerCase()).filter(Boolean)
        : [];
        const variableList = variables 
        ? variables.split(',').map(v => v.trim()).filter(Boolean)
        : [];
      
  
      // Process request based on type
      switch (type) {
        case 'analytics': {
          if (diseaseList.length === 0) {
            return res.status(400).json({
              error: 'Invalid request',
              message: 'At least one disease must be specified for analytics data'
            });
          }
  
          const analyticsData = await getAnalyticsData(diseaseList, variableList);
          const processedData = processAnalyticsData(analyticsData, diseaseList, variableList);
          
          return res.status(200).json({ 
            success: true,
            data: processedData,
            meta: {
              diseases: diseaseList,
              variables: variableList.length > 0 ? variableList : 'all'
            }
          });
        }
          
        case 'diseases': {
          // Check cache first
          const now = Date.now();
          if (cache.diseases && now - cache.lastUpdated.diseases < CACHE_TTL) {
            return res.status(200).json({ 
              success: true,
              data: cache.diseases,
              cached: true
            });
          }
          
          const diseasesData = await getDiseases();
          
          // Update cache
          cache.diseases = diseasesData;
          cache.lastUpdated.diseases = now;
          
          return res.status(200).json({ 
            success: true,
            data: diseasesData
          });
        }
          
        case 'questions': {
          const now = Date.now();
          if (cache.questions && now - cache.lastUpdated.questions < CACHE_TTL) {
            return res.status(200).json({ 
              success: true,
              data: cache.questions,
              cached: true
            });
          }
          
          const questionsData = await getQuestions();
          
          // Update cache
          cache.questions = questionsData;
          cache.lastUpdated.questions = now;
          
          return res.status(200).json({ 
            success: true,
            data: questionsData
          });
        }
        
        case 'general': {
            const { question } = req.query;
          
            if (!question) {
              return res.status(400).json({
                error: 'Missing question',
                message: 'A question must be provided via the `question` query parameter.'
              });
            }
          
            const openai = new (await import('openai')).default({
              apiKey: process.env.OPENAI_API_KEY,
              baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
            });
          
            const systemPrompt = `You are a highly knowledgeable assistant for a disease data dashboard in Bariga, Lagos. 
            Answer general or contextual questions clearly. Mention the available diseases (malaria, cholera, heat stress), 
            and only refer to the following valid variables:
            
            - gender (e.g. male or female)
            - age (e.g. older than 35)
            - season (e.g. rainy season)
            - familySize (e.g. more than four people in a household)
            - climateChangeAwareness (e.g. awareness about climate change)
            - location (e.g. visited a health facility)
            - malariaTreatmentLastYear (e.g. treated for malaria last year)
            - malariaIncrease (e.g. more malaria cases last year than the previous)
            - weatherImpact (e.g. weather conditions affecting health)
            - preventionTipsInterest (e.g. interest in malaria prevention tips)
            
            If a user’s question includes **a disease and one or more of these variables**, return a JSON object with:
            - chartTypes: "bar" (default) return as a list
            - diseases: (from user input)
            - variables: (from user input)
            - title: a descriptive string of the chart context
            
            If the prompt also mentions a **specific chart type** (bar, line,histogram or pie), use that chart type in the JSON instead of the default.
            If prompt has only a variable or variables or both variable/variables and chart then use all diseases for plotting
            If promt has only variables without a chart type then plot all diseases and default chart
            All responses for chart questions must return JSON formatted for direct frontend rendering and the it should only json, no extra description.
            
            If the question is unrelated, respond accurately and professionally with plain text.`;
            

          
            const completion = await openai.chat.completions.create({
              model: process.env.OPENAI_MODEL || 'gpt-4o',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: question }
              ],
              max_tokens: 1000,
              temperature: 0.6
            });
          
            const answer = completion.choices[0]?.message?.content || 'No response generated.';
          
            return res.status(200).json({
              success: true,
              reply: answer
            });
          }
          
        case 'summary': {
          const now = Date.now();
          if (cache.summary && now - cache.lastUpdated.summary < CACHE_TTL) {
            return res.status(200).json({ 
              success: true,
              data: cache.summary,
              cached: true
            });
          }
          
          const summary = await getSummaryData();
          
          // Update cache
          cache.summary = summary;
          cache.lastUpdated.summary = now;
          
          return res.status(200).json({ 
            success: true,
            data: summary
          });
        }
      }
    } catch (error) {
      console.error('Data API error:', error);
      
      const statusCode = error.code === 'ER_ACCESS_DENIED_ERROR' ? 503 : 500;
      
      return res.status(statusCode).json({ 
        success: false,
        error: 'Failed to fetch data',
        message: process.env.NODE_ENV === 'development' 
          ? error.message 
          : 'An error occurred while processing your request',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      });
    }
  }
  
  function processAnalyticsData(rawData, diseases, variables) {
    if (!rawData || !Array.isArray(rawData)) {
      throw new Error('Invalid raw data format');
    }
  
    const processed = {};
    const variableMap = {
      'gender': { 
        test: text => text.includes('male or female'),
        transform: choice => choice // Keep as-is (Male/Female)
      },
      'age': {
        test: text => text.includes('older than 35'),
        transform: choice => choice.toLowerCase() === 'yes' ? 'Above 35' : 'Below 35'
      },
      'season': {
        test: text => text.includes('rainy season'),
        transform: choice => choice.toLowerCase() === 'yes' ? 'Rainy Season' : 'Dry Season'
      },
      'familySize': {
        test: text => text.includes('more than four'),
        transform: choice => choice.toLowerCase() === 'yes' ? 'More than four' : 'Four or less'
      },
      'climateChangeAwareness': {
        test: text => text.includes('climate change'),
        transform: choice => choice.toLowerCase() === 'yes' ? 'Yes' : 'No'
      },
      'location': {
        test: text => text.includes('health facility'),
        transform: choice => choice.toLowerCase() === 'yes' ? 'Bariga, Lagos' : 'Other location'
      },
      'malariaTreatmentLastYear': {
        test: text => text.includes('treated for malaria last year'),
        transform: choice => choice.toLowerCase() === 'yes' ? 'Yes' : 'No'
      },
      'malariaIncrease': {
        test: text => text.includes('more last year than previous'),
        transform: choice => choice.toLowerCase() === 'yes' ? 'Yes' : 'No'
      },
      'weatherImpact': {
        test: text => text.includes('weather conditions are affecting'),
        transform: choice => choice.toLowerCase() === 'yes' ? 'Yes' : 'No'
      },
      'preventionTipsInterest': {
        test: text => text.includes('malaria prevention tips'),
        transform: choice => choice.toLowerCase() === 'yes' ? 'Yes' : 'No'
      }
    };
  
    for (const row of rawData) {
      if (!row.disease_name || !row.question_text || !row.choice_text || row.response_count == null) {
        console.warn('Skipping malformed row:', row);
        continue;
      }
  
      const disease = row.disease_name.toLowerCase();
      processed[disease] = processed[disease] || {};
  
      const questionText = row.question_text.toLowerCase();
  
      // Find matching variable type
      for (const [varType, { test, transform }] of Object.entries(variableMap)) {
        if (test(questionText)) {
          // Skip if variables were specified and this one isn't in the list
          if (variables.length > 0 && !variables.includes(varType)) {
            break;
          }
  
          processed[disease][varType] = processed[disease][varType] || {};
          const choiceLabel = transform(row.choice_text);
          processed[disease][varType][choiceLabel] = (processed[disease][varType][choiceLabel] || 0) + row.response_count;
          break;
        }
      }
    }
  
    // Ensure all requested diseases are in the response, even if empty
    for (const disease of diseases) {
      if (!processed[disease]) {
        processed[disease] = {};
      }
    }
  
    return processed;
  }
  
  async function getSummaryData() {
    try {
      const [diseases, totalResponders, totalResponses] = await Promise.all([
        getDiseases(),
        getResponderCount(),
        getTotalResponses()
      ]);
  
      return {
        totalDiseases: diseases.length,
        totalResponders,
        totalResponses,
        diseases: diseases.map(d => ({
          id: d.disease_id,
          name: d.disease_name,
          description: d.description,
          is_active: d.is_active
        })),
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Summary data error:', error);
      throw error;
    }
  }