
import React, { useState } from 'react';
import { TheoryDifficulty, TheoryStrategy } from '../types';

interface TheorySetupProps {
  topics: string[];
  onStart: (topic: string, difficulty: TheoryDifficulty, strategy: TheoryStrategy) => void;
  onCancel: () => void;
}

export const TheorySetup: React.FC<TheorySetupProps> = ({ topics, onStart, onCancel }) => {
  const [selectedTopic, setSelectedTopic] = useState(topics[0]);
  const [difficulty, setDifficulty] = useState(TheoryDifficulty.MODERATE);
  const [strategy, setStrategy] = useState(TheoryStrategy.THREE_OF_FIVE);

  return (
    <div className="max-w-2xl mx-auto w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8 md:p-10 animate-fade-in-up">
      <div className="mb-8 border-b border-slate-50 pb-6">
        <button onClick={onCancel} className="text-slate-500 hover:text-brand-dark flex items-center gap-2 text-sm font-black mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back
        </button>
        <h2 className="text-3xl font-black text-brand-dark tracking-tight">Theoretical Exam Setup</h2>
        <p className="text-slate-500 mt-2 font-medium">Unispace specialized deep-testing for mastery.</p>
      </div>

      <div className="space-y-10">
        <div>
          <label className="text-xs font-black text-slate-400 block mb-6 uppercase tracking-[0.2em]">1. Subject Focus</label>
          <div className="grid grid-cols-1 gap-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
            {topics.map(t => (
              <div 
                key={t}
                onClick={() => setSelectedTopic(t)}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between
                  ${selectedTopic === t ? 'border-brand-green bg-green-50 text-brand-green ring-1 ring-brand-green/20' : 'border-slate-100 hover:border-slate-300'}`}
              >
                <span className="font-bold text-slate-800">{t}</span>
                {selectedTopic === t && (
                  <div className="w-6 h-6 bg-brand-green rounded-full flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
           <label className="text-xs font-black text-slate-400 block mb-6 uppercase tracking-[0.2em]">2. Exam Strategy</label>
           <div className="grid grid-cols-2 gap-4">
              <div 
                onClick={() => setStrategy(TheoryStrategy.THREE_OF_FIVE)}
                className={`p-5 border-2 rounded-2xl cursor-pointer transition-all flex flex-col items-center gap-2 text-center
                  ${strategy === TheoryStrategy.THREE_OF_FIVE ? 'border-brand-green bg-green-50' : 'border-slate-100'}`}
              >
                 <span className={`font-black text-lg ${strategy === TheoryStrategy.THREE_OF_FIVE ? 'text-brand-green' : 'text-slate-700'}`}>3 of 5</span>
                 <span className="text-[10px] text-slate-500 font-bold uppercase">1 Hour Limit</span>
              </div>
              <div 
                onClick={() => setStrategy(TheoryStrategy.FIVE_OF_SEVEN)}
                className={`p-5 border-2 rounded-2xl cursor-pointer transition-all flex flex-col items-center gap-2 text-center
                  ${strategy === TheoryStrategy.FIVE_OF_SEVEN ? 'border-brand-green bg-green-50' : 'border-slate-100'}`}
              >
                 <span className={`font-black text-lg ${strategy === TheoryStrategy.FIVE_OF_SEVEN ? 'text-brand-green' : 'text-slate-700'}`}>5 of 7</span>
                 <span className="text-[10px] text-slate-500 font-bold uppercase">1h 30m Limit</span>
              </div>
           </div>
           <p className="mt-4 text-[10px] text-slate-400 font-bold italic">* Question 1 is always compulsory and carries the highest marks.</p>
        </div>

        <div>
          <label className="text-xs font-black text-slate-400 block mb-6 uppercase tracking-[0.2em]">3. Cognitive Difficulty</label>
          <div className="grid grid-cols-3 gap-4">
            {[TheoryDifficulty.EASY, TheoryDifficulty.MODERATE, TheoryDifficulty.HARD].map(d => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`py-4 rounded-2xl border-2 font-black transition-all capitalize text-xs
                  ${difficulty === d ? 'border-brand-green bg-brand-green text-white shadow-xl shadow-green-100' : 'border-slate-100 hover:bg-slate-50 text-slate-500'}`}
              >
                {d.toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => onStart(selectedTopic, difficulty, strategy)}
          className="w-full py-6 bg-brand-green text-white rounded-3xl font-black text-xl shadow-2xl shadow-green-100 hover:bg-green-700 hover:-translate-y-1 transition-all"
        >
          Initialize Unispace Exam
        </button>
      </div>
    </div>
  );
};
