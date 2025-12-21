
import React, { useState } from 'react';
import { QuizSettings } from '../types';

interface QuizSetupProps {
  onStart: (settings: QuizSettings) => void;
  onCancel: () => void;
}

export const QuizSetup: React.FC<QuizSetupProps> = ({ onStart, onCancel }) => {
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [timerMode, setTimerMode] = useState<'unlimited' | 'question_timer' | 'quiz_timer'>('unlimited');
  const [timeLimit, setTimeLimit] = useState<number>(60);
  const [totalMinutes, setTotalMinutes] = useState<number>(30);

  const handleStart = () => {
    let finalTimeLimit = 0;
    if (timerMode === 'question_timer') {
      finalTimeLimit = timeLimit;
    } else if (timerMode === 'quiz_timer') {
      finalTimeLimit = totalMinutes;
    }

    onStart({
      questionCount,
      timerMode,
      timeLimit: finalTimeLimit
    });
  };

  return (
    <div className="max-w-2xl mx-auto w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8 md:p-10 animate-fade-in-up">
      <div className="mb-8">
        <button onClick={onCancel} className="text-slate-500 hover:text-brand-dark flex items-center gap-2 text-sm font-black mb-4 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
        <h2 className="text-3xl font-black text-brand-dark tracking-tight">Quiz Configuration</h2>
        <p className="text-slate-500 mt-1 font-medium">Fine-tune your Unispace learning session.</p>
      </div>

      <div className="space-y-10">
        <div>
          <label className="flex justify-between text-sm font-black text-slate-700 mb-6 uppercase tracking-wider">
            <span>Questions</span>
            <span className="text-brand-green bg-green-50 px-3 py-1 rounded-lg font-black">{questionCount}</span>
          </label>
          <input
            type="range"
            min="10"
            max="100"
            step="5"
            value={questionCount}
            onChange={(e) => setQuestionCount(parseInt(e.target.value))}
            className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-brand-green border border-slate-200"
          />
        </div>

        <div>
          <label className="text-sm font-black text-slate-700 mb-6 block uppercase tracking-wider">Timer Preference</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              onClick={() => setTimerMode('unlimited')}
              className={`p-5 border-2 rounded-2xl cursor-pointer transition-all flex flex-col items-center justify-center gap-3
                ${timerMode === 'unlimited' ? 'border-brand-green bg-green-50 text-brand-green' : 'border-slate-100 hover:border-slate-300'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-black text-sm uppercase">No Limit</span>
            </div>
            
            <div 
              onClick={() => setTimerMode('question_timer')}
              className={`p-5 border-2 rounded-2xl cursor-pointer transition-all flex flex-col items-center justify-center gap-3
                ${timerMode === 'question_timer' ? 'border-brand-green bg-green-50 text-brand-green' : 'border-slate-100 hover:border-slate-300'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="font-black text-sm uppercase">Per Question</span>
            </div>

            <div 
              onClick={() => setTimerMode('quiz_timer')}
              className={`p-5 border-2 rounded-2xl cursor-pointer transition-all flex flex-col items-center justify-center gap-3
                ${timerMode === 'quiz_timer' ? 'border-brand-green bg-green-50 text-brand-green' : 'border-slate-100 hover:border-slate-300'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-black text-sm uppercase">Exam Mode</span>
            </div>
          </div>

          <div className="mt-8 bg-slate-50 p-6 rounded-2xl border border-slate-100 min-h-[120px] flex items-center justify-center">
             {timerMode === 'unlimited' && (
               <p className="text-slate-500 text-sm font-medium italic text-center">Standard learning pace. Take your time to understand each concept.</p>
             )}

             {timerMode === 'question_timer' && (
               <div className="w-full">
                 <label className="text-[10px] font-black text-slate-400 mb-4 block uppercase tracking-[0.2em] text-center">Time per slide</label>
                 <div className="flex gap-2 justify-center flex-wrap">
                   {[30, 45, 60, 90, 120].map((sec) => (
                     <button
                      key={sec}
                      onClick={() => setTimeLimit(sec)}
                      className={`px-5 py-2.5 text-sm font-black rounded-xl border transition-all
                        ${timeLimit === sec 
                          ? 'bg-brand-green text-white border-brand-green shadow-lg shadow-green-100' 
                          : 'bg-white text-slate-600 border-slate-200 hover:border-brand-green'}`}
                     >
                       {sec}s
                     </button>
                   ))}
                 </div>
               </div>
             )}

             {timerMode === 'quiz_timer' && (
               <div className="w-full px-4">
                 <label className="flex justify-between text-[10px] font-black text-slate-400 mb-4 uppercase tracking-[0.2em]">
                    <span>Total Paper Time</span>
                    <span className="text-brand-green">{totalMinutes}m</span>
                 </label>
                 <input
                    type="range"
                    min="10"
                    max="90"
                    step="5"
                    value={totalMinutes}
                    onChange={(e) => setTotalMinutes(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-brand-green"
                  />
               </div>
             )}
          </div>
        </div>

        <button
          onClick={handleStart}
          className="w-full py-5 bg-brand-green text-white rounded-2xl font-black text-xl shadow-xl shadow-green-200 hover:bg-green-700 hover:-translate-y-1 transition-all"
        >
          Initialize Quiz
        </button>
      </div>
    </div>
  );
};
