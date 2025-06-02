import OpenAI from 'openai';
import { createParser } from 'eventsource-parser';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only POST requests are accepted'
    });
  }

  try {
    const { message, isJSONRequest, stream } = req.body;

    if (!message) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Message is required'
      });
    }

    const isVisualizationRequest = isVisualizationQuery(message);
    const isGeneralQuestion = !isJSONRequest && !isVisualizationRequest;

    let systemPrompt;
    let responseFormat = null;

    if (isJSONRequest) {
      systemPrompt = `You are a JSON response generator for a disease data analysis dashboard. 
      Respond STRICTLY with valid JSON in this exact format:
      {
        "diseases": ["array of disease names mentioned"],
        "variables": ["array of variables mentioned"],
        "chartTypes": ["array of chart types mentioned"]
      }
      Rules:
      1. Only include malaria, cholera, or heat stress in diseases
      2. Only valid variables are: age, gender, season, familySize, location, 
         climateChangeAwareness, malariaTreatmentLastYear, malariaIncrease, 
         weatherImpact, preventionTipsInterest
      3. Only valid chart types: bar, line, pie
      4. No additional text or explanation
      5. If no chart type specified, default to ["bar"]`;

      responseFormat = { type: "json_object" };
    } else if (isVisualizationRequest) {
      systemPrompt = `You are a helpful assistant for a disease data analysis dashboard. 
      The system analyzes data for malaria, cholera, and heat stress.

      Key information:
      - Variables: age (above/below 35), gender, season (rainy/dry)
      - Locations: Bariga, Lagos, Nigeria
      - Chart types: bar, line, pie

      For visualization requests, help users include:
      1. Disease names
      2. Variables
      3. Chart types (default: bar)

      Example: "Show malaria cases by age and gender using pie charts"`;
    } else {
      systemPrompt = `You are a highly knowledgeable and versatile assistant capable of answering a wide range of questions accurately and concisely. 
      Provide clear, professional, and accessible responses. 
      If the question relates to the disease data analysis dashboard (covering malaria, cholera, heat stress in Bariga, Lagos, Nigeria), include relevant context about:
      - Available diseases: malaria, cholera, heat stress
      - Variables: age, gender, season
      - Data scope: Bariga, Lagos, Nigeria
      For all other topics, provide general knowledge or insights based on your capabilities. Cite sources when possible.`;
    }

    // Handle streaming
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const completionStream = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        ...(responseFormat ? { response_format: responseFormat } : {}),
        stream: true,
        max_tokens: 1500,
        temperature: isGeneralQuestion ? 0.5 : 0.7,
      });

      const parser = createParser(event => {
        if (event.type === 'event') {
          if (event.data === '[DONE]') {
            res.end();
            return;
          }
          try {
            const data = JSON.parse(event.data);
            const content = data.choices[0]?.delta?.content || '';
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          } catch (e) {
            console.error('Error parsing stream event:', e);
          }
        }
      });

      for await (const chunk of completionStream) {
        parser.feed(`data: ${JSON.stringify(chunk)}\n\n`);
      }

      return;
    }

    // Non-streaming response
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      ...(responseFormat ? { response_format: responseFormat } : {}),
      max_tokens: 1500,
      temperature: isGeneralQuestion ? 0.5 : 0.7,
    });

    let reply = completion.choices[0]?.message?.content || '';

    if (isJSONRequest) {
      reply = reply.replace(/```json|```/g, '').trim();
      try {
        reply = JSON.parse(reply);
      } catch (e) {
        console.error('Error parsing AI-generated JSON:', e);
        return res.status(500).json({
          error: 'Invalid JSON response from AI',
          details: 'The AI failed to generate valid JSON format'
        });
      }
    }

    return res.status(200).json({ reply });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
      type: error.type || 'unknown_error'
    });
  }
}

// Helper function to detect visualization queries
function isVisualizationQuery(message) {
  const visualizationKeywords = [
    'show', 'display', 'visualize', 'graph', 'chart',
    'plot', 'correlation', 'comparison', 'trend',
    'bar', 'line', 'pie', 'data', 'analyze'
  ];

  const diseaseKeywords = [
    'malaria', 'cholera', 'heat stress', 'disease'
  ];

  const hasVisualizationKeyword = visualizationKeywords.some(keyword =>
    message.toLowerCase().includes(keyword)
  );

  const hasDiseaseKeyword = diseaseKeywords.some(keyword =>
    message.toLowerCase().includes(keyword)
  );

  return hasVisualizationKeyword && hasDiseaseKeyword;
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
};
