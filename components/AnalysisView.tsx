
import React, { useState } from 'react';
import { QuizAnalysis, QuizQuestion, UserAnswer, QuestionType } from '../types';
import { PdfViewer } from './PdfViewer';

interface AnalysisViewProps {
  analysis: QuizAnalysis;
  questions: QuizQuestion[];
  userAnswers: UserAnswer[];
  fileBase64: string;
  onBack: () => void;
  onRetake: () => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ analysis, questions, userAnswers, fileBase64, onBack, onRetake }) => {
  const [showReview, setShowReview] = useState(false);
  const [selectedPage, setSelectedPage] = useState<number | undefined>(undefined);
  const [showPdfModal, setShowPdfModal] = useState(false);
  
  const isPassed = analysis.totalScore >= 70;

  const handleSourceCheck = (page: number) => {
    setSelectedPage(page);
    setShowPdfModal(true);
  };

  const strengths = analysis.topicBreakdown?.filter(t => t.status === 'Strength') || [];
  const weaknesses = analysis.topicBreakdown?.filter(t => t.status === 'Weakness') || [];

  return (
    <div className="max-w-5xl mx-auto w-full pb-20 px-6 animate-fade-in relative">
      <div className="mb-8 pt-6">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 flex items-center gap-2 text-sm font-medium mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Study Hub
        </button>
        
        <div className={`p-8 rounded-3xl mb-8 flex flex-col items-center justify-between shadow-sm border-2
           ${isPassed ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
            <div className="w-full flex flex-col md:flex-row items-center justify-between mb-8">
               <div className="text-center md:text-left mb-6 md:mb-0">
                  <h1 className="text-4xl font-black text-slate-900 mb-2">
                    {isPassed ? 'Success!' : 'Keep Going'} ({analysis.totalScore}%)
                  </h1>
                  <p className="text-slate-600 font-medium">{analysis.feedback}</p>
               </div>
               <div className="flex gap-4">
                  <button onClick={() => setShowReview(true)} className="px-8 py-3 bg-white text-slate-900 border border-slate-200 rounded-2xl font-black hover:bg-slate-50 transition-all shadow-sm">Review Answers</button>
                  <button onClick={onRetake} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black hover:bg-black transition-all shadow-xl">Retake Quiz</button>
               </div>
            </div>

            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">Strengths</h4>
                  {strengths.length > 0 ? strengths.map((t, i) => (
                    <div key={i} className="flex justify-between items-center mb-2 last:mb-0">
                      <span className="text-sm font-bold text-slate-700">{t.topic}</span>
                      <span className="text-xs font-black text-brand-green bg-green-50 px-2 py-1 rounded">{t.score}%</span>
                    </div>
                  )) : <p className="text-xs text-slate-400 font-medium italic">No clear strengths identified yet.</p>}
               </div>
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">Focus Areas</h4>
                  {weaknesses.length > 0 ? weaknesses.map((t, i) => (
                    <div key={i} className="flex justify-between items-center mb-2 last:mb-0">
                      <span className="text-sm font-bold text-slate-700">{t.topic}</span>
                      <span className="text-xs font-black text-red-600 bg-red-50 px-2 py-1 rounded">{t.score}%</span>
                    </div>
                  )) : <p className="text-xs text-slate-400 font-medium italic">Keep studying to reveal focus areas.</p>}
               </div>
            </div>
        </div>
      </div>

      <div className="flex justify-center mb-10">
         <button onClick={() => setShowReview(!showReview)} className="px-8 py-4 bg-white border border-slate-200 rounded-2xl font-black text-slate-600 hover:border-brand-green transition-all shadow-sm flex items-center gap-2">
           {showReview ? 'Hide Full Review' : 'Detailed Question Review'}
           <svg className={`w-4 h-4 transition-transform ${showReview ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
         </button>
      </div>

      {showReview && (
        <div className="space-y-6 animate-fade-in-up">
          {questions.map((q, index) => {
            const userAnswer = userAnswers.find(a => a.questionId === q.id);
            const isCorrect = userAnswer?.isCorrect;
            return (
              <div key={q.id} className={`p-8 rounded-3xl shadow-sm border-2 bg-white transition-all ${isCorrect ? 'border-green-100' : 'border-red-100'}`}>
                 <div className="flex justify-between items-center mb-6">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question {index + 1}</span>
                    {q.pageNumber && (
                      <button onClick={() => handleSourceCheck(q.pageNumber!)} className="text-[10px] font-black text-brand-green bg-green-50 px-4 py-2 rounded-xl border border-green-100 hover:bg-brand-green hover:text-white transition-all flex items-center gap-2">
                        Source Page {q.pageNumber}
                      </button>
                    )}
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-6 leading-relaxed">{q.text}</h3>
                 
                 {q.type === QuestionType.FILL_IN_THE_GAP ? (
                   <div className="mb-6 flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-slate-400 uppercase">Your Answer:</span>
                        <span className={`font-black text-lg ${isCorrect ? 'text-brand-green' : 'text-red-500'}`}>{userAnswer?.textAnswer || '[No Response]'}</span>
                      </div>
                      {!isCorrect && (
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black text-slate-400 uppercase">Correct Answer:</span>
                          <span className="font-black text-lg text-brand-green">{q.correctAnswerText}</span>
                        </div>
                      )}
                   </div>
                 ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {q.options.map((opt, i) => {
                        const isUserSelect = userAnswer?.selectedOptionIndex === i;
                        const isCorrectOpt = q.correctAnswerIndex === i;
                        return (
                          <div key={i} className={`p-4 rounded-xl border-2 flex items-center justify-between transition-all
                            ${isCorrectOpt ? 'border-brand-green bg-green-50 text-green-900 font-bold' : isUserSelect && !isCorrectOpt ? 'border-red-500 bg-red-50 text-red-900 font-bold' : 'border-slate-100 opacity-60'}`}>
                            <span className="text-sm">{opt}</span>
                            {(isCorrectOpt || (isUserSelect && !isCorrectOpt)) && (
                              <div className={isCorrectOpt ? 'text-brand-green' : 'text-red-500 font-black'}>
                                {isCorrectOpt ? 'CORRECT' : 'WRONG'}
                              </div>
                            )}
                          </div>
                        );
                      })}
                   </div>
                 )}
                 <div className="bg-slate-900 text-slate-300 p-6 rounded-2xl shadow-inner border border-slate-800">
                    <p className="text-[10px] font-black text-brand-green uppercase tracking-[0.2em] mb-2">Unispace AI Explanation</p>
                    <p className="text-sm font-medium leading-relaxed italic">{q.explanation}</p>
                 </div>
              </div>
            );
          })}
        </div>
      )}

      {showPdfModal && (
        <div className="fixed inset-0 z-[100] bg-brand-dark/95 flex flex-col animate-fade-in backdrop-blur-md">
           <div className="p-4 flex justify-between items-center text-white border-b border-white/10">
              <span className="font-black text-sm uppercase tracking-widest opacity-80">Unispace Source - Page {selectedPage}</span>
              <button 
                onClick={() => setShowPdfModal(false)} 
                className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-black text-xs transition-all uppercase flex items-center gap-2 shadow-2xl ring-4 ring-red-600/10"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                Cancel Review
              </button>
           </div>
           <div className="flex-1">
              <PdfViewer base64={fileBase64} page={selectedPage} />
           </div>
        </div>
      )}
    </div>
  );
};
