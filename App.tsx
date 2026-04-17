/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { Hero } from './components/Hero';
import { InputArea } from './components/InputArea';
import { LivePreview } from './components/LivePreview';
import { CreationHistory, Creation } from './components/CreationHistory';
import { Logo } from './components/Logo';
import { renderVision, refineVision, InputImage } from './services/gemini';
import { ArrowUpTrayIcon, KeyIcon } from '@heroicons/react/24/solid';

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const App: React.FC = () => {
  const [activeCreation, setActiveCreation] = useState<Creation | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<Creation[]>([]);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Check for API key on mount
  useEffect(() => {
    const checkApiKey = async () => {
      try {
        if (window.aistudio?.hasSelectedApiKey) {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          setHasApiKey(hasKey);
          return;
        }

        // We now rely on the secure Express backend, assume the key is present there
        setHasApiKey(true);
      } catch (e) {
        console.error("Failed to check API key", e);
        setHasApiKey(true);
      }
    };
    checkApiKey();
  }, []);

  const handleOpenKeySelector = async () => {
    try {
      if (!window.aistudio?.openSelectKey) {
        // Relying on the backend.
        setHasApiKey(true);
        return;
      }
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    } catch (e) {
      console.error("Failed to open key selector", e);
    }
  };

  // Load history from local storage or fetch examples on mount
  useEffect(() => {
    const initHistory = async () => {
      const saved = localStorage.getItem('gemini_app_history');
      let loadedHistory: Creation[] = [];

      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          loadedHistory = parsed.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp)
          }));
        } catch (e) {
          console.error("Failed to load history", e);
        }
      }

      if (loadedHistory.length > 0) {
        setHistory(loadedHistory);
      } else {
        // No default examples for this specialized app yet
        setHistory([]);
      }
    };

    initHistory();
  }, []);

  // Save history when it changes
  useEffect(() => {
    if (history.length > 0) {
      try {
        localStorage.setItem('gemini_app_history', JSON.stringify(history));
      } catch (e) {
        console.warn("Local storage full or error saving history", e);
      }
    }
  }, [history]);

  // Helper to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const dataUrlToInputImage = (dataUrl: string): InputImage | null => {
    const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!matches) return null;

    return {
      mimeType: matches[1],
      data: matches[2]
    };
  };

  const handleGenerate = async (cadFile: File, moodBoardFiles: File[]) => {
    setIsGenerating(true);
    setActiveCreation(null);

    try {
      const cadBase64 = await fileToBase64(cadFile);
      const cadInput: InputImage = {
        data: cadBase64,
        mimeType: cadFile.type
      };

      const moodBoardInputs: InputImage[] = await Promise.all(
        moodBoardFiles.map(async (f) => ({
          data: await fileToBase64(f),
          mimeType: f.type
        }))
      );

      const renderedImageUrl = await renderVision(cadInput, moodBoardInputs);

      if (renderedImageUrl) {
        const newCreation: Creation = {
          id: crypto.randomUUID(),
          name: cadFile.name,
          renderedImage: renderedImageUrl,
          originalImage: `data:${cadFile.type};base64,${cadBase64}`,
          moodBoardImages: moodBoardInputs.map(m => `data:${m.mimeType};base64,${m.data}`),
          timestamp: new Date(),
        };
        setActiveCreation(newCreation);
        setHistory(prev => [newCreation, ...prev]);
      }

    } catch (error: any) {
      console.error("Failed to generate:", error);
      if (error?.message?.includes("Requested entity was not found")) {
        setHasApiKey(false);
        alert("Your API key session has expired or is invalid. Please select your API key again.");
      } else if (error?.message?.includes("Could not reach")) {
        alert(error.message);
      } else {
        alert("Something went wrong while rendering your vision. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setActiveCreation(null);
    setIsGenerating(false);
  };

  const handleRefine = async (refinementPrompt: string) => {
    if (!activeCreation) return;

    const trimmedPrompt = refinementPrompt.trim();
    if (!trimmedPrompt) return;

    const renderedImageInput = dataUrlToInputImage(activeCreation.renderedImage);
    if (!renderedImageInput) {
      alert("Failed to parse generated image for refinement.");
      return;
    }

    const contextImages: InputImage[] = [];
    const originalImageInput = activeCreation.originalImage
      ? dataUrlToInputImage(activeCreation.originalImage)
      : null;

    if (originalImageInput && originalImageInput.mimeType.startsWith('image/')) {
      contextImages.push(originalImageInput);
    }

    for (const moodImage of activeCreation.moodBoardImages || []) {
      const moodImageInput = dataUrlToInputImage(moodImage);
      if (moodImageInput && moodImageInput.mimeType.startsWith('image/')) {
        contextImages.push(moodImageInput);
      }
    }

    setIsGenerating(true);

    try {
      const refinedImageUrl = await refineVision(renderedImageInput, trimmedPrompt, contextImages);

      const refinedCreation: Creation = {
        ...activeCreation,
        id: crypto.randomUUID(),
        name: `${activeCreation.name} (Refined)`,
        renderedImage: refinedImageUrl,
        timestamp: new Date(),
      };

      setActiveCreation(refinedCreation);
      setHistory(prev => [refinedCreation, ...prev]);
    } catch (error: any) {
      console.error("Failed to refine:", error);
      if (error?.message?.includes("Requested entity was not found")) {
        setHasApiKey(false);
        alert("Your API key session has expired or is invalid. Please select your API key again.");
      } else if (error?.message?.includes("Could not reach")) {
        alert(error.message);
      } else {
        alert("Something went wrong while refining your mockup. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectCreation = (creation: Creation) => {
    setActiveCreation(creation);
  };

  const handleDeleteCreation = (id: string) => {
    setHistory(prev => prev.filter(c => c.id !== id));
    if (activeCreation?.id === id) {
      setActiveCreation(null);
    }
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const parsed = JSON.parse(json);

        // Basic validation
        if (parsed.renderedImage && parsed.name) {
          const importedCreation: Creation = {
            ...parsed,
            timestamp: new Date(parsed.timestamp || Date.now()),
            id: parsed.id || crypto.randomUUID()
          };

          // Add to history if not already there (by ID check)
          setHistory(prev => {
            const exists = prev.some(c => c.id === importedCreation.id);
            return exists ? prev : [importedCreation, ...prev];
          });

          // Set as active immediately
          setActiveCreation(importedCreation);
        } else {
          alert("Invalid creation file format.");
        }
      } catch (err) {
        console.error("Import error", err);
        alert("Failed to import creation.");
      }
      // Reset input
      if (importInputRef.current) importInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const isFocused = !!activeCreation || isGenerating;

  if (hasApiKey === false) {
    return (
      <div className="h-[100dvh] bg-[#050505] flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <Logo className="w-10 h-10" />
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-light tracking-tight text-white">Connect Gemini API</h1>
            <p className="text-white/40 text-sm leading-relaxed font-light">
              To use Archivision's high-fidelity rendering, you must connect a paid Gemini API key from your Google Cloud project.
            </p>
          </div>
          <div className="pt-4 space-y-4">
            <button
              onClick={handleOpenKeySelector}
              className="w-full py-4 bg-white text-black rounded-full font-bold uppercase tracking-[0.2em] text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)]"
            >
              Select API Key
            </button>
            <a
              href="https://ai.google.dev/gemini-api/docs/billing"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-[10px] text-white/20 hover:text-white/40 uppercase tracking-widest transition-colors"
            >
              Learn about billing & keys
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (hasApiKey === null) {
    return (
      <div className="h-[100dvh] bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-[#050505] bg-tech-grid text-white selection:bg-white/10 overflow-y-auto overflow-x-hidden relative flex flex-col">

      {/* Centered Content Container */}
      <div
        className={`
          min-h-full flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-6 relative z-10 
          transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1)
          ${isFocused
            ? 'opacity-0 scale-95 blur-sm pointer-events-none h-[100dvh] overflow-hidden'
            : 'opacity-100 scale-100 blur-0'
          }
        `}
      >
        {/* Main Vertical Centering Wrapper */}
        <div className="flex-1 flex flex-col justify-center items-center w-full py-12 md:py-20">

          {/* 1. Hero Section */}
          <div className="w-full mb-8 md:mb-16">
            <Hero />
          </div>

          {/* 2. Input Section */}
          <div className="w-full flex justify-center mb-8">
            <InputArea onGenerate={handleGenerate} isGenerating={isGenerating} disabled={isFocused} />
          </div>

        </div>

        {/* 3. History Section & Footer - Stays at bottom */}
        <div className="flex-shrink-0 pb-6 w-full mt-auto flex flex-col items-center gap-6">
          <div className="w-full px-2 md:px-0">
            <CreationHistory
              history={history}
              onSelect={handleSelectCreation}
              onDelete={handleDeleteCreation}
            />
          </div>

          <a
            href="https://x.com/ammaar"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/20 hover:text-white/40 text-[10px] font-mono uppercase tracking-widest transition-colors pb-2"
          >
            Created By: Joe Caravaglia
          </a>
        </div>
      </div>

      {/* Live Preview - Always mounted for smooth transition */}
      <LivePreview
        creation={activeCreation}
        isLoading={isGenerating}
        isFocused={isFocused}
        onReset={handleReset}
        onRefine={handleRefine}
      />

      {/* Subtle Import Button (Bottom Left) */}
      <div className="fixed bottom-6 left-6 z-50 group">
        <button
          onClick={handleImportClick}
          className={`flex items-center space-x-3 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/40 hover:text-white transition-all shadow-sm hover:shadow-md ${isFocused ? 'opacity-0 pointer-events-none -translate-x-1 group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-x-0' : 'opacity-100 pointer-events-auto'}`}
          title="Import Artifact"
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] hidden sm:inline pl-2">Import Archive</span>
          <ArrowUpTrayIcon className="w-4 h-4" />
        </button>
        <input
          type="file"
          ref={importInputRef}
          onChange={handleImportFile}
          accept=".json"
          className="hidden"
        />
      </div>
    </div>
  );
};

export default App;