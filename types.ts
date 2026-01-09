
export enum AppMode {
  UPLOAD = 'UPLOAD',
  MENU = 'MENU',
  QUIZ_SETUP = 'QUIZ_SETUP',
  QUIZ = 'QUIZ',
  CHAT = 'CHAT',
  ANALYSIS = 'ANALYSIS',
  THEORY_SETUP = 'THEORY_SETUP',
  THEORY_EXAM = 'THEORY_EXAM',
  THEORY_ANALYSIS = 'THEORY_ANALYSIS',
  PODCAST_SETUP = 'PODCAST_SETUP',
  PODCAST_VIEW = 'PODCAST_VIEW',
  HISTORY = 'HISTORY'
}

export enum Accent {
  NIGERIAN = 'Nigerian',
  US = 'US',
  UK = 'UK'
}

export enum Tone {
  FRIENDLY = 'Friendly',
  PROFESSIONAL = 'Professional',
  TEACHER = 'Teacher',
  FUNNY = 'Funny'
}

export interface TTSConfig {
  accent: Accent;
  tone: Tone;
}

export interface PodcastConfig extends TTSConfig {
  hostType: 'single' | 'double';
  hostNames: string[];
  duration: number; // minutes
  topic: string;
}

export interface PodcastResult {
  id: string;
  topic: string;
  audioBase64?: string; // Optional for history/localStorage
  transcript: string;
  timestamp: number;
}

export interface QuizHistoryItem {
  id: string;
  fileName: string;
  score: number;
  timestamp: number;
}

export interface ChatHistoryItem {
  id: string;
  fileName: string;
  preview: string;
  timestamp: number;
  messages: ChatMessage[];
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
  pageNumber?: number;
}

export interface TheoryGrade {
  questionId: number;
  totalScore: number;
  parts: TheoryGradePart[];
}

export interface TheoryExamAnalysis {
  finalScore: number; 
  passed: boolean;
  topicStrengths: string[];
  topicWeaknesses: string[];
  generalFeedback: string;
  grades: TheoryGrade[];
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
  FILL_IN_THE_GAP = 'FILL_IN_THE_GAP'
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
  correctAnswerText?: string; // For fill in the gap
  explanation?: string;
  pageNumber?: number;
}

export interface UserAnswer {
  questionId: number;
  selectedOptionIndex: number;
  textAnswer?: string; // For fill in the gap
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
  pageReferences?: number[];
  replyTo?: {
    id: string;
    text: string;
    role: string;
  };
}
