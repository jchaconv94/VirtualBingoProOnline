import React, { useEffect, useState, useCallback } from 'react';
import { SheetAPI } from '../services/googleSheetService.ts';
import RoomsSection from './RoomsSection.tsx';
import { Menu } from 'lucide-react';

interface LandingPageProps {
  sheetUrl: string;
  onLoginClick: () => void;
  onRegisterClick: () => void;
  onRequireAuth: () => void;
  onOpenSettings: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({
  sheetUrl,
  onLoginClick,
  onRegisterClick,
  onRequireAuth,
  onOpenSettings
}) => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadRooms = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await SheetAPI.getRooms(sheetUrl);
      if (result.success && result.rooms) {
        setRooms(result.rooms);
      }
    } catch (error) {
      console.error('Error loading rooms (landing):', error);
    } finally {
      setIsLoading(false);
    }
  }, [sheetUrl]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">Bienvenido a</p>
            <h1 className="text-2xl font-black tracking-tight">VIRTUAL BINGO PRO</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden w-10 h-10 rounded-full border border-slate-800 flex items-center justify-center text-slate-400"
              onClick={onLoginClick}
            >
              <Menu size={18} />
            </button>
            <button
              onClick={onLoginClick}
              className="px-4 py-2 rounded-full border border-slate-700 text-sm font-semibold text-slate-200 hover:text-white"
            >
              Iniciar sesión
            </button>
            <button
              onClick={onRegisterClick}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold shadow-lg shadow-emerald-900/30"
            >
              Registrarse
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <RoomsSection
          rooms={rooms}
          isLoading={isLoading}
          onCreateRoom={onRequireAuth}
          onJoinRoom={(_room) => onRequireAuth()}
          onRefresh={loadRooms}
        />
      </main>
    </div>
  );
};

export default LandingPage;
