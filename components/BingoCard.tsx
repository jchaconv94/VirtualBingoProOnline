import React from 'react';
import { BingoCard as BingoCardType } from '../types.ts';
import { Download, Trash2 } from 'lucide-react';

interface Props {
  card: BingoCardType;
  drawnBalls: number[];
  onDelete: (id: string) => void;
  onDownload: (id: string) => void;
  isCompact?: boolean;
}

const BingoCard: React.FC<Props> = ({ card, drawnBalls, onDelete, onDownload, isCompact = false }) => {
  const matches = card.numbers.filter(n => drawnBalls.includes(n));
  const isWinner = matches.length === 10;

  return (
    <div className={`relative overflow-hidden rounded-xl border transition-all duration-300 ${isWinner ? 'bg-amber-900/20 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-slate-800/50 border-white/5 hover:border-white/10'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-3 py-2 border-b ${isWinner ? 'border-amber-500/30 bg-amber-500/10' : 'border-white/5 bg-white/5'}`}>
        <div className="flex items-center gap-2">
          <span className={`font-mono font-bold ${isWinner ? 'text-amber-400' : 'text-slate-400'}`}>
            {card.id}
          </span>
          {isWinner && <span className="text-xs bg-amber-500 text-amber-950 font-bold px-1.5 py-0.5 rounded">BINGO!</span>}
        </div>
        <div className="flex gap-1">
          <button 
            onClick={() => onDownload(card.id)} 
            className="p-1 text-slate-400 hover:text-cyan-400 hover:bg-cyan-950/50 rounded transition-colors" 
            title="Descargar PNG"
          >
            <Download size={14} />
          </button>
          <button 
            onClick={() => onDelete(card.id)} 
            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 rounded transition-colors"
            title="Eliminar"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Numbers Grid */}
      <div className={`grid grid-cols-5 gap-1.5 p-2.5 ${isCompact ? 'text-xs' : 'text-sm'}`}>
        {card.numbers.map((number) => {
          const isMarked = drawnBalls.includes(number);
          return (
            <div
              key={number}
              className={`
                aspect-square flex items-center justify-center rounded font-bold transition-all duration-500
                ${isMarked 
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white scale-105 shadow-lg shadow-emerald-900/50' 
                  : 'bg-slate-900/80 text-slate-300'
                }
              `}
            >
              {number}
            </div>
          );
        })}
      </div>
      
      <div className="px-3 py-1 text-[10px] text-slate-500 text-right bg-slate-950/30">
        {matches.length}/10 aciertos
      </div>
    </div>
  );
};

export default BingoCard;