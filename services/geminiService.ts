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
        topic: { type: Type.STRING, description: "The general topic or chapter this question belongs to." },
        text: { type: Type.STRING, description: "The question text." },
        type: { type: Type.STRING, enum: [QuestionType.MULTIPLE_CHOICE, QuestionType.TRUE_FALSE] },
        options: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "List of options. For True/False, provide ['True', 'False']."
        },
        correctAnswerIndex: { type: Type.INTEGER, description: "The index of the correct answer in the options array (0-based)." },
        explanation: { type: Type.STRING, description: "A brief explanation of why the correct answer is correct." }
      },
      required: ["id", "topic", "text", "type", "options", "correctAnswerIndex", "explanation"]
    }
  };

  const prompt = `
    Analyze the attached PDF document.
    Generate a quiz with exactly ${questionCount} questions based STRICTLY on the content of the PDF.
    
    CRITICAL INSTRUCTIONS:
    1. Group the questions by TOPIC. Do not scatter topics randomly. 
    2. Example: Questions 1-3 about "Introduction", Questions 4-6 about "Chapter 1", etc.
    3. Mix Multiple Choice and True/False questions.
    4. Ensure the questions vary in difficulty.
    5. Provide a clear explanation for the correct answer.
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
        temperature: 0.4
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
      question: q.text,
      topic: q.topic,
      correct: isCorrect,
      userAnswer: selectedIndex >= 0 ? q.options[selectedIndex] : "No Answer",
      correctAnswer: q.options[q.correctAnswerIndex]
    };
  });

  const prompt = `
    You are an expert tutor. A student just took a quiz based on the attached PDF.
    Here is their performance data: ${JSON.stringify(performanceData)}.
    
    Analyze their performance. 
    1. Calculate the score.
    2. Identify strong and weak topics.
    3. Provide specific advice on what to study in the PDF for the weak areas.
    
    Return the analysis in JSON format.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      totalScore: { type: Type.INTEGER, description: "Percentage score (0-100)" },
      correctCount: { type: Type.INTEGER },
      totalQuestions: { type: Type.INTEGER },
      feedback: { type: Type.STRING, description: "Overall encouraging feedback summary." },
      topicBreakdown: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            score: { type: Type.INTEGER, description: "Percentage score for this topic" },
            status: { type: Type.STRING, enum: ["Strength", "Weakness", "Average"] },
            advice: { type: Type.STRING, description: "What to focus on regarding this topic." }
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
        responseSchema: schema
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
            parts: [{ inlineData: { mimeType: 'application/pdf', data: base64Pdf } }, { text: "Use this PDF as the context for all future answers. Answer ONLY based on this document." }]
        },
        {
            role: "model",
            parts: [{ text: "Understood. I will answer your questions based solely on the provided PDF document." }]
        },
        ...history
      ],
      config: {
        systemInstruction: "You are a helpful teaching assistant. Answer the user's questions based strictly on the provided PDF context. If the answer is not in the document, politely state that you cannot find the information in the provided source.",
      }
    });

    const result = await chat.sendMessage({ message });
    return result.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Chat error:", error);
    return "Sorry, I encountered an error processing your request.";
  }
};