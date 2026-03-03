/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useState, useRef } from 'react';
import { ArrowDownTrayIcon, PlusIcon, ViewColumnsIcon, DocumentIcon, CodeBracketIcon, XMarkIcon, PhotoIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Creation } from './CreationHistory';
import { Logo } from './Logo';

interface LivePreviewProps {
  creation: Creation | null;
  isLoading: boolean;
  isFocused: boolean;
  onReset: () => void;
  onRefine: (prompt: string) => void;
}

// Add type definition for the global pdfjsLib
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

const LoadingStep = ({ text, active, completed }: { text: string, active: boolean, completed: boolean }) => (
    <div className={`flex items-center space-x-3 transition-all duration-500 ${active || completed ? 'opacity-100 translate-x-0' : 'opacity-30 translate-x-4'}`}>
        <div className={`w-3 h-3 flex items-center justify-center ${completed ? 'text-white/60' : active ? 'text-white/60' : 'text-white/10'}`}>
            {completed ? (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            ) : active ? (
                <div className="w-1 h-1 bg-white/60 rounded-full"></div>
            ) : (
                <div className="w-1 h-1 bg-white/10 rounded-full"></div>
            )}
        </div>
        <span className={`font-mono text-[9px] tracking-[0.2em] uppercase ${active ? 'text-white' : completed ? 'text-white/40' : 'text-white/10'}`}>{text}</span>
    </div>
);

const PdfRenderer = ({ dataUrl }: { dataUrl: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderPdf = async () => {
      if (!window.pdfjsLib) {
        setError("PDF library not initialized");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Load the document
        const loadingTask = window.pdfjsLib.getDocument(dataUrl);
        const pdf = await loadingTask.promise;
        
        // Get the first page
        const page = await pdf.getPage(1);
        
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        
        // Calculate scale to make it look good (High DPI)
        const viewport = page.getViewport({ scale: 2.0 });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
        setLoading(false);
      } catch (err) {
        console.error("Error rendering PDF:", err);
        setError("Could not render PDF preview.");
        setLoading(false);
      }
    };

    renderPdf();
  }, [dataUrl]);

  if (error) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-zinc-500 p-6 text-center">
            <DocumentIcon className="w-12 h-12 mb-3 opacity-50 text-red-400" />
            <p className="text-sm mb-2 text-red-400/80">{error}</p>
        </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
        {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
        )}
        <canvas 
            ref={canvasRef} 
            className={`max-w-full max-h-full object-contain shadow-xl border border-zinc-800/50 rounded transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`}
        />
    </div>
  );
};

export const LivePreview: React.FC<LivePreviewProps> = ({ creation, isLoading, isFocused, onReset, onRefine }) => {
    const [loadingStep, setLoadingStep] = useState(0);
    const [showSplitView, setShowSplitView] = useState(false);
  const [refinePrompt, setRefinePrompt] = useState('');
  const refineTextareaRef = useRef<HTMLTextAreaElement>(null);

    // Handle loading animation steps
    useEffect(() => {
        if (isLoading) {
            setLoadingStep(0);
            const interval = setInterval(() => {
                setLoadingStep(prev => (prev < 3 ? prev + 1 : prev));
            }, 2000); 
            return () => clearInterval(interval);
        } else {
            setLoadingStep(0);
        }
    }, [isLoading]);

    // Default to Split View when a new creation with an image is loaded
    useEffect(() => {
        if (creation?.originalImage) {
            setShowSplitView(true);
        } else {
            setShowSplitView(false);
        }
    }, [creation]);

    useEffect(() => {
      if (!creation?.renderedImage || isLoading) return;

      const frame = requestAnimationFrame(() => {
        const textarea = refineTextareaRef.current;
        if (!textarea) return;

        textarea.focus();
        if (textarea.value.trim().length > 0) {
          textarea.select();
        } else {
          const end = textarea.value.length;
          textarea.setSelectionRange(end, end);
        }
      });

      return () => cancelAnimationFrame(frame);
    }, [creation?.renderedImage, isLoading]);

    const handleDownloadImage = () => {
        if (!creation?.renderedImage) return;
        const link = document.createElement('a');
        link.href = creation.renderedImage;
        link.download = `${creation.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_render.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExport = () => {
        if (!creation) return;
        const dataStr = JSON.stringify(creation, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${creation.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_artifact.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

      const handleRefineSubmit = () => {
        const trimmedPrompt = refinePrompt.trim();
        if (!trimmedPrompt || isLoading) return;
        onRefine(trimmedPrompt);
        setRefinePrompt('');
      };

    const handleRefineKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key !== 'Enter') return;
        if (e.shiftKey) return;

        e.preventDefault();
        handleRefineSubmit();
    };

  return (
    <div
      className={`
        fixed z-40 flex flex-col
        rounded-3xl overflow-hidden border border-white/10 bg-[#0A0A0A] shadow-2xl
        transition-all duration-700 cubic-bezier(0.2, 0.8, 0.2, 1)
        ${isFocused
          ? 'inset-2 md:inset-6 opacity-100 scale-100'
          : 'top-1/2 left-1/2 w-[90%] h-[60%] -translate-x-1/2 -translate-y-1/2 opacity-0 scale-95 pointer-events-none'
        }
      `}
    >
      {/* Minimal Architectural Header */}
      <div className="bg-[#0A0A0A] px-6 py-4 flex items-center justify-between border-b border-white/5 shrink-0">
        {/* Left: Controls */}
        <div className="flex items-center space-x-3 w-32">
           <div className="flex space-x-2 group/controls">
                <button 
                  onClick={onReset}
                  className="w-3 h-3 rounded-full bg-white/5 group-hover/controls:bg-white/20 hover:!bg-white/30 transition-colors flex items-center justify-center focus:outline-none"
                  title="Close Preview"
                >
                  <XMarkIcon className="w-2 h-2 text-white opacity-0 group-hover/controls:opacity-100" />
                </button>
                <div className="w-3 h-3 rounded-full bg-white/5 group-hover/controls:bg-white/10 transition-colors"></div>
                <div className="w-3 h-3 rounded-full bg-white/5 group-hover/controls:bg-white/10 transition-colors"></div>
           </div>
        </div>
        
        {/* Center: Title */}
        <div className="flex items-center space-x-3 text-white/40">
            <Logo className="w-4 h-4 opacity-50" />
            <span className="text-[9px] font-mono uppercase tracking-[0.2em]">
                {isLoading ? 'Synthesizing Vision' : creation ? creation.name : 'Preview Mode'}
            </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center justify-end space-x-2 w-32">
            {!isLoading && creation && (
                <>
                    {creation.originalImage && (
                         <button 
                            onClick={() => setShowSplitView(!showSplitView)}
                            title={showSplitView ? "Show App Only" : "Compare with Original"}
                            className={`p-1.5 rounded-full transition-all ${showSplitView ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                        >
                            <ViewColumnsIcon className="w-3.5 h-3.5" />
                        </button>
                    )}

                    <button 
                        onClick={handleDownloadImage}
                        title="Download Render (JPG)"
                        className="text-white/40 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/5"
                    >
                        <PhotoIcon className="w-3.5 h-3.5" />
                    </button>

                    <button 
                        onClick={handleExport}
                        title="Export Artifact (JSON)"
                        className="text-white/40 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/5"
                    >
                        <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                    </button>

                    <button 
                        onClick={onReset}
                        title="New Upload"
                        className="ml-2 flex items-center space-x-1 text-[9px] font-bold tracking-widest uppercase bg-white/10 text-white hover:bg-white/20 px-4 py-2 rounded-full transition-colors border border-white/10"
                    >
                        <PlusIcon className="w-2.5 h-2.5" />
                        <span className="hidden sm:inline">New</span>
                    </button>
                </>
            )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative w-full flex-1 bg-[#050505] flex overflow-hidden">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 w-full">
             {/* Architectural Loading State */}
             <div className="w-full max-w-md space-y-12">
                <div className="flex flex-col items-center">
                    <div className="w-10 h-10 mb-8 text-white/20">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-white/80 font-light text-xl tracking-tight">Constructing Environment</h3>
                    <p className="text-white/20 text-[9px] uppercase tracking-[0.2em] mt-3">Interpreting visual data...</p>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-px bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-white/40 animate-[loading_3s_ease-in-out_infinite] w-1/3"></div>
                </div>

                 {/* Terminal Steps */}
                 <div className="border border-white/5 bg-white/[0.02] backdrop-blur-sm rounded-2xl p-6 space-y-4">
                     <LoadingStep text="Analyzing CAD geometry" active={loadingStep === 0} completed={loadingStep > 0} />
                     <LoadingStep text="Extracting mood board style" active={loadingStep === 1} completed={loadingStep > 1} />
                     <LoadingStep text="Synthesizing materials & light" active={loadingStep === 2} completed={loadingStep > 2} />
                     <LoadingStep text="Generating realistic rendering" active={loadingStep === 3} completed={loadingStep > 3} />
                 </div>
             </div>
          </div>
        ) : creation?.renderedImage ? (
          <>
            {/* Split View: Left Panel (Original Image) */}
            {showSplitView && creation.originalImage && (
                <div className="w-full md:w-1/2 h-1/2 md:h-full border-b md:border-b-0 md:border-r border-white/5 bg-[#050505] relative flex flex-col shrink-0">
                    <div className="absolute top-6 left-6 z-10 bg-black/40 backdrop-blur text-white/30 text-[9px] font-mono uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border border-white/5">
                        CAD Input
                    </div>
                    <div className="w-full h-full p-12 flex items-center justify-center overflow-hidden">
                        {creation.originalImage.startsWith('data:application/pdf') ? (
                            <PdfRenderer dataUrl={creation.originalImage} />
                        ) : (
                            <img 
                                src={creation.originalImage} 
                                alt="Original Input" 
                                className="max-w-full max-h-full object-contain shadow-2xl border border-white/5 rounded-lg opacity-80"
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Rendering Preview Panel */}
            <div className={`relative h-full bg-[#050505] transition-all duration-500 flex items-center justify-center p-8 overflow-hidden ${showSplitView && creation.originalImage ? 'w-full md:w-1/2 h-1/2 md:h-full' : 'w-full'}`}>
                 <div className="absolute top-6 left-6 z-10 bg-white/10 backdrop-blur text-white/80 text-[9px] font-mono uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border border-white/10">
                    Final Rendering
                 </div>
                 <img
                    src={creation.renderedImage}
                    alt="Archivision AI Rendering"
                    className="max-w-full max-h-full object-contain shadow-[0_0_100px_rgba(255,255,255,0.05)] rounded-xl border border-white/10"
                />

              <div className="absolute bottom-6 left-6 right-6 md:left-auto md:w-[460px] bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <SparklesIcon className="w-3.5 h-3.5 text-white/70" />
                  <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/70">Refine Mockup</span>
                </div>
                <div className="flex items-end gap-2">
                  <textarea
                    ref={refineTextareaRef}
                    value={refinePrompt}
                    onChange={(e) => setRefinePrompt(e.target.value)}
                    onKeyDown={handleRefineKeyDown}
                    placeholder="e.g. warm lighting, less saturation, lighter oak flooring"
                    rows={2}
                    className="w-full resize-none rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleRefineSubmit}
                    disabled={isLoading || !refinePrompt.trim()}
                    className={`shrink-0 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.16em] border transition-colors ${isLoading || !refinePrompt.trim() ? 'bg-white/5 text-white/20 border-white/10 cursor-not-allowed' : 'bg-white text-black border-white hover:bg-white/90'}`}
                  >
                    Refine
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-end gap-2 text-[9px] text-white/35 font-mono uppercase tracking-[0.15em]">
                  <span className="px-2 py-1 rounded-md border border-white/10 bg-white/5 text-white/45">Enter</span>
                  <span>Refine</span>
                  <span className="px-2 py-1 rounded-md border border-white/10 bg-white/5 text-white/45">Shift + Enter</span>
                  <span>New Line</span>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};
