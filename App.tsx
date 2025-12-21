
import React, { useState } from 'react';
import { AppMode, QuizQuestion, QuizAnalysis, UserAnswer, QuizSettings, TheoryQuestion, TheoryDifficulty, TheoryExamAnalysis, TheoryAnswer, TheoryStrategy } from './types';
import { fileToGenerativePart, generateQuiz, analyzeQuizResults, extractTopics, generateTheoryExam, gradeTheoryExam } from './services/geminiService';
import { FileUpload } from './components/FileUpload';
import { QuizView } from './components/QuizView';
import { ChatView } from './components/ChatView';
import { AnalysisView } from './components/AnalysisView';
import { QuizSetup } from './components/QuizSetup';
import { LoadingView } from './components/LoadingView';
import { TheorySetup } from './components/TheorySetup';
import { TheoryView } from './components/TheoryView';
import { TheoryAnalysisView } from './components/TheoryAnalysisView';

const UnispaceLogo = () => (
  <div className="flex items-center gap-1 scale-90 md:scale-100">
    <div className="bg-brand-green text-white w-10 h-10 rounded-xl flex items-center justify-center font-black text-2xl shadow-sm">
      U
    </div>
    <span className="font-bold text-3xl text-brand-dark tracking-tighter ml-1">niSpace</span>
  </div>
);

const CourseMaster: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.UPLOAD);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [topics, setTopics] = useState<string[]>([]);
  
  // MCQ State
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [quizAnalysis, setQuizAnalysis] = useState<QuizAnalysis | null>(null);
  const [quizSettings, setQuizSettings] = useState<QuizSettings | null>(null);

  // Theory State
  const [theoryQuestions, setTheoryQuestions] = useState<TheoryQuestion[]>([]);
  const [theoryAnalysis, setTheoryAnalysis] = useState<TheoryExamAnalysis | null>(null);
  const [currentTheoryTopic, setCurrentTheoryTopic] = useState<string>('');
  const [currentTheoryStrategy, setCurrentTheoryStrategy] = useState<TheoryStrategy>(TheoryStrategy.THREE_OF_FIVE);

  const handleFileSelect = async (file: File) => {
    setLoading(true);
    setLoadingMessage('Unispace is preparing your materials...');
    try {
      const base64 = await fileToGenerativePart(file);
      const extractedTopics = await extractTopics(base64);
      setFileBase64(base64);
      setFileName(file.name);
      setTopics(extractedTopics);
      setMode(AppMode.MENU);
    } catch (err) {
      alert("Failed to process document.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuizSetupComplete = async (settings: QuizSettings) => {
    setQuizSettings(settings);
    setLoading(true);
    setLoadingMessage(`Unispace is drafting your quiz...`);
    try {
      const questions = await generateQuiz(fileBase64, settings.questionCount);
      setQuizQuestions(questions);
      setMode(AppMode.QUIZ);
    } catch (err) {
      alert("AI Generation failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleTheorySetupComplete = async (topic: string, diff: TheoryDifficulty, strategy: TheoryStrategy) => {
    setCurrentTheoryTopic(topic);
    setCurrentTheoryStrategy(strategy);
    setLoading(true);
    setLoadingMessage(`Unispace is drafting a custom ${diff} paper...`);
    try {
      const questions = await generateTheoryExam(fileBase64, topic, diff, strategy);
      setTheoryQuestions(questions);
      setMode(AppMode.THEORY_EXAM);
    } catch (err) {
      alert("Paper generation failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleTheoryComplete = async (answers: TheoryAnswer[]) => {
    setLoading(true);
    setLoadingMessage('Unispace AI is evaluating your script...');
    try {
      const analysis = await gradeTheoryExam(fileBase64, theoryQuestions, answers);
      setTheoryAnalysis(analysis);
      setMode(AppMode.THEORY_ANALYSIS);
    } catch (err) {
      alert("Grading failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuizComplete = async (answers: UserAnswer[]) => {
    setUserAnswers(answers);
    setLoading(true);
    setLoadingMessage('Unispace is analyzing performance...');
    try {
      const analysis = await analyzeQuizResults(fileBase64, quizQuestions, answers);
      setQuizAnalysis(analysis);
      setMode(AppMode.ANALYSIS);
    } catch (err) {
      alert("Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  const resetApp = () => {
    setMode(AppMode.UPLOAD);
    setFileBase64('');
    setFileName('');
    setTheoryAnalysis(null);
    setQuizAnalysis(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 px-6 md:px-10 py-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <div className="cursor-pointer" onClick={resetApp}>
          <UnispaceLogo />
        </div>
        {fileName && (
          <div className="hidden md:flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-green animate-pulse"></div>
            <span className="text-sm font-bold text-slate-500 bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200">{fileName}</span>
          </div>
        )}
      </header>

      <main className="flex-1 p-4 md:p-8 flex flex-col items-center">
        {loading && <LoadingView message={loadingMessage} />}

        {mode === AppMode.UPLOAD && (
          <div className="mt-12 w-full max-w-4xl text-center animate-fade-in-up">
            <h1 className="text-4xl md:text-6xl font-black text-brand-dark mb-6 tracking-tight leading-tight">
              Master Any Course With <span className="text-brand-green">Unispace</span>
            </h1>
            <p className="text-slate-500 text-lg md:text-xl mb-12 max-w-2xl mx-auto font-medium">
              Upload your PDF for interactive quizzes, targeted theoretical exams, and 1-on-1 AI tutoring.
            </p>
            <FileUpload onFileSelect={handleFileSelect} />
          </div>
        )}

        {mode === AppMode.MENU && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl mt-12 animate-fade-in">
             <div onClick={() => setMode(AppMode.QUIZ_SETUP)} className="bg-white p-10 rounded-3xl border border-slate-200 hover:border-brand-green hover:shadow-2xl transition-all cursor-pointer group text-center">
                <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform">
                   <svg className="w-10 h-10 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                </div>
                <h3 className="text-2xl font-black text-brand-dark mb-4">Quiz Engine</h3>
                <p className="text-slate-500 font-medium">Fast-paced MCQs and T/F questions to test recall.</p>
             </div>

             <div onClick={() => setMode(AppMode.THEORY_SETUP)} className="bg-white p-10 rounded-3xl border border-slate-200 hover:border-brand-green hover:shadow-2xl transition-all cursor-pointer group text-center">
                <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform">
                   <svg className="w-10 h-10 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </div>
                <h3 className="text-2xl font-black text-brand-dark mb-4">Theoretical Exam</h3>
                <p className="text-slate-500 font-medium">Typed answers, compulsory sections, and keyword grading.</p>
             </div>

             <div onClick={() => setMode(AppMode.CHAT)} className="bg-white p-10 rounded-3xl border border-slate-200 hover:border-brand-green hover:shadow-2xl transition-all cursor-pointer group text-center">
                <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform">
                   <svg className="w-10 h-10 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                </div>
                <h3 className="text-2xl font-black text-brand-dark mb-4">AI Tutor Chat</h3>
                <p className="text-slate-500 font-medium">Ask questions directly to the document and get clear explanations.</p>
             </div>
          </div>
        )}

        {mode === AppMode.QUIZ_SETUP && <QuizSetup onStart={handleQuizSetupComplete} onCancel={() => setMode(AppMode.MENU)} />}
        {mode === AppMode.THEORY_SETUP && <TheorySetup topics={topics} onStart={handleTheorySetupComplete} onCancel={() => setMode(AppMode.MENU)} />}
        
        {mode === AppMode.QUIZ && <QuizView questions={quizQuestions} settings={quizSettings!} fileName={fileName} onComplete={handleQuizComplete} onExit={() => setMode(AppMode.MENU)} />}
        {mode === AppMode.THEORY_EXAM && (
          <TheoryView 
            questions={theoryQuestions} 
            topic={currentTheoryTopic} 
            strategy={currentTheoryStrategy}
            onComplete={handleTheoryComplete} 
            onExit={() => setMode(AppMode.MENU)} 
          />
        )}
        
        {mode === AppMode.CHAT && <ChatView fileBase64={fileBase64} onExit={() => setMode(AppMode.MENU)} />}
        
        {mode === AppMode.ANALYSIS && quizAnalysis && <AnalysisView analysis={quizAnalysis} questions={quizQuestions} userAnswers={userAnswers} onBack={() => setMode(AppMode.MENU)} onRetake={() => setMode(AppMode.QUIZ_SETUP)} />}
        {mode === AppMode.THEORY_ANALYSIS && theoryAnalysis && <TheoryAnalysisView analysis={theoryAnalysis} questions={theoryQuestions} onBack={() => setMode(AppMode.MENU)} />}
      </main>
    </div>
  );
};

export default CourseMaster;
