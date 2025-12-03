import React, { useState, useEffect } from 'react';

interface LoadingViewProps {
  message: string;
}

export const LoadingView: React.FC<LoadingViewProps> = ({ message }) => {
  const [progress, setProgress] = useState(0);
  const [subMessageIndex, setSubMessageIndex] = useState(0);

  const subMessages = [
    "Scanning document structure...",
    "Identifying key topics...",
    "Analyzing concept complexity...",
    "Drafting challenging questions...",
    "Verifying answers against context...",
    "Finalizing your personalized session..."
  ];

  useEffect(() => {
    // Cycle sub-messages every 2 seconds
    const msgInterval = setInterval(() => {
      setSubMessageIndex((prev) => (prev + 1) % subMessages.length);
    }, 2000);

    // Simulate progress bar
    // It goes up to 90% and waits there until the actual process finishes
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        // Random increment between 1 and 3 for organic feel
        return prev + Math.random() * 2;
      });
    }, 150);

    return () => {
      clearInterval(msgInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-50/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6">
      
      {/* Animated Brain/Process Icon */}
      <div className="relative w-32 h-32 mb-10">
        {/* Pulsing Background */}
        <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-20"></div>
        
        {/* Rotating Outer Ring */}
        <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-t-green-500 rounded-full animate-[spin_2s_linear_infinite]"></div>
        
        {/* Rotating Inner Ring */}
        <div className="absolute inset-4 border-4 border-t-green-300 rounded-full animate-[spin_3s_linear_infinite_reverse]"></div>

        {/* Center Icon */}
        <div className="absolute inset-0 flex items-center justify-center animate-pulse">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
           </svg>
        </div>
      </div>

      {/* Text Content */}
      <h3 className="text-2xl font-bold text-slate-800 mb-2 text-center animate-fade-in">{message}</h3>
      
      <div className="h-8 overflow-hidden mb-8 w-full max-w-md text-center">
        <p key={subMessageIndex} className="text-slate-500 font-medium animate-fade-in-up">
            {subMessages[subMessageIndex]}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-sm h-2 bg-slate-200 rounded-full overflow-hidden shadow-inner">
        <div 
            className="h-full bg-green-500 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
            style={{ width: `${progress}%` }}
        >
            <div className="absolute inset-0 bg-white/30 animate-[pulse_2s_infinite]"></div>
        </div>
      </div>
      
      <p className="mt-6 text-xs text-slate-400 font-medium tracking-wide uppercase">Preparing your study environment</p>
    </div>
  );
};