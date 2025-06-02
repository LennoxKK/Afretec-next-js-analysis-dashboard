// src/services/chatService.ts
import { v4 as uuidv4 } from 'uuid';
import { Message, ApiResponse } from '../types/chat';

export const sendMessage = async (message: string): Promise<Message> => {
  const encodedQuestion = encodeURIComponent(message);
  const url = `http://localhost:3000/api/data?type=general&question=${encodedQuestion}`;

  try {
    const res = await fetch(url);
    const data: ApiResponse = await res.json();
    
    return {
      id: uuidv4(),
      sender: 'bot',
      type: 'text',
      text: data.success ? (data.reply || "I received your message but didn't have a reply.") 
                         : "I couldn't process that request. Please try again.",
      timestamp: new Date()
    };
  } catch {
    return {
      id: uuidv4(),
      sender: 'bot',
      type: 'text',
      text: "⚠️ I'm having trouble connecting to the service. Please try again later.",
      timestamp: new Date()
    };
  }
};