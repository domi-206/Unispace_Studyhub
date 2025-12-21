
import React, { useState, useEffect } from 'react';
import { TheoryQuestion, TheoryAnswer, TheoryStrategy } from '../types';

interface TheoryViewProps {
  questions: TheoryQuestion[];
  topic: string;
  strategy: TheoryStrategy;
  onComplete: (answers: TheoryAnswer[]) => void;
  onExit: () => void;
}

export const TheoryView: React.FC<TheoryViewProps> = ({ questions, topic, strategy, onComplete, onExit }) => {
  const REQUIRED_TOTAL = strategy === TheoryStrategy.FIVE_OF_SEVEN ? 5 : 3;
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Record<string, string>>>({});
  
  const [timeLeft, setTimeLeft] = useState(strategy === TheoryStrategy.FIVE_OF_SEVEN ? 90 * 60 : 60 * 60);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions[activeQuestionIdx];
  const totalAnswered = Object.keys(answers).length;
  const hasAnsweredQ1 = !!answers[questions[0].id];

  const handleInputChange = (label: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: {
        ...(prev[currentQuestion.id] || {}),
        [label]: value
      }
    }));
  };

  const handleSubmit = () => {
    if (totalAnswered < REQUIRED_TOTAL) {
      alert(`Please answer at least ${REQUIRED_TOTAL} questions in total.`);
      return;
    }
    if (!hasAnsweredQ1) {
      const confirmSubmit = window.confirm("Question 1 is compulsory and carries the highest marks. Submit without it?");
      if (!confirmSubmit) return;
    }

    const formattedAnswers: TheoryAnswer[] = Object.entries(answers).map(([id, parts]) => ({
      questionId: parseInt(id),
      partAnswers: Object.entries(parts).map(([label, text]) => ({ label, text }))
    }));

    onComplete(formattedAnswers);
  };

  return (
    <div className="max-w-6xl mx-auto w-full flex flex-col md:flex-row gap-8 items-start mb-20 px-4">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 flex-shrink-0 sticky top-24">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm mb-6">
           <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest">Question Paper</h3>
              <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase
                  ${timeLeft < 300 ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-900 text-white'}`}>
                {formatTime(timeLeft)}
              </div>
           </div>
           <div className="space-y-3">
             {questions.map((q, idx) => {
               const isAnswered = !!answers[q.id];
               const isActive = activeQuestionIdx === idx;
               const isQ1 = idx === 0;
               return (
                 <button
                   key={q.id}
                   onClick={() => setActiveQuestionIdx(idx)}
                   className={`w-full p-4 rounded-xl flex items-center justify-between border transition-all text-left relative overflow-hidden
                     ${isActive ? 'border-brand-green bg-green-50 ring-1 ring-brand-green' : 'border-slate-100 hover:bg-slate-50'}`}
                 >
                   <div className="flex flex-col">
                      <span className={`font-black text-sm ${isActive ? 'text-brand-green' : 'text-slate-600'}`}>Question {idx + 1}</span>
                      {isQ1 && <span className="text-[8px] font-black uppercase text-brand-green mt-0.5">Compulsory</span>}
                   </div>
                   {isAnswered && (
                     <div className="bg-brand-green rounded-full p-1 shadow-sm">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                     </div>
                   )}
                 </button>
               );
             })}
           </div>
           
           <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex justify-between items-center mb-2">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target</span>
                 <span className="text-[10px] font-black text-brand-green">{totalAnswered}/{REQUIRED_TOTAL} Completed</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-brand-green transition-all duration-700" 
                   style={{ width: `${Math.min(100, (totalAnswered/REQUIRED_TOTAL) * 100)}%` }}
                 ></div>
              </div>
           </div>
        </div>

        <button 
          onClick={onExit}
          className="w-full py-4 text-slate-400 hover:text-red-600 font-black text-xs uppercase tracking-[0.2em] transition-colors"
        >
          Discard Paper
        </button>
      </div>

      {/* Main Answer Area */}
      <div className="flex-1 space-y-8 animate-fade-in w-full">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="bg-brand-dark p-8 md:p-10 text-white relative">
             <div className="flex flex-wrap gap-2 mb-6">
               <span className="bg-brand-green text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-full shadow-lg">Question {activeQuestionIdx + 1}</span>
               {currentQuestion.isCompulsory && <span className="bg-white/20 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-full backdrop-blur-md">Compulsory Section</span>}
               <span className="bg-white/10 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-full backdrop-blur-md">{currentQuestion.totalPoints} Marks</span>
             </div>
             <h2 className="text-2xl md:text-3xl font-black leading-tight tracking-tight">{currentQuestion.mainPrompt}</h2>
             <div className="absolute right-8 top-8 opacity-5">
                <span className="text-8xl font-black">Q{activeQuestionIdx + 1}</span>
             </div>
          </div>

          <div className="p-8 md:p-12 space-y-12">
             {currentQuestion.parts.map((part) => (
               <div key={part.label} className="group">
                 <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-slate-900 flex items-center gap-3">
                       <span className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-sm font-black text-brand-green shadow-sm border border-green-100">{part.label}</span>
                       <span className="text-lg md:text-xl">{part.text}</span>
                    </h4>
                    <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-full">({part.points} Marks)</span>
                 </div>
                 <textarea
                   value={answers[currentQuestion.id]?.[part.label] || ''}
                   onChange={(e) => handleInputChange(part.label, e.target.value)}
                   placeholder="Type your comprehensive answer here... AI will grade based on mandatory keywords."
                   className="w-full p-8 bg-slate-50 border-2 border-transparent focus:border-brand-green focus:bg-white rounded-3xl outline-none min-h-[160px] transition-all text-slate-800 shadow-inner text-lg leading-relaxed font-medium"
                 ></textarea>
               </div>
             ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
           <button
             onClick={() => {
               setActiveQuestionIdx(Math.max(0, activeQuestionIdx - 1));
               window.scrollTo({ top: 0, behavior: 'smooth' });
             }}
             disabled={activeQuestionIdx === 0}
             className="w-full sm:w-auto px-10 py-5 font-black text-slate-400 hover:text-slate-900 disabled:opacity-20 transition-all uppercase tracking-widest text-xs"
           >
             ← Previous
           </button>
           
           <div className="flex gap-4 w-full sm:w-auto">
              {activeQuestionIdx < questions.length - 1 && (
                <button
                   onClick={() => {
                     setActiveQuestionIdx(Math.min(questions.length - 1, activeQuestionIdx + 1));
                     window.scrollTo({ top: 0, behavior: 'smooth' });
                   }}
                   className="flex-1 sm:flex-none px-10 py-5 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-black transition-all uppercase tracking-widest text-xs"
                >
                  Next Question →
                </button>
              )}
              
              <button
                onClick={handleSubmit}
                className={`flex-1 sm:flex-none px-12 py-5 font-black rounded-2xl shadow-2xl transition-all uppercase tracking-widest text-xs
                  ${totalAnswered >= REQUIRED_TOTAL ? 'bg-brand-green text-white hover:bg-green-700 shadow-green-100 scale-105' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
              >
                Submit Paper
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};
