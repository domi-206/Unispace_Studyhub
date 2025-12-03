import React, { useState } from 'react';
import { AppMode, QuizQuestion, QuizAnalysis, UserAnswer, QuizSettings } from './types';
import { fileToGenerativePart, generateQuiz, analyzeQuizResults } from './services/geminiService';
import { FileUpload } from './components/FileUpload';
import { QuizView } from './components/QuizView';
import { ChatView } from './components/ChatView';
import { AnalysisView } from './components/AnalysisView';
import { QuizSetup } from './components/QuizSetup';
import { LoadingView } from './components/LoadingView';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.UPLOAD);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  
  // Quiz State
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizAnalysis, setQuizAnalysis] = useState<QuizAnalysis | null>(null);
  const [quizSettings, setQuizSettings] = useState<QuizSettings | null>(null);

  const handleFileSelect = async (file: File) => {
    setLoading(true);
    setLoadingMessage('Processing PDF file...');
    try {
      const base64 = await fileToGenerativePart(file);
      setFileBase64(base64);
      setFileName(file.name);
      setMode(AppMode.MENU);
    } catch (err) {
      console.error(err);
      alert("Failed to process file.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuizSetupComplete = async (settings: QuizSettings) => {
    setQuizSettings(settings);
    setLoading(true);
    setLoadingMessage(`Generating ${settings.questionCount} questions...`);
    try {
      const questions = await generateQuiz(fileBase64, settings.questionCount);
      setQuizQuestions(questions);
      setMode(AppMode.QUIZ);
    } catch (err) {
      console.error(err);
      alert("Failed to generate quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuizComplete = async (answers: UserAnswer[]) => {
    setLoading(true);
    setLoadingMessage('Analyzing your performance...');
    try {
      const analysis = await analyzeQuizResults(fileBase64, quizQuestions, answers);
      setQuizAnalysis(analysis);
      setMode(AppMode.ANALYSIS);
    } catch (err) {
      console.error(err);
      alert("Failed to analyze results.");
    } finally {
      setLoading(false);
    }
  };

  const startChat = () => {
    setMode(AppMode.CHAT);
  };

  const resetApp = () => {
    setMode(AppMode.UPLOAD);
    setFileBase64('');
    setFileName('');
    setQuizQuestions([]);
    setQuizAnalysis(null);
    setQuizSettings(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-2 cursor-pointer" onClick={resetApp}>
          <div className="bg-green-600 text-white p-1.5 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span className="font-bold text-xl text-slate-800 tracking-tight">Study Hub</span>
        </div>
        {fileName && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm text-slate-600 truncate max-w-[150px]">{fileName}</span>
            <button onClick={resetApp} className="text-slate-400 hover:text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-start p-6 relative">
        
        {loading && <LoadingView message={loadingMessage} />}

        {mode === AppMode.UPLOAD && (
          <div className="flex flex-col items-center justify-center h-full w-full mt-10 animate-fade-in-up">
            <h1 className="text-4xl font-extrabold text-slate-900 mb-3 text-center">Welcome to the Study Hub</h1>
            <p className="text-slate-500 text-lg mb-10 text-center max-w-2xl">Your central space for learning. Upload materials, generate quizzes, and get answers instantly.</p>
            <FileUpload onFileSelect={handleFileSelect} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16 max-w-4xl w-full">
               <div className="text-center p-6">
                 <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                 </div>
                 <h3 className="font-bold text-slate-900">AI Quiz Generation</h3>
                 <p className="text-slate-500 text-sm mt-2">Automatically create quizzes from your uploaded documents to test your knowledge.</p>
               </div>
               <div className="text-center p-6">
                 <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                 </div>
                 <h3 className="font-bold text-slate-900">Ask Your Document</h3>
                 <p className="text-slate-500 text-sm mt-2">Get quick answers and summaries for specific questions about your study material.</p>
               </div>
            </div>
          </div>
        )}

        {mode === AppMode.MENU && (
          <div className="w-full max-w-4xl mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
            {/* Quiz Option */}
            <div 
              onClick={() => setMode(AppMode.QUIZ_SETUP)}
              className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-green-400 transition-all cursor-pointer group flex flex-col items-center text-center"
            >
              <div className="bg-green-50 p-6 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Start Quiz Session</h2>
              <p className="text-slate-500">Test your knowledge with custom quizzes generated from your document. Get instant feedback and study tips.</p>
            </div>

            {/* Chat Option */}
            <div 
              onClick={startChat}
              className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-emerald-400 transition-all cursor-pointer group flex flex-col items-center text-center"
            >
              <div className="bg-emerald-50 p-6 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Ask a Question</h2>
              <p className="text-slate-500">Have a specific doubt? Chat with the AI tutor. It answers strictly based on the content of your PDF.</p>
            </div>
          </div>
        )}

        {mode === AppMode.QUIZ_SETUP && (
          <QuizSetup 
            onStart={handleQuizSetupComplete} 
            onCancel={() => setMode(AppMode.MENU)}
          />
        )}

        {mode === AppMode.QUIZ && quizQuestions.length > 0 && quizSettings && (
          <QuizView 
            questions={quizQuestions}
            settings={quizSettings}
            fileName={fileName}
            onComplete={handleQuizComplete} 
            onExit={() => setMode(AppMode.MENU)} 
          />
        )}

        {mode === AppMode.CHAT && (
          <ChatView 
            fileBase64={fileBase64} 
            onExit={() => setMode(AppMode.MENU)} 
          />
        )}

        {mode === AppMode.ANALYSIS && quizAnalysis && (
          <AnalysisView 
            analysis={quizAnalysis} 
            onBack={() => setMode(AppMode.MENU)} 
          />
        )}
      </main>
    </div>
  );
};

export default App;