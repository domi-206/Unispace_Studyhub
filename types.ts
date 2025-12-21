
export enum AppMode {
  UPLOAD = 'UPLOAD',
  MENU = 'MENU',
  QUIZ_SETUP = 'QUIZ_SETUP',
  QUIZ = 'QUIZ',
  CHAT = 'CHAT',
  ANALYSIS = 'ANALYSIS',
  THEORY_SETUP = 'THEORY_SETUP',
  THEORY_EXAM = 'THEORY_EXAM',
  THEORY_ANALYSIS = 'THEORY_ANALYSIS'
}

export enum TheoryDifficulty {
  EASY = 'EASY',
  MODERATE = 'MODERATE',
  HARD = 'HARD'
}

export enum TheoryStrategy {
  THREE_OF_FIVE = '3_OF_5',
  FIVE_OF_SEVEN = '5_OF_7'
}

export interface TheoryPart {
  label: string; 
  text: string;
  points: number;
  expectedKeywords: string[];
}

export interface TheoryQuestion {
  id: number;
  topic: string;
  mainPrompt: string;
  parts: TheoryPart[];
  totalPoints: number;
  isCompulsory: boolean;
}

export interface TheoryAnswer {
  questionId: number;
  partAnswers: { label: string; text: string }[];
}

export interface TheoryGradePart {
  label: string;
  score: number;
  feedback: string;
  missedKeywords: string[];
  correctAnswerReference: string;
}

export interface TheoryGrade {
  questionId: number;
  totalScore: number;
  parts: TheoryGradePart[];
}

export interface TheoryExamAnalysis {
  finalScore: number; // Out of 70
  passed: boolean;
  topicStrengths: string[];
  topicWeaknesses: string[];
  generalFeedback: string;
  grades: TheoryGrade[];
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE'
}

export interface QuizSettings {
  questionCount: number;
  timerMode: 'unlimited' | 'question_timer' | 'quiz_timer';
  timeLimit: number; 
}

export interface QuizQuestion {
  id: number;
  topic: string;
  text: string;
  type: QuestionType;
  options: string[];
  correctAnswerIndex: number;
  explanation?: string;
}

export interface UserAnswer {
  questionId: number;
  selectedOptionIndex: number;
  isCorrect: boolean;
}

export interface TopicPerformance {
  topic: string;
  score: number;
  status: 'Strength' | 'Weakness' | 'Average';
  advice: string;
}

export interface QuizAnalysis {
  totalScore: number;
  correctCount: number;
  totalQuestions: number;
  feedback: string;
  topicBreakdown: TopicPerformance[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
  isEdited?: boolean;
  replyTo?: {
    id: string;
    text: string;
    role: string;
  };
}
