import React, { useState, useEffect, useRef } from 'react';
import { QuizQuestion, UserAnswer, QuizSettings } from '../types';

interface QuizViewProps {
  questions: QuizQuestion[];
  settings: QuizSettings;
  fileName: string;
  onComplete: (answers: UserAnswer[]) => void;
  onExit: () => void;
}

export const QuizView: React.FC<QuizViewProps> = ({ questions, settings, fileName, onComplete, onExit }) => {
  // FLATTENED STATE: No more topic grouping for navigation
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Store all answers in a single map
  const [answersMap, setAnswersMap] = useState<Record<number, number>>({});
  
  // Timer State
  // Global timer (quiz_timer): Initialized once.
  // Question timer (question_timer): Resets on index change.
  const [timeLeft, setTimeLeft] = useState(
    settings.timerMode === 'quiz_timer' 
      ? settings.timeLimit * 60 
      : settings.timerMode === 'question_timer' ? settings.timeLimit : 0
  );
  
  // Ref to access current answers in timer callback without dependency loop
  const answersRef = useRef(answersMap);
  useEffect(() => { answersRef.current = answersMap; }, [answersMap]);

  const currentQuestion = questions[currentQuestionIndex];
  const currentSelectedOption = answersMap[currentQuestion.id] ?? null;

  // Timer Effect
  useEffect(() => {
    if (settings.timerMode === 'unlimited') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeOver();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [settings.timerMode, currentQuestionIndex]); // Re-bind to ensure closure freshness if needed

  // Reset Per-Question Timer when question changes
  useEffect(() => {
    if (settings.timerMode === 'question_timer') {
      setTimeLeft(settings.timeLimit);
    }
  }, [currentQuestionIndex, settings.timerMode, settings.timeLimit]);

  const handleTimeOver = () => {
    if (settings.timerMode === 'quiz_timer') {
      // Global time over: Force submit everything
      finishQuiz();
    } else {
      // Per question time over: Move to next question automatically
      handleNext();
    }
  };

  const finishQuiz = () => {
    const finalAnswers: UserAnswer[] = questions.map(q => ({
      questionId: q.id,
      selectedOptionIndex: answersRef.current[q.id] ?? -1, // Use ref to get latest
      isCorrect: answersRef.current[q.id] === q.correctAnswerIndex
    }));
    onComplete(finalAnswers);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOptionSelect = (idx: number) => {
    setAnswersMap(prev => ({
      ...prev,
      [currentQuestion.id]: idx
    }));
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Last question reached
      finishQuiz();
    }
  };

  // Progress calculation
  const overallProgress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto w-full px-4 md:px-0">
      {/* Header */}
      <div className="pt-8 pb-6">
        <button onClick={onExit} className="text-slate-500 hover:text-slate-800 flex items-center gap-2 text-sm font-medium mb-6 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Study Hub
        </button>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Quiz Session</h1>
              <p className="text-slate-500 text-sm mt-1">Based on "{fileName}"</p>
            </div>
            
            <div className="flex items-center gap-3">
               <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-slate-100 text-slate-600 text-sm font-medium border border-slate-200">
                 Question {currentQuestionIndex + 1} of {questions.length}
               </span>
               
               {/* Timer Display */}
               {settings.timerMode !== 'unlimited' && (
                  <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-mono font-bold border
                    ${timeLeft < 10 && settings.timerMode === 'question_timer' ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 
                      timeLeft < 60 && settings.timerMode === 'quiz_timer' ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' :
                      'bg-slate-800 text-white border-slate-800'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formatTime(timeLeft)}
                    {settings.timerMode === 'quiz_timer' && <span className="text-xs font-normal opacity-70 ml-1">left</span>}
                  </span>
               )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-3 mb-1">
            <div 
              className="bg-green-500 h-3 rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative min-h-[400px]">
        <div className="bg-slate-50/50 px-8 py-4 border-b border-slate-100 flex justify-between items-center">
             <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Topic: {currentQuestion.topic}</span>
             <span className="text-xs font-medium text-slate-400">
                 {currentQuestion.type === 'MULTIPLE_CHOICE' ? 'Multiple Choice' : 'True / False'}
             </span>
        </div>
        <div className="p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-8 leading-relaxed">
            {currentQuestion.text}
          </h2>

          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = currentSelectedOption === idx;
              
              return (
                <div 
                  key={idx}
                  onClick={() => handleOptionSelect(idx)}
                  className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-center gap-4 group
                    ${isSelected 
                       ? 'border-green-500 bg-green-50' 
                       : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border transition-colors
                    ${isSelected 
                      ? 'bg-green-600 text-white border-green-600' 
                      : 'bg-slate-50 text-slate-500 border-slate-200 group-hover:border-slate-300'}`}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className={`text-base ${isSelected ? 'text-green-800 font-medium' : 'text-slate-600'}`}>
                    {option}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="mt-6 flex justify-between items-center mb-10">
         <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className={`px-6 py-3 rounded-lg font-bold transition-all flex items-center gap-2
              ${currentQuestionIndex === 0 
                ? 'text-slate-300 cursor-not-allowed' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
         >
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Previous
         </button>

         <button
           onClick={handleNext}
           className={`px-8 py-3 rounded-lg font-bold text-white shadow-lg transition-all flex items-center gap-2
            ${currentQuestionIndex === questions.length - 1 
               ? 'bg-green-600 hover:bg-green-700 shadow-green-200' 
               : 'bg-slate-900 hover:bg-slate-800 shadow-slate-200'}`}
         >
           {currentQuestionIndex === questions.length - 1 ? 'Submit Quiz' : 'Next Question'}
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
             <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
           </svg>
         </button>
      </div>
    </div>
  );
};