/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { DocumentTextIcon, PuzzlePieceIcon, NewspaperIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import { Logo } from './Logo';

const StaticMarker = ({ 
  icon: Icon, 
  label,
  x, 
  y,
  rotation = 0
}: { 
  icon: React.ElementType, 
  label: string,
  x: string,
  y: string,
  rotation?: number
}) => {
  return (
    <div 
      className="absolute z-0 pointer-events-none opacity-5 hover:opacity-10 transition-opacity duration-700"
      style={{ top: y, left: x, transform: `rotate(${rotation}deg)` }}
    >
      <div className="relative flex flex-col items-center">
        <div className="w-12 h-20 md:w-16 md:h-28 rounded-xl border border-white/5 flex items-center justify-center bg-white/5 backdrop-blur-[1px]">
            <Icon className="w-6 h-6 md:w-8 md:h-8 text-white/40 stroke-[0.5]" />
        </div>
        <div className="mt-2 bg-white/5 text-white/20 text-[7px] md:text-[8px] font-mono tracking-widest uppercase px-1.5 py-0.5 rounded-full">
            {label}
        </div>
      </div>
    </div>
  );
};

export const Hero: React.FC = () => {
  return (
    <>
      {/* Background Static Elements - Fixed to Viewport */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Top Left */}
        <div className="hidden lg:block">
            <StaticMarker 
              icon={DocumentTextIcon} 
              label="FLOOR PLAN"
              x="12%" 
              y="15%"
              rotation={-5} 
            />
        </div>

        {/* Bottom Right */}
        <div className="hidden md:block">
            <StaticMarker 
              icon={PuzzlePieceIcon} 
              label="SKETCH"
              x="82%" 
              y="65%"
              rotation={8} 
            />
        </div>

        {/* Top Right */}
        <div className="hidden lg:block">
            <StaticMarker 
              icon={NewspaperIcon} 
              label="MOOD BOARD"
              x="78%" 
              y="18%"
              rotation={3} 
            />
        </div>

        {/* Bottom Left */}
        <div className="hidden md:block">
            <StaticMarker 
              icon={ClipboardDocumentCheckIcon} 
              label="CAD FILE"
              x="15%" 
              y="70%"
              rotation={-2} 
            />
        </div>
      </div>

      {/* Hero Text Content */}
      <div className="text-center relative z-10 max-w-6xl mx-auto px-4 pt-8 pb-8">
        <div className="flex flex-col items-center mb-12">
            <Logo className="w-16 h-16 mb-6" />
            <div className="flex items-center space-x-4">
                <div className="h-px w-8 bg-white/10"></div>
                <span className="text-[10px] font-mono uppercase tracking-[0.5em] text-white/40">Archivision AI</span>
                <div className="h-px w-8 bg-white/10"></div>
            </div>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-light tracking-tighter text-white mb-8 leading-[0.95]">
          Visualize your <br/>
          <span className="italic font-light text-white/40">rendered</span> vision.
        </h1>
        <div className="w-12 h-px bg-white/10 mx-auto mb-8"></div>
        <p className="text-sm sm:text-base text-white/40 max-w-xl mx-auto leading-relaxed font-light tracking-wide">
          Archivision AI transforms your 2D CAD drawings into realistic renderings, using your mood board to define materials, lighting, and style.
        </p>
      </div>
    </>
  );
};
