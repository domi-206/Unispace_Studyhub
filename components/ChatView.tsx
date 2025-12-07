import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { chatWithPdf } from '../services/geminiService';

interface ChatViewProps {
  fileBase64: string;
  onExit: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ fileBase64, onExit }) => {
  const INITIAL_MESSAGE: ChatMessage = { 
    id: '1', 
    role: 'model', 
    text: 'Hello! Ask me anything about your PDF document.' 
  };

  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Feature States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, editingId, replyingTo]);

  // --- Actions ---

  const handleRefresh = () => {
    setMessages([INITIAL_MESSAGE]);
    setInput('');
    setReplyingTo(null);
    setEditingId(null);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      setMessages(prev => prev.filter(m => m.id !== id));
    }
  };

  // --- Reply Logic ---

  const handleStartReply = (msg: ChatMessage) => {
    setReplyingTo(msg);
    inputRef.current?.focus();
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  // --- Edit Logic ---

  const handleStartEdit = (msg: ChatMessage) => {
    setEditingId(msg.id);
    setEditText(msg.text);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleSaveEdit = (id: string) => {
    if (!editText.trim()) return;
    setMessages(prev => prev.map(m => 
      m.id === id ? { ...m, text: editText, isEdited: true } : m
    ));
    setEditingId(null);
  };

  // --- Send Logic ---

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Trigger Animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      replyTo: replyingTo ? {
        id: replyingTo.id,
        text: replyingTo.text,
        role: replyingTo.role
      } : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setReplyingTo(null); // Clear reply state
    setIsLoading(true);

    // Prepare history for API
    const history = messages.map(m => {
        let content = m.text;
        if (m.replyTo) {
            content = `[Replying to "${m.replyTo.text.substring(0, 50)}..."]: ${m.text}`;
        }
        return {
            role: m.role,
            parts: [{ text: content }]
        };
    });
    
    let currentMessageText = userMessage.text;
    if (userMessage.replyTo) {
        currentMessageText = `[Replying to "${userMessage.replyTo.text.substring(0, 50)}..."]: ${userMessage.text}`;
    }

    const responseText = await chatWithPdf(fileBase64, history, currentMessageText);

    const aiMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText
    };

    setMessages(prev => [...prev, aiMessage]);
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // --- Render Helpers ---

  const formatText = (text: string) => {
    const paragraphs = text.split(/\n\s*\n/);
    return paragraphs.map((para, i) => {
      if (para.trim().startsWith('*') || para.trim().startsWith('-')) {
        const items = para.split(/\n/).filter(line => line.trim().length > 0);
        return (
          <ul key={i} className="list-disc ml-5 mb-3 space-y-1">
            {items.map((item, j) => {
               const cleanItem = item.replace(/^[\*\-]\s*/, '');
               return <li key={j} dangerouslySetInnerHTML={{ __html: parseBold(cleanItem) }} />;
            })}
          </ul>
        );
      }
      return (
        <p key={i} className="mb-3 last:mb-0" dangerouslySetInnerHTML={{ __html: parseBold(para) }} />
      );
    });
  };

  const parseBold = (text: string) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold opacity-100">$1</strong>');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] max-w-4xl mx-auto w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
      <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center z-10">
        <h2 className="font-bold text-slate-700 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          Document Chat
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={handleRefresh} 
            className="text-xs font-bold text-slate-600 hover:text-green-700 px-4 py-2 rounded-lg bg-white border border-slate-200 hover:border-green-300 hover:bg-green-50 transition-colors flex items-center gap-2 shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Restart Chat
          </button>
          <button onClick={onExit} className="text-xs font-bold text-slate-500 hover:text-slate-800 px-4 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 shadow-sm">
            Exit
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/50" ref={scrollRef}>
        {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isEditing = editingId === msg.id;

            return (
              <div key={msg.id} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`relative max-w-[90%] md:max-w-[80%] min-w-[300px] transition-all`}>
                  
                  {/* Message Bubble */}
                  <div 
                    className={`rounded-3xl shadow-sm overflow-hidden border
                    ${isUser 
                      ? 'bg-gradient-to-br from-green-500 to-green-600 text-white border-green-400 rounded-br-none' 
                      : 'bg-white text-slate-700 border-slate-200 rounded-bl-none'}`}
                  >
                    <div className="p-6">
                        {/* Reply Context Visualization */}
                        {msg.replyTo && !isEditing && (
                            <div className={`mb-4 text-xs p-3 rounded-xl border-l-4
                                ${isUser ? 'bg-green-700/30 border-green-200 text-green-50' : 'bg-slate-50 border-green-400 text-slate-500'}`}>
                                <div className="font-bold mb-1 flex items-center gap-1.5 opacity-80">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                                    Replying to {msg.replyTo.role === 'user' ? 'You' : 'AI'}
                                </div>
                                <div className="truncate line-clamp-1 italic opacity-90">"{msg.replyTo.text}"</div>
                            </div>
                        )}

                        {/* Content / Edit Mode */}
                        {isEditing ? (
                            <div className="w-full bg-white/10 rounded-xl p-1">
                                <textarea 
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    className="w-full p-3 text-slate-800 bg-white rounded-lg border-2 border-green-300 focus:border-green-500 outline-none min-h-[100px] shadow-inner"
                                />
                                <div className="flex justify-end gap-2 mt-3">
                                    <button onClick={handleCancelEdit} className="text-xs px-4 py-2 rounded-lg font-bold bg-black/20 hover:bg-black/30 text-white transition-colors">Cancel</button>
                                    <button onClick={() => handleSaveEdit(msg.id)} className="text-xs px-4 py-2 bg-white text-green-700 font-bold rounded-lg shadow-lg hover:scale-105 transition-transform">Save Changes</button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-base leading-7">
                                {msg.role === 'model' ? formatText(msg.text) : <p className="whitespace-pre-wrap">{msg.text}</p>}
                                {msg.isEdited && (
                                    <span className={`text-[10px] block text-right mt-2 opacity-60 font-medium italic ${isUser ? 'text-green-100' : 'text-slate-400'}`}>
                                        (edited)
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ALWAYS VISIBLE ACTION FOOTER */}
                    {!isEditing && (
                        <div className={`px-4 py-3 border-t flex items-center gap-2 flex-wrap
                           ${isUser 
                              ? 'bg-green-700/20 border-white/20' 
                              : 'bg-slate-50 border-slate-100'}`}>
                           
                           {/* Reply Button */}
                           <button 
                              onClick={() => handleStartReply(msg)}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all transform hover:scale-105
                                ${isUser 
                                   ? 'text-green-50 hover:bg-white/20' 
                                   : 'text-slate-500 hover:text-green-600 hover:bg-green-50'}`}
                           >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                              Reply
                           </button>

                           {/* Copy Button */}
                           <button 
                              onClick={() => handleCopy(msg.text)}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all transform hover:scale-105
                                ${isUser 
                                   ? 'text-green-50 hover:bg-white/20' 
                                   : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'}`}
                           >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                              Copy
                           </button>

                           {/* User Only Actions */}
                           {isUser && (
                              <>
                                <div className="w-px h-4 bg-white/20 mx-1"></div>
                                <button 
                                   onClick={() => handleStartEdit(msg)}
                                   className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold text-green-50 hover:bg-white/20 transition-all transform hover:scale-105"
                                >
                                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                   Edit
                                </button>
                                <button 
                                   onClick={() => handleDelete(msg.id)}
                                   className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold text-red-100 hover:bg-red-500/20 hover:text-white transition-all transform hover:scale-105"
                                >
                                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                   Delete
                                </button>
                              </>
                           )}
                        </div>
                    )}
                  </div>

                </div>
              </div>
            );
        })}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-100 p-6 rounded-3xl rounded-bl-none flex items-center gap-2 shadow-md">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider mr-2">Thinking</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-100 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-20">
        <div className="relative max-w-3xl mx-auto">
          
          {/* Enhanced Reply Banner */}
          {replyingTo && (
              <div className="mb-4 bg-white/80 backdrop-blur-sm p-4 rounded-xl border-l-4 border-green-500 shadow-lg animate-fade-in-up flex justify-between items-center ring-1 ring-slate-100">
                  <div className="flex items-center gap-4 overflow-hidden">
                      <div className="p-2 bg-green-100 rounded-full text-green-600">
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                      </div>
                      <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-sm uppercase tracking-wide">Replying to {replyingTo.role === 'user' ? 'yourself' : 'AI Assistant'}</span>
                          <span className="text-slate-500 text-sm truncate max-w-[200px] md:max-w-md italic">"{replyingTo.text}"</span>
                      </div>
                  </div>
                  <button onClick={handleCancelReply} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-red-500 transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
              </div>
          )}

          <div className="relative group">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question about the document..."
                className="w-full pl-6 pr-16 py-5 bg-slate-800 text-white placeholder-slate-400 rounded-full border-2 border-transparent focus:border-green-500 focus:ring-4 focus:ring-green-500/20 outline-none transition-all shadow-xl font-medium"
                disabled={isLoading}
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-2 bottom-2 aspect-square bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full hover:from-green-400 hover:to-green-500 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-green-500/50 hover:scale-105 active:scale-95 flex items-center justify-center overflow-hidden z-10"
              >
                <div className={`transition-all duration-500 transform ${isAnimating ? '-translate-y-[200%] opacity-0' : 'translate-y-0 opacity-100'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                </div>
                
                <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 transform ${isAnimating ? 'translate-y-0 opacity-100 delay-300' : 'translate-y-[200%] opacity-0'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </div>
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};