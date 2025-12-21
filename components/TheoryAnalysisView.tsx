
import React, { useState } from 'react';
import { TheoryExamAnalysis, TheoryQuestion } from '../types';

interface TheoryAnalysisViewProps {
  analysis: TheoryExamAnalysis;
  questions: TheoryQuestion[];
  onBack: () => void;
}

export const TheoryAnalysisView: React.FC<TheoryAnalysisViewProps> = ({ analysis, questions, onBack }) => {
  const [activeGradeIdx, setActiveGradeIdx] = useState(0);
  const currentGrade = analysis.grades[activeGradeIdx];
  const currentQuestion = questions.find(q => q.id === currentGrade.questionId);

  return (
    <div className="max-w-6xl mx-auto w-full space-y-8 pb-20 px-4 animate-fade-in">
      {/* Hero Score Header */}
      <div className={`p-10 rounded-3xl border-2 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8
          ${analysis.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div>
          <div className="flex items-center gap-3 mb-4">
             <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest
                ${analysis.passed ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                {analysis.passed ? 'Passed' : 'Failed'}
             </span>
             <span className="text-slate-500 font-bold text-sm">Passing Score: 45 / 70</span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 mb-2">Topic Mastery: {analysis.finalScore} / 70</h1>
          <p className="text-slate-600 max-w-xl font-medium leading-relaxed">{analysis.generalFeedback}</p>
        </div>
        
        <button 
          onClick={onBack}
          className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-black transition-all"
        >
          Return to Hub
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Performance Breakdown */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2">
                 <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                 Strengths
              </h3>
              <ul className="space-y-3">
                 {analysis.topicStrengths.map((s, i) => (
                    <li key={i} className="bg-green-50 p-3 rounded-xl text-green-800 text-sm font-bold border border-green-100">{s}</li>
                 ))}
              </ul>
           </div>

           <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2">
                 <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                 Areas to Improve
              </h3>
              <ul className="space-y-3">
                 {analysis.topicWeaknesses.map((w, i) => (
                    <li key={i} className="bg-red-50 p-3 rounded-xl text-red-800 text-sm font-bold border border-red-100">{w}</li>
                 ))}
              </ul>
           </div>
        </div>

        {/* Right: Detailed Question Feedback */}
        <div className="lg:col-span-2 space-y-6">
           <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {analysis.grades.map((g, i) => (
                <button
                  key={g.questionId}
                  onClick={() => setActiveGradeIdx(i)}
                  className={`px-6 py-3 rounded-xl font-bold border transition-all flex-shrink-0
                    ${activeGradeIdx === i ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-100 text-slate-500'}`}
                >
                  Q{i + 1} ({g.totalScore} pts)
                </button>
              ))}
           </div>

           {currentQuestion && currentGrade && (
             <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                   <h2 className="text-xl font-black text-slate-900 mb-2">{currentQuestion.mainPrompt}</h2>
                   <span className="text-sm font-bold text-slate-400">Question ID: {currentQuestion.id}</span>
                </div>
                
                <div className="p-8 space-y-10">
                   {currentGrade.parts.map((p, i) => (
                     <div key={i} className="space-y-4">
                        <div className="flex justify-between items-center">
                           <h4 className="font-black text-slate-800 flex items-center gap-2">
                              <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center text-xs">{p.label}</span>
                              Evaluation
                           </h4>
                           <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-black rounded-lg text-xs">{p.score} Marks Awarded</span>
                        </div>
                        
                        <p className="text-slate-600 text-sm italic font-medium">"{p.feedback}"</p>

                        {p.missedKeywords.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                             <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest block w-full">Missed Keywords</span>
                             {p.missedKeywords.map(k => (
                               <span key={k} className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-black rounded-md">{k}</span>
                             ))}
                          </div>
                        )}

                        <div className="p-5 bg-green-50 border border-green-100 rounded-2xl">
                           <span className="text-[10px] font-black text-green-600 uppercase tracking-widest block mb-2">Ideal Answer (Based on PDF)</span>
                           <p className="text-sm text-slate-700 leading-relaxed">{p.correctAnswerReference}</p>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
