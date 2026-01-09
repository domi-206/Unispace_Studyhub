
import React, { useState, useEffect } from 'react';
import { 
  AppMode, QuizQuestion, QuizAnalysis, UserAnswer, QuizSettings, 
  TheoryQuestion, TheoryDifficulty, TheoryExamAnalysis, TheoryAnswer, TheoryStrategy,
  PodcastConfig, PodcastResult, QuizHistoryItem, ChatHistoryItem, ChatMessage
} from './types';
import { 
  fileToGenerativePart, generateQuiz, analyzeQuizResults, extractTopics, 
  generateTheoryExam, gradeTheoryExam, generatePodcast 
} from './services/geminiService';
import { FileUpload } from './components/FileUpload';
import { QuizView } from './components/QuizView';
import { ChatView } from './components/ChatView';
import { AnalysisView } from './components/AnalysisView';
import { QuizSetup } from './components/QuizSetup';
import { LoadingView } from './components/LoadingView';
import { TheorySetup } from './components/TheorySetup';
import { TheoryView } from './components/TheoryView';
import { TheoryAnalysisView } from './components/TheoryAnalysisView';
import { PodcastSetup } from './components/PodcastSetup';
import { PodcastView } from './components/PodcastView';
import { HistoryView } from './components/HistoryView';

const UnispaceLogo = () => (
  <div className="flex items-center gap-1 scale-90 md:scale-100">
    <div className="bg-brand-green text-white w-10 h-10 rounded-xl flex items-center justify-center font-black text-2xl shadow-sm">
      U
    </div>
    <span className="font-bold text-3xl text-brand-dark dark:text-white tracking-tighter ml-1">niSpace</span>
  </div>
);

const CourseMaster: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.UPLOAD);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [topics, setTopics] = useState<string[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
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

  // Podcast State
  const [currentPodcast, setCurrentPodcast] = useState<PodcastResult | null>(null);

  // History State
  const [quizHistory, setQuizHistory] = useState<QuizHistoryItem[]>([]);
  const [podcastHistory, setPodcastHistory] = useState<PodcastResult[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('unispace_theme') as 'light' | 'dark';
    if (savedTheme) setTheme(savedTheme);

    const qh = localStorage.getItem('unispace_quiz_history');
    const ph = localStorage.getItem('unispace_podcast_history');
    const ch = localStorage.getItem('unispace_chat_history');
    if (qh) setQuizHistory(JSON.parse(qh));
    if (ph) setPodcastHistory(JSON.parse(ph));
    if (ch) setChatHistory(JSON.parse(ch));
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('unispace_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const saveQuizHistory = (score: number) => {
    const newItem: QuizHistoryItem = {
      id: Date.now().toString(),
      fileName: fileName,
      score: score,
      timestamp: Date.now()
    };
    const updated = [newItem, ...quizHistory].slice(0, 50);
    setQuizHistory(updated);
    try {
      localStorage.setItem('unispace_quiz_history', JSON.stringify(updated));
    } catch (e) { console.error("History save failed", e); }
  };

  const savePodcastHistory = (podcast: PodcastResult) => {
    const updatedInState = [podcast, ...podcastHistory].slice(0, 20);
    setPodcastHistory(updatedInState);
    const storageData = updatedInState.map(({ audioBase64, ...rest }) => rest);
    try {
      localStorage.setItem('unispace_podcast_history', JSON.stringify(storageData));
    } catch (e) {
      try {
        localStorage.setItem('unispace_podcast_history', JSON.stringify(storageData.slice(0, 5)));
      } catch (inner) {}
    }
  };

  const saveChatHistory = (messages: ChatMessage[]) => {
    if (messages.length <= 1) return;
    const id = currentChatId || Date.now().toString();
    const newItem: ChatHistoryItem = {
      id,
      fileName,
      preview: messages[messages.length - 1].text.substring(0, 100) + '...',
      timestamp: Date.now(),
      messages
    };
    const updated = chatHistory.filter(c => c.id !== id);
    const final = [newItem, ...updated].slice(0, 20);
    setChatHistory(final);
    try {
      localStorage.setItem('unispace_chat_history', JSON.stringify(final));
    } catch (e) { console.error("Chat save failed", e); }
    if (!currentChatId) setCurrentChatId(id);
  };

  const handleFileSelect = async (file: File) => {
    setLoading(true);
    setLoadingMessage('Unispace is scanning your document...');
    try {
      const base64 = await fileToGenerativePart(file);
      const extractedTopics = await extractTopics(base64);
      setFileBase64(base64);
      setFileName(file.name);
      setTopics(extractedTopics);
      setMode(AppMode.MENU);
      setCurrentChatId(null);
    } catch (err) {
      alert("Unispace was unable to process this document.");
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
      alert("Failed to generate quiz.");
    } finally {
      setLoading(false);
    }
  };

  const handleTheorySetupComplete = async (topic: string, diff: TheoryDifficulty, strategy: TheoryStrategy) => {
    setCurrentTheoryTopic(topic);
    setCurrentTheoryStrategy(strategy);
    setLoading(true);
    setLoadingMessage(`Designing your theory paper...`);
    try {
      const questions = await generateTheoryExam(fileBase64, topic, diff, strategy);
      setTheoryQuestions(questions);
      setMode(AppMode.THEORY_EXAM);
    } catch (err) {
      alert("Failed to generate theory paper.");
    } finally {
      setLoading(false);
    }
  };

  const handlePodcastSetupComplete = async (config: PodcastConfig) => {
    setLoading(true);
    setLoadingMessage(`Synthesizing ${config.duration} minute lesson...`);
    try {
      const result = await generatePodcast(fileBase64, config);
      setCurrentPodcast(result);
      savePodcastHistory(result);
      setMode(AppMode.PODCAST_VIEW);
    } catch (err) {
      alert("Podcast synthesis failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleTheoryComplete = async (answers: TheoryAnswer[]) => {
    setLoading(true);
    setLoadingMessage('AI Tutor is marking your script...');
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
    setLoadingMessage('Analyzing performance...');
    try {
      const analysis = await analyzeQuizResults(fileBase64, quizQuestions, answers);
      setQuizAnalysis(analysis);
      saveQuizHistory(analysis.totalScore);
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
    setCurrentChatId(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans transition-colors duration-300">
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 md:px-10 py-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <div className="cursor-pointer" onClick={resetApp}>
          <UnispaceLogo />
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            title="Toggle Light/Dark Mode"
          >
            {theme === 'light' ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.243 17.657l.707-.707M7.757 6.343l.707-.707" /></svg>
            )}
          </button>
          <button 
            onClick={() => setMode(AppMode.HISTORY)}
            className="hidden md:flex items-center gap-2 text-[10px] font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all uppercase tracking-widest"
          >
            Study Records
          </button>
          {fileName && (
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-brand-green/10 rounded-xl border border-brand-green/20">
              <div className="w-2 h-2 rounded-full bg-brand-green animate-pulse"></div>
              <span className="text-sm font-bold text-brand-green line-clamp-1 max-w-[120px]">{fileName}</span>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 flex flex-col items-center">
        {loading && <LoadingView message={loadingMessage} />}

        {mode === AppMode.UPLOAD && (
          <div className="mt-12 w-full max-w-4xl text-center animate-fade-in-up">
            <h1 className="text-4xl md:text-6xl font-black text-brand-dark dark:text-white mb-6 tracking-tight leading-tight">
              Master Any Course With <span className="text-brand-green">Unispace</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl mb-12 max-w-2xl mx-auto font-medium">
              Transform your PDFs into interactive quizzes, high-fidelity podcasts, and custom exams.
            </p>
            <FileUpload onFileSelect={handleFileSelect} />
          </div>
        )}

        {mode === AppMode.MENU && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-7xl mt-12 animate-fade-in">
             {[
               { mode: AppMode.QUIZ_SETUP, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', title: 'Quiz Engine', desc: 'Test recall with MCQ/TF.' },
               { mode: AppMode.THEORY_SETUP, icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', title: 'Theory Exam', desc: 'Deep-dive script testing.' },
               { mode: AppMode.PODCAST_SETUP, icon: 'M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z', title: 'Study Podcast', desc: 'Audio lessons on the go.' },
               { mode: AppMode.CHAT, icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z', title: 'AI Tutor', desc: 'Ask your documents.' }
             ].map((item, i) => (
               <div key={i} onClick={() => setMode(item.mode)} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 hover:border-brand-green hover:shadow-2xl transition-all cursor-pointer group text-center">
                  <div className="bg-green-50 dark:bg-brand-green/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-brand-green group-hover:text-white transition-all duration-300">
                     <svg className="w-8 h-8 text-brand-green group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
                  </div>
                  <h3 className="text-xl font-black text-brand-dark dark:text-white mb-2">{item.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">{item.desc}</p>
               </div>
             ))}
          </div>
        )}

        {mode === AppMode.HISTORY && (
          <HistoryView 
             quizHistory={quizHistory} 
             podcastHistory={podcastHistory} 
             chatHistory={chatHistory} 
             onBack={() => setMode(fileBase64 ? AppMode.MENU : AppMode.UPLOAD)} 
             onOpenPodcast={(p) => { setCurrentPodcast(p); setMode(AppMode.PODCAST_VIEW); }}
             onOpenChat={(c) => { setCurrentChatId(c.id); setMode(AppMode.CHAT); }}
          />
        )}

        {mode === AppMode.PODCAST_SETUP && <PodcastSetup topics={topics} onStart={handlePodcastSetupComplete} onCancel={() => setMode(AppMode.MENU)} />}
        {mode === AppMode.PODCAST_VIEW && currentPodcast && <PodcastView podcast={currentPodcast} onBack={() => setMode(AppMode.MENU)} />}

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
        
        {mode === AppMode.CHAT && (
          <ChatView 
            fileBase64={fileBase64} 
            initialHistory={currentChatId ? chatHistory.find(c => c.id === currentChatId)?.messages : undefined}
            onExit={() => setMode(AppMode.MENU)} 
            onUpdateHistory={saveChatHistory}
            chatHistory={chatHistory}
            onSelectChat={(c) => setCurrentChatId(c.id)}
            onNewChat={() => setCurrentChatId(null)}
          />
        )}
        
        {mode === AppMode.ANALYSIS && quizAnalysis && <AnalysisView analysis={quizAnalysis} questions={quizQuestions} userAnswers={userAnswers} fileBase64={fileBase64} onBack={() => setMode(AppMode.MENU)} onRetake={() => setMode(AppMode.QUIZ_SETUP)} />}
        {mode === AppMode.THEORY_ANALYSIS && theoryAnalysis && <TheoryAnalysisView analysis={theoryAnalysis} questions={theoryQuestions} fileBase64={fileBase64} onBack={() => setMode(AppMode.MENU)} />}
      </main>
    </div>
  );
};

export default CourseMaster;
