
import React, { useState, useEffect } from 'react';

interface LoadingViewProps {
  message: string;
}

export const LoadingView: React.FC<LoadingViewProps> = ({ message }) => {
  const [progress, setProgress] = useState(0);
  const [subMessageIndex, setSubMessageIndex] = useState(0);

  const subMessages = [
    "Unispace is scanning content...",
    "Analyzing syllabus...",
    "Drafting complex questions...",
    "Optimizing study flow...",
    "Finalizing Unispace experience..."
  ];

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setSubMessageIndex((prev) => (prev + 1) % subMessages.length);
    }, 1200);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + (Math.random() * 5 + 1);
      });
    }, 300);

    return () => {
      clearInterval(msgInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-white/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6">
      
      <div className="relative w-32 h-32 mb-10">
        <div className="absolute inset-0 bg-green-100 rounded-3xl animate-ping opacity-20 duration-1000"></div>
        
        <div className="absolute inset-0 border-4 border-slate-100 rounded-3xl"></div>
        <div className="absolute inset-0 border-4 border-t-brand-green rounded-3xl animate-[spin_2s_linear_infinite]"></div>
        
        <div className="absolute inset-0 flex items-center justify-center">
           <div className="bg-brand-green text-white w-12 h-12 rounded-xl flex items-center justify-center font-black text-2xl animate-pulse">
             U
           </div>
        </div>
      </div>

      <h3 className="text-3xl font-black text-brand-dark mb-4 text-center animate-fade-in tracking-tight">{message}</h3>
      
      <div className="h-8 overflow-hidden mb-8 w-full max-w-md text-center">
        <p key={subMessageIndex} className="text-slate-500 font-bold animate-fade-in-up">
            {subMessages[subMessageIndex]}
        </p>
      </div>

      <div className="w-full max-w-sm h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200">
        <div 
            className="h-full bg-brand-green rounded-full transition-all duration-300 ease-out relative overflow-hidden"
            style={{ width: `${progress}%` }}
        >
            <div className="absolute inset-0 bg-white/20 animate-[pulse_1.5s_infinite]"></div>
        </div>
      </div>
      
      <p className="mt-8 text-xs text-slate-400 font-black tracking-widest uppercase">Powered by Unispace Engine</p>
    </div>
  );
};
