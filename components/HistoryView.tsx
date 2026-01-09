
import React from 'react';
import { QuizHistoryItem, PodcastResult, ChatHistoryItem } from '../types';

interface HistoryViewProps {
  quizHistory: QuizHistoryItem[];
  podcastHistory: PodcastResult[];
  chatHistory: ChatHistoryItem[];
  onBack: () => void;
  onOpenChat: (chat: ChatHistoryItem) => void;
  onOpenPodcast: (podcast: PodcastResult) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ 
  quizHistory, podcastHistory, chatHistory, onBack, onOpenChat, onOpenPodcast 
}) => {
  const formatDate = (ts: number) => new Date(ts).toLocaleDateString() + ' ' + new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="max-w-6xl mx-auto w-full px-4 pb-20 animate-fade-in">
      <header className="py-8 flex justify-between items-center">
        <div>
          <button onClick={onBack} className="text-slate-500 hover:text-slate-800 flex items-center gap-2 text-sm font-medium mb-2 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Study Hub
          </button>
          <h1 className="text-4xl font-black text-brand-dark">Study Records</h1>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quiz History */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Quiz Sessions
          </h3>
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            {quizHistory.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-sm italic">No quiz records yet.</div>
            ) : (
              quizHistory.map(item => (
                <div key={item.id} className="p-5 border-b last:border-0 border-slate-100 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-800 text-sm line-clamp-1">{item.fileName}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{formatDate(item.timestamp)}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-brand-green">{item.score}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Podcast History */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            Generated Podcasts
          </h3>
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            {podcastHistory.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-sm italic">No podcasts created yet.</div>
            ) : (
              podcastHistory.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => onOpenPodcast(item)}
                  className="p-5 border-b last:border-0 border-slate-100 flex justify-between items-center hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-500">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v5a1 1 0 102 0V8a1 1 0 00-1-1z" /></svg>
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm line-clamp-1">{item.topic}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{formatDate(item.timestamp)}</p>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
              ))
            )}
          </div>
        </div>

        {/* AI Chat History */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Tutoring Chats
          </h3>
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            {chatHistory.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-sm italic">No chat history yet.</div>
            ) : (
              chatHistory.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => onOpenChat(item)}
                  className="p-5 border-b last:border-0 border-slate-100 flex flex-col gap-1 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <p className="font-bold text-slate-800 text-sm line-clamp-1">{item.fileName}</p>
                  <p className="text-[10px] text-slate-500 line-clamp-1">{item.preview}</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">{formatDate(item.timestamp)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
