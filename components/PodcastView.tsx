
import React, { useRef, useState, useEffect } from 'react';
import { PodcastResult } from '../types';
import { playRawPcm, audioBufferToMp3Compatible } from '../services/geminiService';

interface PodcastViewProps {
  podcast: PodcastResult;
  onBack: () => void;
}

export const PodcastView: React.FC<PodcastViewProps> = ({ podcast, onBack }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playbackOffset, setPlaybackOffset] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const startTimeRef = useRef<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => stopPlayback();
  }, []);

  const stopPlayback = () => {
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch(e) {}
      audioSourceRef.current = null;
    }
    setIsPlaying(false);
  };

  const startPlayback = (offset: number) => {
    if (!audioBufferRef.current || !audioCtxRef.current) return;
    
    // Restart logic: if at end, start from zero
    let startAt = offset;
    if (startAt >= audioBufferRef.current.duration) startAt = 0;

    stopPlayback();
    
    const source = audioCtxRef.current.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.connect(audioCtxRef.current.destination);
    
    source.onended = () => {
      if (audioSourceRef.current === source) {
        setIsPlaying(false);
        setPlaybackOffset(0); 
      }
    };

    source.start(0, startAt);
    audioSourceRef.current = source;
    startTimeRef.current = audioCtxRef.current.currentTime - startAt;
    setIsPlaying(true);
    setPlaybackOffset(startAt);
  };

  const handlePlayToggle = async () => {
    if (!podcast.audioBase64) {
      setError("Audio unavailable.");
      return;
    }

    if (isPlaying) {
      const current = audioCtxRef.current ? audioCtxRef.current.currentTime - startTimeRef.current : playbackOffset;
      setPlaybackOffset(current);
      stopPlayback();
    } else {
      if (!audioBufferRef.current) {
        const result = await playRawPcm(podcast.audioBase64);
        if (result) {
          audioBufferRef.current = result.audioBuffer;
          audioCtxRef.current = result.audioCtx;
          setDuration(result.audioBuffer.duration);
          startPlayback(playbackOffset);
        }
      } else {
        startPlayback(playbackOffset >= audioBufferRef.current.duration ? 0 : playbackOffset);
      }
    }
  };

  const handleSeek = (seconds: number) => {
    if (!audioBufferRef.current) return;
    const current = isPlaying ? (audioCtxRef.current ? audioCtxRef.current.currentTime - startTimeRef.current : playbackOffset) : playbackOffset;
    let next = current + seconds;
    
    if (next >= audioBufferRef.current.duration) next = 0;
    else if (next < 0) next = 0;

    setPlaybackOffset(next);
    stopPlayback();
    // User must click play again to resume after seek
  };

  const downloadAudio = () => {
    if (!audioBufferRef.current) {
      handlePlayToggle().then(() => {
        if (audioBufferRef.current) {
          const mp3Blob = audioBufferToMp3Compatible(audioBufferRef.current);
          const link = document.createElement('a');
          link.href = URL.createObjectURL(mp3Blob);
          link.download = `Unispace-${podcast.topic.replace(/\s+/g, '-')}.mp3`;
          link.click();
        }
      });
      return;
    }
    const mp3Blob = audioBufferToMp3Compatible(audioBufferRef.current);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(mp3Blob);
    link.download = `Unispace-${podcast.topic.replace(/\s+/g, '-')}.mp3`;
    link.click();
  };

  const formatTranscript = (text: string) => {
    return text.split('\n').map((line, i) => {
      const match = line.match(/^([^:]+): (.*)$/);
      if (match) {
        const [_, speaker, content] = match;
        return (
          <div key={i} className="mb-6 last:mb-0 group">
            <span className="text-[10px] font-black text-brand-green uppercase tracking-widest block mb-1 opacity-60 dark:opacity-40 group-hover:opacity-100 transition-opacity">
              {speaker}
            </span>
            <p className="text-xl text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {content}
            </p>
          </div>
        );
      }
      return line.trim() ? <p key={i} className="mb-4 text-slate-500 italic">{line}</p> : null;
    });
  };

  const progress = duration > 0 ? (playbackOffset / duration) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto w-full px-4 pb-24 animate-fade-in">
      <div className="py-8">
        <button onClick={onBack} className="text-slate-500 dark:text-slate-400 hover:text-brand-dark dark:hover:text-white flex items-center gap-2 text-sm font-bold mb-8 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Study Hub
        </button>
        
        {error && (
          <div className="mb-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-6 py-4 rounded-2xl flex justify-between items-center shadow-lg">
             <span className="font-bold">{error}</span>
          </div>
        )}

        <div className="bg-brand-dark text-white rounded-[40px] p-10 md:p-16 shadow-2xl relative overflow-hidden mb-16 ring-1 ring-white/10 group">
           <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-brand-green/10 rounded-full blur-[100px] transition-all duration-700"></div>
           
           <div className="relative z-10 flex flex-col md:flex-row items-center gap-12 text-center md:text-left">
              <div className="flex flex-col items-center gap-6">
                 
                 <div className="flex items-center gap-6">
                    <button 
                      onClick={() => handleSeek(-15)}
                      disabled={!podcast.audioBase64}
                      className="p-3 bg-white/10 rounded-full hover:bg-white/20 text-white transition-all active:scale-90"
                      title="Back 15s"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M5 12h13" /></svg>
                    </button>

                    <div className="relative">
                      <div className={`absolute inset-0 bg-brand-green rounded-full blur-3xl opacity-20 transition-all duration-500 ${isPlaying ? 'scale-150 animate-pulse' : 'scale-100'}`}></div>
                      <button 
                        onClick={handlePlayToggle}
                        className={`w-28 h-28 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-2xl relative z-10
                          ${isPlaying ? 'bg-red-500' : 'bg-brand-green'} ${!podcast.audioBase64 ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                      >
                        {isPlaying ? (
                          <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM10 7a1 1 0 011 1v4a1 1 0 11-2 0V8a1 1 0 011-1z" clipRule="evenodd" /></svg>
                        ) : (
                          <svg className="w-12 h-12 ml-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                        )}
                      </button>
                    </div>

                    <button 
                      onClick={() => handleSeek(15)}
                      disabled={!podcast.audioBase64}
                      className="p-3 bg-white/10 rounded-full hover:bg-white/20 text-white transition-all active:scale-90"
                      title="Forward 15s (Pauses)"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M19 12H6" /></svg>
                    </button>
                 </div>
                 
                 <div className="flex flex-col items-center gap-1">
                    <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
                       <div className="h-full bg-brand-green transition-all" style={{ width: `${progress}%` }}></div>
                    </div>
                 </div>
              </div>
              
              <div className="flex-1">
                 <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
                    <span className="bg-brand-green/20 text-brand-green text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest border border-brand-green/20">
                      Hi-Fi MP3
                    </span>
                    {podcast.audioBase64 && (
                      <button 
                        onClick={downloadAudio}
                        className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest border border-white/10 flex items-center gap-1 transition-all"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Download MP3
                      </button>
                    )}
                 </div>
                 <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight tracking-tight text-white">{podcast.topic}</h2>
                 <p className="text-slate-400 font-medium text-lg leading-relaxed max-w-xl">
                    Custom synthesized study lesson. Seeking to the end restarts the audio from the beginning.
                 </p>
              </div>
           </div>
        </div>

        <div className="space-y-12">
           <div className="flex items-center gap-6">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex-shrink-0">Script</h3>
              <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
           </div>
           
           <div className="bg-white dark:bg-slate-900 rounded-[32px] p-10 md:p-16 border border-slate-200 dark:border-slate-800 shadow-xl relative transition-colors duration-300">
              {formatTranscript(podcast.transcript)}
           </div>
        </div>
      </div>
    </div>
  );
};
