import React from 'react';
import { Trophy, Sparkles, Check } from 'lucide-react';
import { Winner } from '../types.ts';

interface Props {
  winner: Winner;
  onClose: () => void;
  remaining: number;
}

const WinnerModal: React.FC<Props> = ({ winner, onClose, remaining }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      {/* Glow Effect Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/20 rounded-full blur-[100px] animate-pulse"></div>
      </div>

      <div className="relative w-full max-w-md transform transition-all animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
        {/* Card Border Gradient */}
        <div className="absolute -inset-1 bg-gradient-to-b from-amber-300 via-amber-500 to-orange-600 rounded-2xl blur opacity-75"></div>
        
        <div className="relative bg-slate-950 border border-amber-500/50 rounded-xl shadow-2xl overflow-hidden">
          
          {/* Header / Icon */}
          <div className="bg-gradient-to-b from-amber-900/50 to-slate-950 p-8 pb-6 text-center relative">
             <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20">
                <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>
             </div>
             
             <div className="inline-flex items-center justify-center p-4 rounded-full bg-gradient-to-b from-amber-300 to-amber-600 shadow-lg shadow-amber-500/50 mb-4 animate-bounce">
                <Trophy size={48} className="text-slate-900 fill-amber-100" />
             </div>
             
             <h2 className="text-4xl font-black text-white tracking-tight drop-shadow-[0_2px_10px_rgba(245,158,11,0.5)] uppercase">
               ¡BINGO!
             </h2>
             <p className="text-amber-300 font-medium text-sm tracking-widest uppercase mt-1 flex items-center justify-center gap-2">
               <Sparkles size={14} /> Tenemos un ganador <Sparkles size={14} />
             </p>
          </div>

          {/* Content */}
          <div className="p-8 pt-0 text-center space-y-6">
            
            {/* Winning Ball Display */}
            <div className="flex flex-col items-center justify-center -mt-4 mb-2 relative z-10">
              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">Bolilla Ganadora</div>
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 shadow-[0_0_20px_rgba(245,158,11,0.6)] flex items-center justify-center text-4xl font-black text-white border-4 border-slate-900 ring-2 ring-amber-500 animate-in zoom-in duration-700">
                {winner.winningNumber || '?'}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Participante</p>
              <h3 className="text-2xl font-bold text-white leading-tight">
                {winner.participantName}
              </h3>
            </div>

            <div className="bg-slate-900/80 rounded-lg p-3 border border-slate-800 flex items-center justify-between max-w-[200px] mx-auto">
              <span className="text-slate-400 text-sm">Cartón Ganador</span>
              <span className="text-xl font-mono font-bold text-emerald-400">{winner.cardId}</span>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-emerald-900/40 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Check size={24} strokeWidth={3} />
              {remaining > 0 ? `Siguiente Ganador (${remaining})` : '¡Felicidades!'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WinnerModal;