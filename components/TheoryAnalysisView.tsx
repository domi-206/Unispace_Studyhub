
import React, { useState } from 'react';
import { TheoryExamAnalysis, TheoryQuestion } from '../types';
import { PdfViewer } from './PdfViewer';

interface TheoryAnalysisViewProps {
  analysis: TheoryExamAnalysis;
  questions: TheoryQuestion[];
  fileBase64: string;
  onBack: () => void;
}

export const TheoryAnalysisView: React.FC<TheoryAnalysisViewProps> = ({ analysis, questions, fileBase64, onBack }) => {
  const [activeGradeIdx, setActiveGradeIdx] = useState(0);
  const [selectedPage, setSelectedPage] = useState<number | undefined>(undefined);
  const [showPdfModal, setShowPdfModal] = useState(false);

  const currentGrade = analysis.grades[activeGradeIdx];
  const currentQuestion = questions.find(q => q.id === currentGrade.questionId);

  const handleSourceCheck = (page: number) => {
    setSelectedPage(page);
    setShowPdfModal(true);
  };

  return (
    <div className="max-w-5xl mx-auto w-full pb-20 px-4 animate-fade-in relative">
      <div className="pt-6 mb-6">
        <button onClick={onBack} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center gap-2 text-sm font-medium transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Study Hub
        </button>
      </div>

      <div className={`p-10 rounded-[2.5rem] border-2 shadow-2xl mb-8 transition-colors ${analysis.passed ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'}`}>
        <div className="w-full flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2">Score: {analysis.finalScore} / 70</h1>
            <p className="text-slate-600 dark:text-slate-300 font-medium">{analysis.generalFeedback}</p>
          </div>
          <span className={`px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest ${analysis.passed ? 'bg-brand-green text-white' : 'bg-red-600 text-white'}`}>
             {analysis.passed ? 'PASSED' : 'IMPROVE'}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
              <span className="text-[10px] font-black text-brand-green uppercase mb-3 block">Strengths</span>
              <div className="flex flex-wrap gap-2">{analysis.topicStrengths.map((s, i) => <span key={i} className="px-3 py-1.5 bg-green-50 dark:bg-green-800/20 text-green-700 dark:text-green-400 rounded-lg text-xs font-bold">{s}</span>)}</div>
           </div>
           <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
              <span className="text-[10px] font-black text-red-600 uppercase mb-3 block">Weaknesses</span>
              <div className="flex flex-wrap gap-2">{analysis.topicWeaknesses.map((w, i) => <span key={i} className="px-3 py-1.5 bg-red-50 dark:bg-red-800/20 text-red-700 dark:text-red-400 rounded-lg text-xs font-bold">{w}</span>)}</div>
           </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-8 custom-scrollbar">
          {analysis.grades.map((g, i) => (
            <button key={g.questionId} onClick={() => setActiveGradeIdx(i)} className={`px-6 py-3 rounded-xl font-bold border transition-all flex-shrink-0 ${activeGradeIdx === i ? 'bg-slate-900 dark:bg-white dark:text-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>Q{i + 1}</button>
          ))}
      </div>

      {currentQuestion && currentGrade && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-fade-in-up transition-colors">
           <div className="p-8 border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">{currentQuestion.mainPrompt}</h2>
           </div>
           <div className="p-8 space-y-10">
              {currentGrade.parts.map((p, i) => (
                <div key={i} className="space-y-4">
                   <div className="flex justify-between items-center">
                      <h4 className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-3">
                         <span className="w-10 h-10 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl flex items-center justify-center text-sm">{p.label}</span>
                         ({p.score} Marks)
                      </h4>
                      {p.pageNumber && (
                        <button onClick={() => handleSourceCheck(p.pageNumber!)} className="text-[10px] font-black text-brand-green bg-green-50 dark:bg-brand-green/10 px-3 py-1.5 rounded-xl border border-green-100 dark:border-brand-green/20 hover:bg-brand-green hover:text-white transition-all">Check Page {p.pageNumber}</button>
                      )}
                   </div>
                   <div className="p-6 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl transition-colors">
                      <p className="text-slate-700 dark:text-slate-300 text-lg font-medium leading-relaxed italic">"{p.feedback}"</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                         {p.missedKeywords.map((kw, ki) => <span key={ki} className="px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded text-[10px] font-black uppercase line-through border border-red-100 dark:border-red-900/40">MISSING: {kw}</span>)}
                      </div>
                   </div>
                   <div className="p-6 bg-green-50 dark:bg-brand-green/10 border border-green-100 dark:border-brand-green/20 rounded-2xl transition-colors">
                      <p className="text-[10px] font-black text-brand-green uppercase mb-2">Key Reference</p>
                      <p className="text-sm text-slate-800 dark:text-slate-200 font-semibold">{p.correctAnswerReference}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {showPdfModal && (
        <div className="fixed inset-0 z-[100] bg-brand-dark/95 flex flex-col animate-fade-in backdrop-blur-xl">
           <div className="p-6 flex justify-between items-center text-white border-b border-white/10">
              <span className="font-black text-sm uppercase tracking-widest opacity-80">Exam Review - Page {selectedPage}</span>
              <button 
                onClick={() => setShowPdfModal(false)} 
                className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-black text-xs transition-all uppercase flex items-center gap-3 shadow-2xl active:scale-95"
              >
                Cancel Review
              </button>
           </div>
           <div className="flex-1 p-4 md:p-10">
              <PdfViewer base64={fileBase64} page={selectedPage} />
           </div>
        </div>
      )}
    </div>
  );
};
