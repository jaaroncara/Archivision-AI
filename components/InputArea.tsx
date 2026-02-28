import React, { useCallback, useState } from 'react';
import { ArrowUpTrayIcon, SparklesIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface InputAreaProps {
  onGenerate: (cadFile: File, moodBoardFiles: File[]) => void;
  isGenerating: boolean;
  disabled?: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({ onGenerate, isGenerating, disabled = false }) => {
  const [cadFile, setCadFile] = useState<File | null>(null);
  const [moodBoardFiles, setMoodBoardFiles] = useState<File[]>([]);
  const [isDraggingCad, setIsDraggingCad] = useState(false);
  const [isDraggingMood, setIsDraggingMood] = useState(false);

  const handleCadFile = (file: File) => {
    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      setCadFile(file);
    } else {
      alert("Please upload an image or PDF for the CAD drawing.");
    }
  };

  const handleMoodFiles = (files: FileList) => {
    const newFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    setMoodBoardFiles(prev => [...prev, ...newFiles].slice(0, 5)); // Limit to 5 inspiration images
  };

  const removeMoodFile = (index: number) => {
    setMoodBoardFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerateClick = () => {
    if (!cadFile) {
      alert("Please upload a primary CAD drawing first.");
      return;
    }
    onGenerate(cadFile, moodBoardFiles);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Primary CAD Upload */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 ml-4">Primary CAD Drawing</h4>
          <label
            className={`
              relative flex flex-col items-center justify-center
              h-64 rounded-3xl border transition-all duration-300 overflow-hidden
              ${cadFile ? 'border-white/20 bg-white/5' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05] cursor-pointer'}
              ${isDraggingCad ? 'scale-[1.02] border-white/40 bg-white/10' : ''}
              ${isGenerating ? 'pointer-events-none opacity-50' : ''}
            `}
            onDragOver={(e) => { e.preventDefault(); setIsDraggingCad(true); }}
            onDragLeave={() => setIsDraggingCad(false)}
            onDrop={(e) => { e.preventDefault(); setIsDraggingCad(false); if (e.dataTransfer.files?.[0]) handleCadFile(e.dataTransfer.files[0]); }}
          >
            {cadFile ? (
              <div className="relative w-full h-full group">
                <img 
                  src={URL.createObjectURL(cadFile)} 
                  alt="CAD Preview" 
                  className="w-full h-full object-cover opacity-40"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <PhotoIcon className="w-8 h-8 text-white/60 mb-2" />
                  <span className="text-xs text-white/80 font-medium truncate max-w-full px-4">{cadFile.name}</span>
                  <button 
                    onClick={(e) => { e.preventDefault(); setCadFile(null); }}
                    className="mt-4 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                  >
                    Replace Drawing
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center p-8 space-y-4">
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <ArrowUpTrayIcon className="w-6 h-6 text-white/20" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-white/60 font-light">Drop CAD Drawing</p>
                  <p className="text-[10px] text-white/20 uppercase tracking-widest">Image or PDF</p>
                </div>
              </div>
            )}
            <input 
              type="file" 
              className="hidden" 
              accept="image/*,application/pdf"
              onChange={(e) => e.target.files?.[0] && handleCadFile(e.target.files[0])}
            />
          </label>
        </div>

        {/* Mood Board Upload */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 ml-4">Mood Board Inspiration</h4>
          <div className="grid grid-cols-2 gap-4 h-64">
            {moodBoardFiles.map((file, idx) => (
              <div key={idx} className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/5 group">
                <img 
                  src={URL.createObjectURL(file)} 
                  alt="Inspiration" 
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                />
                <button 
                  onClick={() => removeMoodFile(idx)}
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/40 text-white/60 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </div>
            ))}
            {moodBoardFiles.length < 5 && (
              <label
                className={`
                  relative flex flex-col items-center justify-center
                  rounded-2xl border border-dashed border-white/10 bg-white/[0.02] hover:bg-white/[0.05] 
                  cursor-pointer transition-all duration-300
                  ${isDraggingMood ? 'border-white/40 bg-white/10' : ''}
                  ${isGenerating ? 'pointer-events-none opacity-50' : ''}
                `}
                onDragOver={(e) => { e.preventDefault(); setIsDraggingMood(true); }}
                onDragLeave={() => setIsDraggingMood(false)}
                onDrop={(e) => { e.preventDefault(); setIsDraggingMood(false); if (e.dataTransfer.files) handleMoodFiles(e.dataTransfer.files); }}
              >
                <div className="flex flex-col items-center space-y-2">
                  <SparklesIcon className="w-5 h-5 text-white/20" />
                  <span className="text-[10px] text-white/40 uppercase tracking-widest">Add Inspiration</span>
                </div>
                <input 
                  type="file" 
                  multiple 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => e.target.files && handleMoodFiles(e.target.files)}
                />
              </label>
            )}
          </div>
        </div>

      </div>

      {/* Action Button */}
      <div className="flex justify-center pt-4">
        <button
          onClick={handleGenerateClick}
          disabled={!cadFile || isGenerating}
          className={`
            group relative px-12 py-4 rounded-full overflow-hidden transition-all duration-500
            ${!cadFile || isGenerating 
              ? 'bg-white/5 text-white/20 cursor-not-allowed' 
              : 'bg-white text-black hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.1)]'
            }
          `}
        >
          <div className="relative z-10 flex items-center space-x-3">
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-black/10 border-t-black rounded-full animate-spin" />
                <span className="text-xs font-bold uppercase tracking-[0.2em]">Rendering Vision...</span>
              </>
            ) : (
              <>
                <SparklesIcon className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-[0.2em]">Generate Realistic Rendering</span>
              </>
            )}
          </div>
        </button>
      </div>
    </div>
  );
};
