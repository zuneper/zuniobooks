import React from 'react';
import { motion } from 'framer-motion';
import { Library } from 'lucide-react';

interface WelcomeViewProps {
  onOpenAuth: () => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({ onOpenAuth }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10 min-h-[calc(100vh-100px)]">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-2xl flex flex-col items-center"
      >
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="w-20 h-20 rounded-full bg-[#facc15] flex items-center justify-center mb-8 shadow-[0_10px_40px_rgba(250,204,21,0.3)]"
        >
          <Library className="w-10 h-10 text-black" />
        </motion.div>
        
        <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-6 tracking-tight">
          Listen to the <br />
          <span className="text-[#facc15] drop-shadow-[0_0_20px_rgba(250,204,21,0.4)]">unheard.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-[#b3b3b3] mb-12 max-w-xl leading-relaxed">
          Your premium, ad-free audiobook sanctuary. Dive into exclusive stories with high-fidelity audio, seamless offline tracking, and cross-device syncing.
        </p>
        
        <button
          onClick={onOpenAuth}
          className="px-10 py-4 rounded-full text-base font-bold text-black bg-[#facc15] hover:scale-105 active:scale-95 transition-all shadow-[0_8px_20px_rgba(250,204,21,0.3)]"
        >
          Start Listening Now
        </button>
      </motion.div>
    </div>
  );
};
