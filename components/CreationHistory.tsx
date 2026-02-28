/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { ClockIcon, ArrowRightIcon, DocumentIcon, PhotoIcon, TrashIcon } from '@heroicons/react/24/outline';

export interface Creation {
  id: string;
  name: string;
  renderedImage: string; // The AI generated rendering (Base64 data URL)
  originalImage?: string; // The primary CAD drawing (Base64 data URL)
  moodBoardImages?: string[]; // The inspiration images
  timestamp: Date;
}

interface CreationHistoryProps {
  history: Creation[];
  onSelect: (creation: Creation) => void;
  onDelete: (id: string) => void;
}

export const CreationHistory: React.FC<CreationHistoryProps> = ({ history, onSelect, onDelete }) => {
  if (history.length === 0) return null;

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex items-center space-x-3 mb-4 px-2">
        <ClockIcon className="w-3 h-3 text-white/10" />
        <h2 className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30">Archive</h2>
        <div className="h-px flex-1 bg-white/5"></div>
      </div>
      
      {/* Horizontal Scroll Container for Compact Layout */}
      <div className="flex overflow-x-auto space-x-4 pb-4 px-2 scrollbar-hide">
        {history.map((item) => {
          const isPdf = item.originalImage?.startsWith('data:application/pdf');
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className="group flex-shrink-0 relative flex flex-col text-left w-44 h-28 bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-white/10 rounded-2xl transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md"
            >
              <div className="p-4 flex flex-col h-full">
                <div className="flex items-start justify-between mb-2">
                  <div className="p-1.5 bg-white/5 rounded-full group-hover:bg-white/10 transition-colors border border-white/5">
                      {isPdf ? (
                          <DocumentIcon className="w-3 h-3 text-white/30" />
                      ) : item.originalImage ? (
                          <PhotoIcon className="w-3 h-3 text-white/30" />
                      ) : (
                          <DocumentIcon className="w-3 h-3 text-white/30" />
                      )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[9px] font-mono text-white/10 group-hover:text-white/30">
                      {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this artifact?')) {
                          onDelete(item.id);
                        }
                      }}
                      className="p-1 text-white/10 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete Artifact"
                    >
                      <TrashIcon className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-auto">
                  <h3 className="text-xs font-light text-white/80 group-hover:text-white truncate">
                    {item.name}
                  </h3>
                  <div className="flex items-center space-x-1 mt-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
                    <span className="text-[9px] uppercase tracking-widest text-white/40">Restore</span>
                    <ArrowRightIcon className="w-2.5 h-2.5 text-white/40" />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};