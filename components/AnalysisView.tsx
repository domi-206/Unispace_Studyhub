import React from 'react';
import { QuizAnalysis } from '../types';

interface AnalysisViewProps {
  analysis: QuizAnalysis;
  onBack: () => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ analysis, onBack }) => {
  const incorrectCount = analysis.totalQuestions - analysis.correctCount;

  return (
    <div className="max-w-5xl mx-auto w-full pb-20 px-6">
      <div className="mb-10 pt-6">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 flex items-center gap-2 text-sm font-medium mb-6 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Study Hub
        </button>
        <h1 className="text-3xl font-bold text-slate-900">Performance Analysis</h1>
        <p className="text-slate-500 mt-1">Detailed insights into your quiz session.</p>
      </div>

      {/* Top Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Score Card */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
          <div className="text-5xl font-extrabold text-slate-900 mb-2">{analysis.totalScore}%</div>
          <div className="text-slate-500 font-medium">Your Score</div>
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
           <h3 className="text-xl font-bold text-slate-900 mb-6">Performance Analysis</h3>
           
           <div className="space-y-6">
             <div>
               <h4 className="flex items-center gap-2 font-bold text-green-700 mb-2">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                 Your Strengths
               </h4>
               <p className="text-slate-600 leading-relaxed text-sm">
                 {analysis.topicBreakdown.filter(t => t.status === 'Strength').map(t => t.topic).join(', ') || "Keep practicing to build strengths!"}
                 . You have a solid understanding of these concepts.
               </p>
             </div>
             
             <div className="w-full h-px bg-slate-100"></div>

             <div>
               <h4 className="flex items-center gap-2 font-bold text-amber-600 mb-2">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                 Areas for Improvement
               </h4>
               <p className="text-slate-600 leading-relaxed text-sm">
                 {analysis.topicBreakdown.filter(t => t.status !== 'Strength').map(t => t.topic).join(', ') || "Great job! You showed consistent performance."}
                 . Focus on these chapters for your next review.
               </p>
             </div>
           </div>
        </div>

        <div className="bg-green-50 rounded-3xl border border-green-100 p-8">
           <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900 mb-6">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              Where to Focus Next
           </h3>
           <p className="text-slate-600 text-sm mb-6">Based on your results, we recommend focusing on the following topics to improve your score and understanding:</p>
           
           <div className="space-y-4">
              {analysis.topicBreakdown.filter(t => t.status !== 'Strength').map((topic, idx) => (
                <div key={idx} className="flex gap-4">
                   <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full border-2 border-green-500 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                   </div>
                   <div>
                     <h5 className="font-bold text-slate-800 text-sm">{topic.topic}</h5>
                     <p className="text-slate-600 text-xs mt-1 leading-relaxed">{topic.advice}</p>
                   </div>
                </div>
              ))}
              {analysis.topicBreakdown.every(t => t.status === 'Strength') && (
                <div className="flex gap-4">
                   <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full border-2 border-green-500 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                   </div>
                   <div>
                     <h5 className="font-bold text-slate-800 text-sm">Advanced Review</h5>
                     <p className="text-slate-600 text-xs mt-1 leading-relaxed">You've mastered the basics! Try reviewing the material again to ensure long-term retention.</p>
                   </div>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};