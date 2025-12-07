import React, { useState } from 'react';
import { QuizAnalysis, QuizQuestion, UserAnswer } from '../types';

interface AnalysisViewProps {
  analysis: QuizAnalysis;
  questions: QuizQuestion[];
  userAnswers: UserAnswer[];
  onBack: () => void;
  onRetake: () => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ analysis, questions, userAnswers, onBack, onRetake }) => {
  const incorrectCount = analysis.totalQuestions - analysis.correctCount;
  const [showReview, setShowReview] = useState(false);
  
  // 70% Pass Threshold
  const isPassed = analysis.totalScore >= 70;

  return (
    <div className="max-w-5xl mx-auto w-full pb-20 px-6">
      <div className="mb-8 pt-6">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 flex items-center gap-2 text-sm font-medium mb-6 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Menu
        </button>
        
        <div className={`p-8 rounded-3xl mb-8 flex flex-col md:flex-row items-center justify-between shadow-sm border-2
           ${isPassed ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
            <div className="mb-6 md:mb-0">
               <div className="flex items-center gap-3 mb-2">
                 <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                    ${isPassed ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                    {isPassed ? 'Passed' : 'Failed'}
                 </span>
                 <span className="text-slate-500 text-sm">Pass Mark: 70%</span>
               </div>
               <h1 className="text-4xl font-extrabold text-slate-900 mb-2">
                 {isPassed ? 'Congratulations!' : 'Keep Practicing'}
               </h1>
               <p className="text-slate-600">
                 {isPassed 
                   ? 'You demonstrated a strong understanding of the material.' 
                   : 'You didn\'t meet the 70% threshold this time. Review your answers and try again.'}
               </p>
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={() => setShowReview(!showReview)}
                className="px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-sm"
              >
                {showReview ? 'Hide Review' : 'Review Answers'}
              </button>
              
              {!isPassed && (
                 <button 
                  onClick={onRetake}
                  className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200 animate-pulse"
                >
                  Retry Quiz
                </button>
              )}
              {isPassed && (
                 <button 
                  onClick={onRetake}
                  className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
                >
                  Take Another Quiz
                </button>
              )}
            </div>
        </div>
      </div>

      {!showReview ? (
        <>
          {/* Top Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {/* Score Card */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
              <div className={`text-5xl font-extrabold mb-2 ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
                  {analysis.totalScore}%
              </div>
              <div className="text-slate-500 font-medium">Total Score</div>
            </div>

            {/* Correct Card */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-100 flex items-center justify-center mb-4">
                 <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                 </svg>
              </div>
              <div className="text-2xl font-bold text-slate-800">{analysis.correctCount} Correct</div>
            </div>

            {/* Incorrect Card */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-50 border-2 border-red-100 flex items-center justify-center mb-4">
                 <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                 </svg>
              </div>
              <div className="text-2xl font-bold text-slate-800">{incorrectCount} Incorrect</div>
            </div>
          </div>

          {/* Analysis Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
               <h3 className="text-xl font-bold text-slate-900 mb-6">Topic Breakdown</h3>
               
               <div className="space-y-6">
                 <div>
                   <h4 className="flex items-center gap-2 font-bold text-green-700 mb-2">
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                     Strong Topics
                   </h4>
                   <p className="text-slate-600 leading-relaxed text-sm">
                     {analysis.topicBreakdown.filter(t => t.status === 'Strength').map(t => t.topic).join(', ') || "No clear strengths identified yet."}
                   </p>
                 </div>
                 
                 <div className="w-full h-px bg-slate-100"></div>

                 <div>
                   <h4 className="flex items-center gap-2 font-bold text-amber-600 mb-2">
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                     Needs Improvement
                   </h4>
                   <p className="text-slate-600 leading-relaxed text-sm">
                     {analysis.topicBreakdown.filter(t => t.status !== 'Strength').map(t => t.topic).join(', ') || "No major weak areas found."}
                   </p>
                 </div>
               </div>
            </div>

            <div className="bg-green-50 rounded-3xl border border-green-100 p-8">
               <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900 mb-6">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  Detailed Feedback
               </h3>
               <p className="text-slate-600 text-sm mb-6 font-medium italic">"{analysis.feedback}"</p>
               
               <div className="space-y-4">
                  {analysis.topicBreakdown.map((topic, idx) => (
                    <div key={idx} className="flex gap-4">
                       <div className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
                          ${topic.status === 'Strength' ? 'border-green-500' : 'border-amber-500'}`}>
                          <div className={`w-2 h-2 rounded-full ${topic.status === 'Strength' ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                       </div>
                       <div>
                         <h5 className="font-bold text-slate-800 text-sm">{topic.topic}</h5>
                         <p className="text-slate-600 text-xs mt-1 leading-relaxed">{topic.advice}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </>
      ) : (
        <div className="animate-fade-in">
           <div className="flex justify-between items-center mb-6">
             <div>
                <h2 className="text-2xl font-bold text-slate-800">Answer Review</h2>
                <p className="text-slate-500 text-sm">Review your answers and the reasons behind them.</p>
             </div>
             <button 
                onClick={() => setShowReview(false)}
                className="text-slate-500 hover:text-slate-800 font-medium bg-slate-100 px-4 py-2 rounded-lg"
             >
               Close Review
             </button>
           </div>
           
           <div className="space-y-6">
              {questions.map((q, index) => {
                 const userAnswer = userAnswers.find(a => a.questionId === q.id);
                 const selectedIndex = userAnswer?.selectedOptionIndex ?? -1;
                 const isCorrect = selectedIndex === q.correctAnswerIndex;
                 
                 return (
                  <div key={q.id} className={`p-6 rounded-2xl shadow-sm border-2 ${isCorrect ? 'border-green-100 bg-white' : 'border-red-100 bg-red-50/10'}`}>
                     <div className="flex items-center gap-3 mb-4">
                        <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">
                            Q{index + 1}
                        </span>
                        <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">
                            {q.topic}
                        </span>
                        {isCorrect ? (
                             <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                Correct
                             </span>
                        ) : (
                             <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                Incorrect
                             </span>
                        )}
                     </div>
                     <h3 className="text-lg font-bold text-slate-900 mb-6">{q.text}</h3>
                     
                     <div className="space-y-3 mb-6">
                        {q.options.map((opt, optIdx) => {
                            const isSelected = selectedIndex === optIdx;
                            const isTarget = q.correctAnswerIndex === optIdx;
                            
                            let styles = "bg-white border-slate-200 text-slate-600 opacity-70";
                            let icon = null;

                            if (isTarget) {
                                styles = "bg-green-50 border-green-500 text-green-800 font-bold opacity-100 ring-1 ring-green-500";
                                icon = <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
                            } else if (isSelected && !isTarget) {
                                styles = "bg-red-50 border-red-500 text-red-800 font-bold opacity-100";
                                icon = <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
                            }

                            return (
                                <div key={optIdx} className={`p-4 border rounded-xl flex justify-between items-center transition-all ${styles}`}>
                                   <div className="flex gap-3 items-center">
                                     <span className="w-6 h-6 rounded border flex items-center justify-center text-xs">{String.fromCharCode(65 + optIdx)}</span>
                                     <span>{opt}</span>
                                   </div>
                                   {icon}
                                </div>
                            );
                        })}
                     </div>
                     
                     <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                        <div className="flex items-start gap-2">
                             <svg className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                             <div>
                                 <span className="font-bold text-slate-900 block text-sm mb-1">Reason for Answer:</span> 
                                 <p className="text-sm text-slate-600 leading-relaxed">{q.explanation}</p>
                             </div>
                        </div>
                     </div>
                  </div>
                 );
              })}
           </div>
           
           <div className="mt-10 flex justify-center pb-10">
             <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="text-slate-500 hover:text-slate-800 flex flex-col items-center gap-1 text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                Back to Top
              </button>
           </div>
        </div>
      )}
    </div>
  );
};