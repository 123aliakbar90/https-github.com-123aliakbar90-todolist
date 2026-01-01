
import { GoogleGenAI, Type } from "@google/genai";
import { Priority } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const breakdownTask = async (taskText: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Break down the following task into 3-5 manageable sub-tasks: "${taskText}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING, description: 'Short description of the sub-task' }
          },
          required: ['text']
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error("Failed to parse breakdown response", e);
    return [];
  }
};

export const getSmartSuggestions = async (existingTasks: string[]) => {
  const context = existingTasks.length > 0 
    ? `Current tasks include: ${existingTasks.join(', ')}.` 
    : "The list is currently empty.";

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `${context} Suggest 3 new productive tasks that would complement these or help organize a professional day.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            priority: { type: Type.STRING, enum: [Priority.HIGH, Priority.MEDIUM, Priority.LOW] },
            category: { type: Type.STRING }
          },
          required: ['text', 'priority', 'category']
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error("Failed to parse suggestions", e);
    return [];
  }
};

export const categorizeTask = async (taskText: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze this task and assign a priority and a one-word category: "${taskText}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          priority: { type: Type.STRING, enum: [Priority.HIGH, Priority.MEDIUM, Priority.LOW] },
          category: { type: Type.STRING }
        },
        required: ['priority', 'category']
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return { priority: Priority.MEDIUM, category: 'General' };
  }
};
