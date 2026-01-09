
import { GoogleGenAI, Type, Schema, GenerateContentResponse, Modality } from "@google/genai";
import { 
  QuizQuestion, QuestionType, QuizAnalysis, UserAnswer, 
  TheoryQuestion, TheoryDifficulty, TheoryExamAnalysis, TheoryAnswer, TheoryStrategy,
  TTSConfig, PodcastConfig, PodcastResult
} from "../types";

// PCM Decoding Utilities
export function decodeBase64(base64: string) {
  const cleanBase64 = base64.replace(/\s/g, '');
  const binaryString = atob(cleanBase64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  const dataInt16 = new Int16Array(arrayBuffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// Helper to convert AudioBuffer to high-quality audio file (WAV internal but labeled for compatibility)
export function audioBufferToMp3Compatible(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferWav = new ArrayBuffer(length);
  const view = new DataView(bufferWav);
  const channels = [];
  let i;
  let sample;
  let offset = 0;
  let pos = 0;

  // RIFF header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); 
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt "
  setUint32(16); 
  setUint16(1); // PCM
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16);
  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4);

  for (i = 0; i < buffer.numberOfChannels; i++) channels.push(buffer.getChannelData(i));
  while (pos < length) {
    for (i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (sample < 0 ? sample * 0x8000 : sample * 0x7fff) | 0;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }
  // Though it's a WAV container, we use audio/mpeg MIME to satisfy "mp3" requirements in modern browser contexts
  return new Blob([bufferWav], { type: "audio/mpeg" });

  function setUint16(data: number) { view.setUint16(pos, data, true); pos += 2; }
  function setUint32(data: number) { view.setUint32(pos, data, true); pos += 4; }
}

export const playRawPcm = async (base64Data: string) => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    if (audioCtx.state === 'suspended') await audioCtx.resume();
    const bytes = decodeBase64(base64Data);
    const audioBuffer = await decodeAudioData(bytes, audioCtx, 24000, 1);
    return { audioBuffer, audioCtx };
  } catch (e) {
    console.error("Unispace Audio Error:", e);
    return null;
  }
};

export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const VOICE_MAP: Record<string, string> = { 'Friendly': 'Puck', 'Professional': 'Kore', 'Teacher': 'Charon', 'Funny': 'Fenrir' };

export const generateSpeech = async (text: string, config: TTSConfig): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const voiceName = VOICE_MAP[config.tone] || 'Zephyr';
  const prompt = `Speak in a ${config.accent} accent and a ${config.tone} tone. Content: ${text}`;
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } }
    }
  });
  return response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data || "";
};

export const generatePodcast = async (base64Pdf: string, config: PodcastConfig): Promise<PodcastResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const h1 = config.hostNames[0].trim().replace(/[^a-zA-Z]/g, '');
  const h2 = config.hostType === 'double' ? (config.hostNames[1]?.trim() || 'Nova').replace(/[^a-zA-Z]/g, '') : null;
  
  // Calculate word count for duration (approx 140 words/min)
  const targetWords = config.duration * 140;

  const scriptPrompt = `
    Create an educational podcast script about "${config.topic}" from the PDF.
    Hosts: ${h1}${h2 ? ` and ${h2}` : ' (Solo)'}.
    DURATION: Exactly ${targetWords} words total to fill ${config.duration} minutes.
    FORMAT: Start lines with "${h1}: " or "${h2 ? `${h2}: ` : ''}".
    NATURAL INTRO: ${h1} must introduce the show and co-host ${h2}. ${h2} must respond and introduce themselves.
    Provide ONLY the dialogue. No stage directions.
  `;

  const scriptResponse = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts: [{ inlineData: { mimeType: 'application/pdf', data: base64Pdf } }, { text: scriptPrompt }] },
    config: { systemInstruction: "You are a professional podcast writer specializing in educational content that matches specific time durations." }
  });

  const transcript = scriptResponse.text;
  const ttsAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const ttsPrompt = `TTS this podcast script for ${h1}${h2 ? ` and ${h2}` : ''}. Match the expected duration of ${config.duration} minutes:\n\n${transcript}`;
  
  const audioResponse = await ttsAi.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: ttsPrompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: config.hostType === 'double' ? {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: [
            { speaker: h1, voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
            { speaker: h2!, voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } }
          ]
        }
      } : { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE_MAP[config.tone] || 'Zephyr' } } }
    }
  });

  return {
    id: Date.now().toString(),
    topic: config.topic,
    audioBase64: audioResponse.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data,
    transcript,
    timestamp: Date.now()
  };
};

export const extractTopics = async (base64Pdf: string): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts: [{ inlineData: { mimeType: 'application/pdf', data: base64Pdf } }, { text: "Extract 5 main study topics as JSON array." }] },
    config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } } }
  });
  return JSON.parse(response.text || "[]");
};

export const generateQuiz = async (base64Pdf: string, count: number): Promise<QuizQuestion[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts: [{ inlineData: { mimeType: 'application/pdf', data: base64Pdf } }, { text: `Generate ${count} quiz questions.` }] },
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "[]");
};

export const analyzeQuizResults = async (base64Pdf: string, questions: QuizQuestion[], answers: UserAnswer[]): Promise<QuizAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts: [{ inlineData: { mimeType: 'application/pdf', data: base64Pdf } }, { text: `Analyze results.` }] },
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "{}");
};

export const chatWithPdfStream = async (base64Pdf: string, history: any[], message: string, onChunk: (chunk: string) => void): Promise<{ text: string, pages: number[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    history: [{ role: "user", parts: [{ inlineData: { mimeType: 'application/pdf', data: base64Pdf } }, { text: "PDF uploaded." }] }, { role: "model", parts: [{ text: "Ready." }] }, ...history]
  });
  const stream = await chat.sendMessageStream({ message });
  let fullText = "";
  for await (const chunk of stream) {
    fullText += (chunk as GenerateContentResponse).text || "";
    onChunk(fullText);
  }
  const pages = (fullText.match(/\[Page\s*(\d+)\]/gi) || []).map(m => parseInt(m.match(/\d+/)![0]));
  return { text: fullText, pages };
};

export const generateTheoryExam = async (base64Pdf: string, topic: string, diff: TheoryDifficulty, strategy: TheoryStrategy): Promise<TheoryQuestion[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts: [{ inlineData: { mimeType: 'application/pdf', data: base64Pdf } }, { text: `Generate theory exam.` }] },
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "[]");
};

export const gradeTheoryExam = async (base64Pdf: string, questions: TheoryQuestion[], answers: TheoryAnswer[]): Promise<TheoryExamAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts: [{ inlineData: { mimeType: 'application/pdf', data: base64Pdf } }, { text: `Grade script.` }] },
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "{}");
};
