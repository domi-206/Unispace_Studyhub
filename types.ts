export enum AppMode {
  UPLOAD = 'UPLOAD',
  MENU = 'MENU',
  QUIZ_SETUP = 'QUIZ_SETUP',
  QUIZ = 'QUIZ',
  CHAT = 'CHAT',
  ANALYSIS = 'ANALYSIS'
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE'
}

export interface QuizSettings {
  questionCount: number;
  timerMode: 'unlimited' | 'timed';
  secondsPerQuestion: number;
}

export interface QuizQuestion {
  id: number;
  topic: string;
  text: string;
  type: QuestionType;
  options: string[]; // For MC, usually 4. For T/F, ["True", "False"]
  correctAnswerIndex: number; // 0-based index
  explanation?: string;
}

export interface UserAnswer {
  questionId: number;
  selectedOptionIndex: number;
  isCorrect: boolean;
}

export interface TopicPerformance {
  topic: string;
  score: number; // percentage or count
  status: 'Strength' | 'Weakness' | 'Average';
  advice: string;
}

export interface QuizAnalysis {
  totalScore: number; // Percentage
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
}