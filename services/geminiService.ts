import { GoogleGenAI, Type, Schema } from "@google/genai";
import { QuizQuestion, QuestionType, QuizAnalysis, UserAnswer } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to convert File to base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:application/pdf;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const generateQuiz = async (base64Pdf: string, questionCount: number = 10): Promise<QuizQuestion[]> => {
  const model = "gemini-2.5-flash";
  
  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.INTEGER },
        topic: { type: Type.STRING, description: "The general topic or chapter." },
        text: { type: Type.STRING, description: "The question text." },
        type: { type: Type.STRING, enum: [QuestionType.MULTIPLE_CHOICE, QuestionType.TRUE_FALSE] },
        options: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "List of options. For True/False, provide ['True', 'False']."
        },
        correctAnswerIndex: { type: Type.INTEGER, description: "Correct answer index (0-based)." },
        explanation: { type: Type.STRING, description: "Explanation of the answer." }
      },
      required: ["id", "topic", "text", "type", "options", "correctAnswerIndex", "explanation"]
    }
  };

  const prompt = `
    Generate a quiz with exactly ${questionCount} questions based on the PDF.
    
    RULES:
    1. Group questions by TOPIC (e.g., Intro, Chapter 1).
    2. Mix Multiple Choice and True/False.
    3. Explanation MUST be extremely concise (max 15 words) to ensure speed.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType: 'application/pdf', data: base64Pdf } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.2, // Lower temperature for faster, more deterministic output
        thinkingConfig: { thinkingBudget: 0 } // STRICTLY 0 to meet "at most 3secs" requirement
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No data returned from AI");
    return JSON.parse(jsonText) as QuizQuestion[];

  } catch (error) {
    console.error("Error generating quiz:", error);
    throw error;
  }
};

export const analyzeQuizResults = async (
  base64Pdf: string, 
  questions: QuizQuestion[], 
  userAnswers: UserAnswer[]
): Promise<QuizAnalysis> => {
  const model = "gemini-2.5-flash";

  // Construct a summary of performance to send to the AI
  const performanceData = questions.map(q => {
    const userAnswer = userAnswers.find(a => a.questionId === q.id);
    const selectedIndex = userAnswer ? userAnswer.selectedOptionIndex : -1;
    const isCorrect = selectedIndex === q.correctAnswerIndex;
    return {
      topic: q.topic,
      correct: isCorrect
    };
  });

  const prompt = `
    Analyze this student performance data on a PDF quiz: ${JSON.stringify(performanceData)}.
    Return JSON with score, feedback, and topic breakdown. 
    Keep advice short and actionable.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      totalScore: { type: Type.INTEGER },
      correctCount: { type: Type.INTEGER },
      totalQuestions: { type: Type.INTEGER },
      feedback: { type: Type.STRING },
      topicBreakdown: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            score: { type: Type.INTEGER },
            status: { type: Type.STRING, enum: ["Strength", "Weakness", "Average"] },
            advice: { type: Type.STRING }
          },
          required: ["topic", "score", "status", "advice"]
        }
      }
    },
    required: ["totalScore", "correctCount", "totalQuestions", "feedback", "topicBreakdown"]
  };

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType: 'application/pdf', data: base64Pdf } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.2,
        thinkingConfig: { thinkingBudget: 0 } // Disabled for speed
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No analysis returned");
    return JSON.parse(jsonText) as QuizAnalysis;

  } catch (error) {
    console.error("Error analyzing quiz:", error);
    throw error;
  }
};

export const chatWithPdf = async (base64Pdf: string, history: {role: string, parts: {text: string}[]}[], message: string): Promise<string> => {
  const model = "gemini-2.5-flash";
  
  try {
    const chat = ai.chats.create({
      model,
      history: [
        {
            role: "user",
            parts: [{ inlineData: { mimeType: 'application/pdf', data: base64Pdf } }, { text: "Context provided." }]
        },
        {
            role: "model",
            parts: [{ text: "Ready." }]
        },
        ...history
      ],
      config: {
        systemInstruction: "You are a concise tutor. Answer directly based on the PDF. Keep answers short unless asked otherwise.",
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    const result = await chat.sendMessage({ message });
    return result.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Chat error:", error);
    return "Sorry, I encountered an error processing your request.";
  }
};