
import React, { useState, useEffect, useRef } from 'react';
import { QuizQuestion, UserAnswer, QuizSettings, QuestionType } from '../types';

interface QuizViewProps {
  questions: QuizQuestion[];
  settings: QuizSettings;
  fileName: string;
  onComplete: (answers: UserAnswer[]) => void;
  onExit: () => void;
}

export const QuizView: React.FC<QuizViewProps> = ({ questions, settings, fileName, onComplete, onExit }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answersMap, setAnswersMap] = useState<Record<number, { index: number, text?: string }>>({});
  
  const [timeLeft, setTimeLeft] = useState(
    settings.timerMode === 'quiz_timer' 
      ? settings.timeLimit * 60 
      : settings.timerMode === 'question_timer' ? settings.timeLimit : 0
  );
  
  const answersRef = useRef(answersMap);
  useEffect(() => { answersRef.current = answersMap; }, [answersMap]);

  const currentQuestion = questions[currentQuestionIndex];
  const currentSelected = answersMap[currentQuestion.id] || { index: -1 };

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
  }, [settings.timerMode, currentQuestionIndex]);

  useEffect(() => {
    if (settings.timerMode === 'question_timer') {
      setTimeLeft(settings.timeLimit);
    }
  }, [currentQuestionIndex, settings.timerMode, settings.timeLimit]);

  const handleTimeOver = () => {
    if (settings.timerMode === 'quiz_timer') {
      finishQuiz();
    } else {
      handleNext();
    }
  };

  const finishQuiz = () => {
    const finalAnswers: UserAnswer[] = questions.map(q => {
      const ans = answersRef.current[q.id];
      let isCorrect = false;
      if (q.type === QuestionType.FILL_IN_THE_GAP) {
        isCorrect = ans?.text?.toLowerCase().trim() === q.correctAnswerText?.toLowerCase().trim();
      } else {
        isCorrect = ans?.index === q.correctAnswerIndex;
      }
      return {
        questionId: q.id,
        selectedOptionIndex: ans?.index ?? -1,
        textAnswer: ans?.text,
        isCorrect
      };
    });
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
      [currentQuestion.id]: { index: idx }
    }));
  };

  const handleTextChange = (text: string) => {
    setAnswersMap(prev => ({
      ...prev,
      [currentQuestion.id]: { index: -1, text }
    }));
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      finishQuiz();
    }
  };

  const overallProgress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto w-full px-4 md:px-0">
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
              <h1 className="text-2xl font-bold text-slate-900">Unispace Quiz</h1>
              <p className="text-slate-500 text-sm mt-1 line-clamp-1">{fileName}</p>
            </div>
            <div className="flex items-center gap-3">
               <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-slate-100 text-slate-600 text-sm font-medium border border-slate-200">
                 {currentQuestionIndex + 1} / {questions.length}
               </span>
               {settings.timerMode !== 'unlimited' && (
                  <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-mono font-bold border
                    ${timeLeft < 10 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-slate-800 text-white border-slate-800'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {formatTime(timeLeft)}
                  </span>
               )}
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3">
            <div className="bg-brand-green h-3 rounded-full transition-all duration-500" style={{ width: `${overallProgress}%` }}></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative min-h-[400px]">
        <div className="bg-slate-50/50 px-8 py-4 border-b border-slate-100 flex justify-between items-center">
             <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">{currentQuestion.topic}</span>
             <span className="text-[10px] font-black text-brand-green bg-green-50 px-2 py-1 rounded uppercase">
                 {currentQuestion.type.replace(/_/g, ' ')}
             </span>
        </div>
        <div className="p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-8 leading-relaxed">
            {currentQuestion.text}
          </h2>

          {currentQuestion.type === QuestionType.FILL_IN_THE_GAP ? (
            <div className="mt-4">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-3">Your Answer:</label>
              <input 
                type="text" 
                autoFocus
                value={currentSelected.text || ''} 
                onChange={e => handleTextChange(e.target.value)}
                placeholder="Type the missing word..."
                className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-brand-green font-bold text-xl transition-all"
              />
            </div>
          ) : (
            <div className="space-y-3">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = currentSelected.index === idx;
                return (
                  <div 
                    key={idx}
                    onClick={() => handleOptionSelect(idx)}
                    className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-center gap-4 group
                      ${isSelected ? 'border-brand-green bg-green-50' : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border transition-colors
                      ${isSelected ? 'bg-brand-green text-white border-brand-green' : 'bg-slate-50 text-slate-500 border-slate-200 group-hover:border-slate-300'}`}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className={`text-base ${isSelected ? 'text-green-800 font-medium' : 'text-slate-600'}`}>
                      {option}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-between items-center mb-10">
         <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className={`px-6 py-3 rounded-lg font-bold transition-all flex items-center gap-2
              ${currentQuestionIndex === 0 ? 'text-slate-300' : 'text-slate-600 hover:bg-slate-100'}`}
         >
            ← Previous
         </button>
         <button
           onClick={handleNext}
           className="px-8 py-3 rounded-lg font-bold text-white shadow-lg transition-all flex items-center gap-2 bg-slate-900 hover:bg-black"
         >
           {currentQuestionIndex === questions.length - 1 ? 'Submit Results' : 'Next Question →'}
         </button>
      </div>
    </div>
  );
};
