
import React, { useState } from 'react';
import { Accent, Tone, PodcastConfig } from '../types';

interface PodcastSetupProps {
  topics: string[];
  onStart: (config: PodcastConfig) => void;
  onCancel: () => void;
}

export const PodcastSetup: React.FC<PodcastSetupProps> = ({ topics, onStart, onCancel }) => {
  // Use first topic or a default placeholder
  const [selectedTopic, setSelectedTopic] = useState(topics.length > 0 ? topics[0] : "General Overview");
  const [hostType, setHostType] = useState<'single' | 'double'>('double');
  const [hostNames, setHostNames] = useState<string[]>(['Aura', 'Nova']);
  const [accent, setAccent] = useState<Accent>(Accent.US);
  const [tone, setTone] = useState<Tone>(Tone.FRIENDLY);
  const [duration, setDuration] = useState(5);

  const handleStart = () => {
    // Basic validation
    if (!selectedTopic) return;
    
    onStart({
      topic: selectedTopic,
      hostType,
      hostNames: hostType === 'double' ? hostNames : [hostNames[0]],
      accent,
      tone,
      duration
    });
  };

  return (
    <div className="max-w-2xl mx-auto w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8 md:p-10 animate-fade-in-up">
      <div className="mb-8 border-b border-slate-50 pb-6">
        <button onClick={onCancel} className="text-slate-500 hover:text-brand-dark flex items-center gap-2 text-sm font-black mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back
        </button>
        <h2 className="text-3xl font-black text-brand-dark tracking-tight">Study Podcast Setup</h2>
        <p className="text-slate-500 mt-2 font-medium">Unispace specialized audio synthesis engine.</p>
      </div>

      <div className="space-y-8">
        <div>
          <label className="text-xs font-black text-slate-400 block mb-4 uppercase tracking-[0.2em]">Select Focus Topic</label>
          <select 
            value={selectedTopic} 
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-brand-green font-bold text-slate-700"
          >
            {topics.length > 0 ? (
              topics.map(t => <option key={t} value={t}>{t}</option>)
            ) : (
              <option value="General Overview">General Overview</option>
            )}
          </select>
        </div>

        <div>
          <label className="text-xs font-black text-slate-400 block mb-4 uppercase tracking-[0.2em]">Format & Hosts</label>
          <div className="grid grid-cols-2 gap-4">
             <button 
                type="button"
                onClick={() => setHostType('single')}
                className={`p-4 rounded-2xl border-2 font-bold transition-all ${hostType === 'single' ? 'border-brand-green bg-green-50 text-brand-green' : 'border-slate-100'}`}
             >Solo Host</button>
             <button 
                type="button"
                onClick={() => setHostType('double')}
                className={`p-4 rounded-2xl border-2 font-bold transition-all ${hostType === 'double' ? 'border-brand-green bg-green-50 text-brand-green' : 'border-slate-100'}`}
             >Dual Hosts</button>
          </div>
          
          <div className="mt-4 space-y-3">
             <input 
                type="text" 
                placeholder="Primary Host" 
                value={hostNames[0]} 
                onChange={e => setHostNames([e.target.value, hostNames[1]])}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
             />
             {hostType === 'double' && (
               <input 
                  type="text" 
                  placeholder="Secondary Host" 
                  value={hostNames[1]} 
                  onChange={e => setHostNames([hostNames[0], e.target.value])}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
               />
             )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
           <div>
              <label className="text-xs font-black text-slate-400 block mb-4 uppercase tracking-[0.2em]">Accent</label>
              <select value={accent} onChange={e => setAccent(e.target.value as Accent)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold">
                 {Object.values(Accent).map(a => <option key={a} value={a}>{a}</option>)}
              </select>
           </div>
           <div>
              <label className="text-xs font-black text-slate-400 block mb-4 uppercase tracking-[0.2em]">Tone</label>
              <select value={tone} onChange={e => setTone(e.target.value as Tone)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold">
                 {Object.values(Tone).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
           </div>
        </div>

        <div>
           <div className="flex justify-between items-center mb-4">
              <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Duration</label>
              <span className="text-brand-green font-black">{duration} Minutes</span>
           </div>
           <input 
              type="range" min="3" max="8" step="1" value={duration} 
              onChange={e => setDuration(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-brand-green"
           />
        </div>

        <button 
          type="button"
          onClick={handleStart}
          className="w-full py-5 bg-brand-green text-white rounded-3xl font-black text-xl shadow-2xl hover:bg-green-700 hover:-translate-y-1 transition-all mt-4"
        >
          Initialize Unispace Podcast
        </button>
      </div>
    </div>
  );
};
