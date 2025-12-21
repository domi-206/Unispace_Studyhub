
import React, { useRef, useState } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndUpload(e.target.files[0]);
    }
  };

  const validateAndUpload = (file: File) => {
    if (file.type === 'application/pdf') {
      onFileSelect(file);
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-3xl shadow-xl p-8 md:p-12 text-center border border-slate-200">
      <div
        className={`relative transition-all duration-300 ease-in-out cursor-pointer group p-10 border-2 border-dashed rounded-3xl
          ${isDragging ? 'border-brand-green bg-green-50' : 'border-slate-200 hover:border-brand-green'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          ref={inputRef}
          onChange={handleChange}
        />
        
        <div className="mb-6 flex justify-center">
          <div className={`p-6 rounded-2xl transition-all ${isDragging ? 'bg-brand-green text-white scale-110' : 'bg-green-50 text-brand-green'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
        </div>
        
        <h3 className="text-2xl font-black text-brand-dark mb-2">Upload Course Material</h3>
        <p className="text-slate-500 mb-8 font-medium">Drag and drop your course PDF here to begin your Unispace journey.</p>
        
        <div className="px-8 py-4 bg-brand-green text-white rounded-2xl font-black shadow-lg shadow-green-200 hover:bg-green-700 hover:-translate-y-1 transition-all flex items-center gap-3 mx-auto w-fit">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
             <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Browse Files
        </div>
      </div>
    </div>
  );
};
