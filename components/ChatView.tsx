
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Accent, Tone, TTSConfig, ChatHistoryItem } from '../types';
import { chatWithPdfStream, generateSpeech, playRawPcm } from '../services/geminiService';
import { PdfViewer } from './PdfViewer';

interface ChatViewProps {
  fileBase64: string;
  initialHistory?: ChatMessage[];
  onExit: () => void;
  onUpdateHistory?: (messages: ChatMessage[]) => void;
  chatHistory: ChatHistoryItem[];
  onSelectChat: (chat: ChatHistoryItem) => void;
  onNewChat: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ 
  fileBase64, initialHistory, onExit, onUpdateHistory, chatHistory, onSelectChat, onNewChat 
}) => {
  const INITIAL_MESSAGE: ChatMessage = { 
    id: '1', 
    role: 'model', 
    text: 'Hello! I am your Unispace Assistant. Ask me anything about your document.' 
  };

  const [messages, setMessages] = useState<ChatMessage[]>(initialHistory || [INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  
  const [ttsConfig, setTtsConfig] = useState<TTSConfig>({ accent: Accent.US, tone: Tone.FRIENDLY });
  const [showTTSMenu, setShowTTSMenu] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedPage, setSelectedPage] = useState<number | undefined>(undefined);
  const [showPdfModal, setShowPdfModal] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialHistory) {
      setMessages(initialHistory);
    } else {
      setMessages([INITIAL_MESSAGE]);
    }
  }, [initialHistory]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    if (onUpdateHistory && messages.length > 1) onUpdateHistory(messages);
  }, [messages, isLoading]);

  const handlePageClick = (page: number) => {
    setSelectedPage(page);
    setShowPdfModal(true);
  };

  const speakText = async (text: string, msgId: string) => {
    if (isSpeaking) {
      audioSourceRef.current?.stop();
      setIsSpeaking(null);
      return;
    }
    setIsSpeaking(msgId);
    try {
      const audioBase64 = await generateSpeech(text, ttsConfig);
      const result = await playRawPcm(audioBase64);
      if (result) {
        const source = result.audioCtx.createBufferSource();
        source.buffer = result.audioBuffer;
        source.connect(result.audioCtx.destination);
        audioSourceRef.current = source;
        source.onended = () => setIsSpeaking(null);
        source.start(0);
      }
    } catch (e) {
      console.error("Unispace TTS Error:", e);
      setIsSpeaking(null);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    setIsSending(true);
    // Reset animation state after it completes
    setTimeout(() => setIsSending(false), 600); 

    const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const history = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
    const aiMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: aiMessageId, role: 'model', text: '' }]);

    try {
      const { text, pages } = await chatWithPdfStream(fileBase64, history, userMessage.text, (chunkText) => {
        setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, text: chunkText } : m));
      });
      setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, text: text, pageReferences: pages } : m));
    } catch (e) {
      setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, text: "Unispace encountered an error." } : m));
    } finally {
      setIsLoading(false);
    }
  };

  const formatText = (text: string) => {
    if (!text) return <div className="flex gap-1 items-center"><span className="w-1.5 h-1.5 bg-brand-green rounded-full animate-bounce"></span><span className="w-1.5 h-1.5 bg-brand-green rounded-full animate-bounce [animation-delay:0.2s]"></span><span className="w-1.5 h-1.5 bg-brand-green rounded-full animate-bounce [animation-delay:0.4s]"></span></div>;
    const citedText = text.replace(/\[Page\s*(\d+)\]/gi, (match, p1) => {
      return `<button class="inline-flex items-center gap-1 bg-brand-green/10 text-brand-green px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tighter hover:bg-brand-green hover:text-white transition-all mx-1" onclick="window.dispatchEvent(new CustomEvent('jumpToPage', {detail: ${p1}}))">Page ${p1}</button>`;
    });
    return citedText.split(/\n\s*\n/).map((para, i) => (
      <p key={i} className="mb-4 last:mb-0" dangerouslySetInnerHTML={{ __html: para.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />
    ));
  };

  useEffect(() => {
    const handleJump = (e: any) => handlePageClick(e.detail);
    window.addEventListener('jumpToPage', handleJump);
    return () => window.removeEventListener('jumpToPage', handleJump);
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-6xl mx-auto w-full animate-fade-in relative px-4">
      <div className="flex h-full bg-white rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden relative">
        
        {/* Sidebar */}
        <div className={`absolute md:relative inset-y-0 left-0 w-72 bg-slate-50 border-r border-slate-200 z-30 transition-transform duration-500 transform ${showSidebar ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}`}>
           <div className="p-6 border-b bg-white flex justify-between items-center">
              <span className="font-black text-[11px] text-slate-400 uppercase tracking-widest">Tutoring Vault</span>
              <button onClick={() => setShowSidebar(false)} className="md:hidden text-slate-400">✕</button>
           </div>
           <div className="p-6 space-y-4">
              <button 
                onClick={() => { onNewChat(); setShowSidebar(false); }}
                className="w-full py-4 bg-brand-dark text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2 group"
              >
                <svg className="w-4 h-4 group-hover:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                New Session
              </button>
              
              <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-320px)] pr-2 custom-scrollbar">
                 {chatHistory.map((item) => (
                   <button 
                     key={item.id}
                     onClick={() => { onSelectChat(item); setShowSidebar(false); }}
                     className="w-full text-left p-4 rounded-2xl border border-slate-100 bg-white hover:border-brand-green hover:shadow-md transition-all group"
                   >
                     <p className="font-bold text-xs text-slate-800 truncate mb-1">{item.fileName}</p>
                     <p className="text-[10px] text-slate-400 truncate opacity-60 group-hover:opacity-100">{item.preview}</p>
                   </button>
                 ))}
                 {chatHistory.length === 0 && <p className="text-[10px] text-slate-400 italic text-center py-10">Empty session history</p>}
              </div>
           </div>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50/20">
          <div className="bg-white/80 backdrop-blur-md border-b p-4 md:p-6 flex justify-between items-center z-10 sticky top-0">
            <div className="flex items-center gap-4">
              <button onClick={() => setShowSidebar(!showSidebar)} className="md:hidden p-3 text-slate-500 bg-slate-100 border border-slate-200 rounded-xl hover:bg-slate-200 transition-all">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <div>
                <h2 className="font-black text-brand-dark flex items-center gap-2 text-lg md:text-xl">Unispace Tutor</h2>
                <div className="flex items-center gap-2 mt-0.5">
                   <div className="w-2 h-2 rounded-full bg-brand-green animate-pulse"></div>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Sync</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowTTSMenu(!showTTSMenu)} className="text-[10px] font-black text-slate-500 bg-white border border-slate-200 px-4 py-2 rounded-xl uppercase hover:border-brand-green hover:text-brand-green transition-all shadow-sm">Voice</button>
              <button onClick={onExit} className="text-[10px] font-black text-slate-400 bg-slate-100 px-4 py-2 rounded-xl uppercase hover:bg-slate-200 transition-all">Exit</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8" ref={scrollRef}>
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                <div className={`max-w-[88%] md:max-w-[75%] p-6 rounded-[2rem] shadow-sm relative ${msg.role === 'user' ? 'bg-brand-green text-white rounded-tr-none shadow-brand-green/10' : 'bg-white text-slate-800 rounded-tl-none border border-slate-200'}`}>
                  {msg.role === 'model' ? formatText(msg.text) : <p className="whitespace-pre-wrap font-medium text-lg">{msg.text}</p>}
                  {msg.role === 'model' && msg.text && (
                    <button onClick={() => speakText(msg.text, msg.id)} className={`mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:scale-105 ${isSpeaking === msg.id ? 'text-brand-green animate-pulse' : 'text-slate-400 hover:text-brand-green'}`}>
                      <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-brand-green/10">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z" clipRule="evenodd" /></svg>
                      </div>
                      {isSpeaking === msg.id ? 'Stop Playback' : 'Read Session'}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
               <div className="flex items-center gap-3 ml-2">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing with document...</span>
               </div>
            )}
          </div>

          <div className="p-6 md:p-8 bg-white border-t border-slate-100">
            <div className="relative group max-w-4xl mx-auto">
              <input 
                type="text" 
                value={input} 
                onChange={e => setInput(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && handleSend()} 
                placeholder="Message your document..." 
                className="w-full p-6 pr-20 bg-slate-900 text-white rounded-3xl outline-none font-medium placeholder-slate-500 focus:ring-4 focus:ring-brand-green/20 transition-all shadow-2xl text-lg" 
              />
              <button 
                onClick={handleSend} 
                disabled={!input.trim() || isLoading}
                className={`absolute right-3 top-3 bottom-3 aspect-square bg-brand-green text-white rounded-2xl transition-all flex items-center justify-center shadow-lg
                  ${input.trim() && !isLoading ? 'hover:bg-green-600 active:scale-90' : 'opacity-20 cursor-not-allowed'}`}
              >
                 <div className={isSending ? 'animate-send-up' : 'transition-transform group-hover:-translate-y-1'}>
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                 </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showTTSMenu && (
        <div className="absolute top-24 right-8 w-64 bg-white border border-slate-200 rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] p-6 z-50 animate-fade-in-up">
           <p className="text-[11px] font-black text-slate-400 uppercase mb-6 tracking-widest text-center border-b border-slate-50 pb-4">Voice Personalization</p>
           <div className="space-y-5">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Region</label>
                <select value={ttsConfig.accent} onChange={e => setTtsConfig({...ttsConfig, accent: e.target.value as Accent})} className="w-full text-xs font-bold p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none hover:border-brand-green transition-colors">
                  {Object.values(Accent).map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Cognitive Tone</label>
                <select value={ttsConfig.tone} onChange={e => setTtsConfig({...ttsConfig, tone: e.target.value as Tone})} className="w-full text-xs font-bold p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none hover:border-brand-green transition-colors">
                  {Object.values(Tone).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <button onClick={() => setShowTTSMenu(false)} className="w-full py-4 bg-brand-dark text-white text-[10px] font-black uppercase rounded-xl hover:bg-black transition-all shadow-lg mt-2">Sync Voice</button>
           </div>
        </div>
      )}

      {showPdfModal && (
        <div className="fixed inset-0 z-[100] bg-brand-dark/95 flex flex-col animate-fade-in backdrop-blur-xl">
           <div className="p-6 flex justify-between items-center text-white border-b border-white/10">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center font-black text-sm">PDF</div>
                 <div>
                    <span className="font-black text-base uppercase tracking-widest block leading-none">Reference Vault</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Viewing Page {selectedPage}</span>
                 </div>
              </div>
              <button 
                onClick={() => setShowPdfModal(false)} 
                className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-black text-xs transition-all uppercase flex items-center gap-3 shadow-2xl ring-8 ring-red-600/10 active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
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
