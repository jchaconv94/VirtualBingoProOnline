import React, { useState } from 'react';
import { X, Lock, Coins } from 'lucide-react';

interface JoinRoomModalProps {
  room: any;
  onClose: () => void;
  onJoin: (roomId: string, password?: string) => Promise<void>;
}

const JoinRoomModal: React.FC<JoinRoomModalProps> = ({ room, onClose, onJoin }) => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onJoin(room.id, password || undefined);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-emerald-400">Unirse a Sala</span>
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <p className="text-slate-300">Sala: <span className="font-bold text-white">{room.name.toUpperCase()}</span></p>
            <p className="text-slate-500 text-sm">ID: {room.id}</p>
          </div>

          {typeof room.pricePerCard === 'number' && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-900/70 border border-slate-800">
              <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-300">
                <Coins size={18} />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Precio por cartón</p>
                <p className="text-white font-semibold">
                  {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 }).format(room.pricePerCard)}
                </p>
              </div>
            </div>
          )}

          {room.isPrivate && (
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  placeholder="Contraseña de la sala"
                  required
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isLoading} 
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg font-bold disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uniendo...
                </>
              ) : (
                'Unirse'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinRoomModal;
