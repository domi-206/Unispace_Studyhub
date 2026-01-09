
import React, { useState, useEffect, useMemo } from 'react';

interface PdfViewerProps {
  base64: string;
  page?: number;
  onClose?: () => void;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ base64, page, onClose }) => {
  const [objectUrl, setObjectUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!base64) return;

    try {
      // Clean base64 string from any potential whitespace which can break atob
      const cleanBase64 = base64.replace(/\s/g, '');
      const binaryString = atob(cleanBase64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setObjectUrl(url);
      setError(null);

      // Cleanup: Revoke the object URL when component unmounts or base64 changes
      return () => {
        URL.revokeObjectURL(url);
      };
    } catch (e) {
      console.error("PDF Decoding Error:", e);
      setError("The document could not be decoded. It might be too large or corrupted.");
    }
  }, [base64]);

  const finalUrl = useMemo(() => {
    if (!objectUrl) return '';
    // Browser-native PDF viewers support #page=X fragments
    return page ? `${objectUrl}#page=${page}` : objectUrl;
  }, [objectUrl, page]);

  const handleOpenNewTab = () => {
    if (finalUrl) window.open(finalUrl, '_blank');
  };

  const handleDownload = () => {
    if (!objectUrl) return;
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = "course-document.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-hidden rounded-2xl border border-slate-700 shadow-2xl animate-fade-in">
      <div className="flex justify-between items-center p-4 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-bold text-xs">PDF</div>
          <span className="text-slate-200 font-bold text-sm tracking-tight">
            Source Reference {page ? `- Page ${page}` : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {objectUrl && (
            <button 
              onClick={handleDownload}
              className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-xs font-bold"
              title="Download PDF"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          )}
          <button 
            onClick={handleOpenNewTab}
            className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-xs font-bold"
            title="Open in New Tab"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Full
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 bg-slate-100 relative">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <svg className="w-16 h-16 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-slate-600 font-bold mb-4">{error}</p>
            <button 
              onClick={handleDownload}
              className="px-6 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-black transition-colors"
            >
              Download PDF Instead
            </button>
          </div>
        ) : finalUrl ? (
          <iframe
            key={finalUrl} // Force re-render of iframe on page/url change for better reliability
            src={finalUrl}
            className="w-full h-full border-none"
            title="PDF Viewer"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="w-10 h-10 border-4 border-slate-300 border-t-brand-green rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </div>
  );
};
