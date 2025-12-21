
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { 
  QuizQuestion, QuestionType, QuizAnalysis, UserAnswer, 
  TheoryQuestion, TheoryDifficulty, TheoryExamAnalysis, TheoryAnswer, TheoryStrategy
} from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const extractTopics = async (base64Pdf: string): Promise<string[]> => {
  const model = "gemini-3-flash-preview";
  const prompt = "Extract a list of the 5-8 main topics/chapters discussed in this PDF. Return only as a JSON array of strings.";
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [{ inlineData: { mimeType: 'application/pdf', data: base64Pdf } }, { text: prompt }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    return ["General Course Content"];
  }
};

export const generateTheoryExam = async (
  base64Pdf: string, 
  topic: string, 
  difficulty: TheoryDifficulty,
  strategy: TheoryStrategy
): Promise<TheoryQuestion[]> => {
  const model = "gemini-3-flash-preview";
  
  const difficultyPrompts = {
    [TheoryDifficulty.EASY]: "Easy: direct recall, definitions, and examples.",
    [TheoryDifficulty.MODERATE]: "Moderate: explain concepts and processes.",
    [TheoryDifficulty.HARD]: "Hard: indirect, tricky, or scenario-based questions."
  };

  const count = strategy === TheoryStrategy.FIVE_OF_SEVEN ? 7 : 5;
  const targetAnswerCount = strategy === TheoryStrategy.FIVE_OF_SEVEN ? 5 : 3;
  const q1Points = 30;
  const otherPoints = 40 / (targetAnswerCount - 1);

  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.INTEGER },
        topic: { type: Type.STRING },
        mainPrompt: { type: Type.STRING },
        parts: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING },
              text: { type: Type.STRING },
              points: { type: Type.INTEGER },
              expectedKeywords: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["label", "text", "points", "expectedKeywords"]
          }
        },
        totalPoints: { type: Type.INTEGER },
        isCompulsory: { type: Type.BOOLEAN }
      },
      required: ["id", "topic", "mainPrompt", "parts", "totalPoints", "isCompulsory"]
    }
  };

  const prompt = `
    Generate ${count} theoretical questions about "${topic}" based on the PDF.
    Difficulty: ${difficultyPrompts[difficulty]}

    RULES:
    1. Question 1 MUST be compulsory and have totalPoints = ${q1Points}. Its parts must be labeled A, B, C.
    2. Questions 2 to ${count} are optional choices and have totalPoints = ${otherPoints} each. Their parts must be labeled 1, 2, 3.
    3. Each question must have exactly 3 parts.
    4. Ensure content is accurate and tricky for Hard difficulty.
    
    Assign points within parts to sum up to the totalPoints for that specific question.
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
        temperature: 0.5
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error generating theory exam:", error);
    throw error;
  }
};

export const gradeTheoryExam = async (
  base64Pdf: string,
  questions: TheoryQuestion[],
  answers: TheoryAnswer[]
): Promise<TheoryExamAnalysis> => {
  const model = "gemini-3-flash-preview";

  const prompt = `
    Grade these theoretical exam answers based on the PDF.
    Questions: ${JSON.stringify(questions)}
    User Answers: ${JSON.stringify(answers)}

    RULES:
    1. Total score is out of 70.
    2. Question 1 is compulsory. If they didn't answer it, they lose those 30 points.
    3. Evaluate based on mandatory keywords found in the PDF.
    4. A score of 45/70 is required to pass.
    5. Be thorough in feedback.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      finalScore: { type: Type.INTEGER },
      passed: { type: Type.BOOLEAN },
      topicStrengths: { type: Type.ARRAY, items: { type: Type.STRING } },
      topicWeaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
      generalFeedback: { type: Type.STRING },
      grades: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            questionId: { type: Type.INTEGER },
            totalScore: { type: Type.INTEGER },
            parts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  score: { type: Type.INTEGER },
                  feedback: { type: Type.STRING },
                  missedKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswerReference: { type: Type.STRING }
                },
                required: ["label", "score", "feedback", "missedKeywords", "correctAnswerReference"]
              }
            }
          },
          required: ["questionId", "totalScore", "parts"]
        }
      }
    },
    required: ["finalScore", "passed", "topicStrengths", "topicWeaknesses", "generalFeedback", "grades"]
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

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Grading error:", error);
    throw error;
  }
};

export const generateQuiz = async (base64Pdf: string, questionCount: number = 10): Promise<QuizQuestion[]> => {
  const model = "gemini-3-flash-preview";
  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.INTEGER },
        topic: { type: Type.STRING },
        text: { type: Type.STRING },
        type: { type: Type.STRING, enum: [QuestionType.MULTIPLE_CHOICE, QuestionType.TRUE_FALSE] },
        options: { type: Type.ARRAY, items: { type: Type.STRING } },
        correctAnswerIndex: { type: Type.INTEGER },
        explanation: { type: Type.STRING }
      },
      required: ["id", "topic", "text", "type", "options", "correctAnswerIndex", "explanation"]
    }
  };
  const prompt = `Generate a quiz with exactly ${questionCount} questions based on the PDF. Cover the document evenly. Mix MC and T/F.`;
  const response = await ai.models.generateContent({
    model,
    contents: { parts: [{ inlineData: { mimeType: 'application/pdf', data: base64Pdf } }, { text: prompt }] },
    config: { responseMimeType: "application/json", responseSchema: schema }
  });
  return JSON.parse(response.text || "[]");
};

export const analyzeQuizResults = async (base64Pdf: string, questions: QuizQuestion[], userAnswers: UserAnswer[]): Promise<QuizAnalysis> => {
  const model = "gemini-3-flash-preview";
  const prompt = `Analyze performance: ${JSON.stringify(userAnswers.map(a => ({ id: a.questionId, correct: a.isCorrect })))}`;
  const response = await ai.models.generateContent({
    model,
    contents: { parts: [{ inlineData: { mimeType: 'application/pdf', data: base64Pdf } }, { text: prompt }] },
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "{}");
};

export const chatWithPdf = async (base64Pdf: string, history: any[], message: string): Promise<string> => {
  const model = "gemini-3-flash-preview";
  const chat = ai.chats.create({
    model,
    history: [
      { role: "user", parts: [{ inlineData: { mimeType: 'application/pdf', data: base64Pdf } }, { text: "Document provided." }] },
      { role: "model", parts: [{ text: "Understood." }] },
      ...history
    ]
  });
  const result = await chat.sendMessage({ message });
  return result.text || "No response.";
};
