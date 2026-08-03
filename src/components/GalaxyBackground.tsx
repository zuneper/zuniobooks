import React from 'react';
import { useAudio } from '../context/AudioContext';

export const GalaxyBackground: React.FC = () => {
  const { isPlaying } = useAudio();

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#121212]">
      {/* Subtle, atmospheric gradient orbs that react to playback state */}
      <div 
        className={`absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-br from-[#1db954]/5 to-transparent blur-[120px] mix-blend-screen transition-all duration-1000 ease-in-out ${
          isPlaying ? 'opacity-100 scale-110' : 'opacity-40 scale-100'
        }`} 
      />
      
      <div 
        className={`absolute top-[40%] -right-[20%] w-[80vw] h-[80vw] rounded-full bg-gradient-to-tl from-[#535353]/10 to-transparent blur-[150px] mix-blend-screen transition-all duration-1000 ease-in-out delay-150 ${
          isPlaying ? 'opacity-80 scale-105' : 'opacity-30 scale-100'
        }`} 
      />
    </div>
  );
};
