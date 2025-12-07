import React, { useState } from 'react';
import { QuizSettings } from '../types';

interface QuizSetupProps {
  onStart: (settings: QuizSettings) => void;
  onCancel: () => void;
}

export const QuizSetup: React.FC<QuizSetupProps> = ({ onStart, onCancel }) => {
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [timerMode, setTimerMode] = useState<'unlimited' | 'question_timer' | 'quiz_timer'>('unlimited');
  const [timeLimit, setTimeLimit] = useState<number>(60); // Default 60s for question timer
  const [totalMinutes, setTotalMinutes] = useState<number>(30); // Default 30m for total timer

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
    <div className="max-w-2xl mx-auto w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 animate-fade-in">
      <div className="mb-8 border-b border-slate-100 pb-4">
        <button onClick={onCancel} className="text-slate-500 hover:text-slate-800 flex items-center gap-2 text-sm font-medium mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Menu
        </button>
        <h2 className="text-2xl font-bold text-slate-800">Configure Your Quiz</h2>
        <p className="text-slate-500 mt-1">Customize the quiz experience to match your learning needs.</p>
      </div>

      <div className="space-y-8">
        {/* Question Count Slider */}
        <div>
          <label className="flex justify-between text-sm font-semibold text-slate-700 mb-4">
            <span>Number of Questions</span>
            <span className="text-green-600 bg-green-50 px-3 py-1 rounded font-bold">{questionCount}</span>
          </label>
          <input
            type="range"
            min="10"
            max="100"
            step="5"
            value={questionCount}
            onChange={(e) => setQuestionCount(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-600"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-2">
            <span>10</span>
            <span>100</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Higher question counts will cover more topics but take longer to generate.
          </p>
        </div>

        {/* Timer Settings */}
        <div>
          <label className="text-sm font-semibold text-slate-700 mb-4 block">Timer Settings</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Unlimited */}
            <div 
              onClick={() => setTimerMode('unlimited')}
              className={`p-4 border-2 rounded-xl cursor-pointer transition-all flex flex-col items-center justify-center gap-2
                ${timerMode === 'unlimited' ? 'border-green-600 bg-green-50 text-green-700' : 'border-slate-200 hover:border-green-300'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-bold text-sm">Unlimited</span>
            </div>
            
            {/* Per Question */}
            <div 
              onClick={() => setTimerMode('question_timer')}
              className={`p-4 border-2 rounded-xl cursor-pointer transition-all flex flex-col items-center justify-center gap-2
                ${timerMode === 'question_timer' ? 'border-green-600 bg-green-50 text-green-700' : 'border-slate-200 hover:border-green-300'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="font-bold text-sm">Per Question</span>
            </div>

            {/* Total Time */}
            <div 
              onClick={() => setTimerMode('quiz_timer')}
              className={`p-4 border-2 rounded-xl cursor-pointer transition-all flex flex-col items-center justify-center gap-2
                ${timerMode === 'quiz_timer' ? 'border-green-600 bg-green-50 text-green-700' : 'border-slate-200 hover:border-green-300'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-bold text-sm">Total Time</span>
            </div>
          </div>

          {/* Contextual Timer Options */}
          <div className="mt-6 bg-slate-50 p-4 rounded-xl border border-slate-100 min-h-[100px] flex items-center justify-center">
             {timerMode === 'unlimited' && (
               <p className="text-slate-500 text-sm">No time limits. Take as long as you need to answer.</p>
             )}

             {timerMode === 'question_timer' && (
               <div className="w-full">
                 <label className="text-xs font-semibold text-slate-500 mb-2 block uppercase tracking-wider text-center">Seconds per Question</label>
                 <div className="flex gap-2 justify-center">
                   {[30, 45, 60, 90, 120].map((sec) => (
                     <button
                      key={sec}
                      onClick={() => setTimeLimit(sec)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors
                        ${timeLimit === sec 
                          ? 'bg-green-600 text-white border-green-600' 
                          : 'bg-white text-slate-600 border-slate-200 hover:border-green-300'}`}
                     >
                       {sec}s
                     </button>
                   ))}
                 </div>
               </div>
             )}

             {timerMode === 'quiz_timer' && (
               <div className="w-full">
                 <label className="flex justify-between text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">
                    <span>Total Duration</span>
                    <span className="text-green-700 font-bold">{totalMinutes} Minutes</span>
                 </label>
                 <input
                    type="range"
                    min="10"
                    max="90"
                    step="5"
                    value={totalMinutes}
                    onChange={(e) => setTotalMinutes(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-2">
                    <span>10m</span>
                    <span>90m</span>
                  </div>
               </div>
             )}
          </div>
        </div>

        <button
          onClick={handleStart}
          className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-green-200 hover:bg-green-700 transform transition-all active:scale-[0.99]"
        >
          Generate Quiz
        </button>
      </div>
    </div>
  );
};