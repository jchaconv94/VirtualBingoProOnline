import React, { useEffect, useMemo, useState } from 'react';
import { Users, Plus, Search, Filter, Sparkles, ShieldCheck, Copy, Crown, Globe, RefreshCw, User as UserIcon, Coins, ChevronLeft, ChevronRight, PiggyBank } from 'lucide-react';
import { toTitleCase } from '../utils/helpers.ts';

interface RoomsSectionProps {
  rooms: any[];
  isLoading: boolean;
  onCreateRoom: () => void;
  onJoinRoom: (room: any) => void;
  onRefresh: () => void;
}

const ITEMS_PER_PAGE = 6;

const currencyFormatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2
});

const formatCurrency = (value?: number) => {
  if (typeof value !== 'number' || !isFinite(value)) return null;
  return currencyFormatter.format(value);
};

const RoomsSection: React.FC<RoomsSectionProps> = ({ rooms, isLoading, onCreateRoom, onJoinRoom, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewFilter, setViewFilter] = useState<'all' | 'public' | 'private'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const privateCount = rooms.filter(room => room.isPrivate).length;
  const publicCount = rooms.length - privateCount;

  const filteredRooms = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    return rooms.filter(room => {
      const matchesSearch = !normalized ||
        room.name.toLowerCase().includes(normalized) ||
        (room.id && room.id.toLowerCase().includes(normalized));
      const matchesFilter = viewFilter === 'all'
        ? true
        : viewFilter === 'private'
          ? room.isPrivate
          : !room.isPrivate;
      return matchesSearch && matchesFilter;
    });
  }, [rooms, searchTerm, viewFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRooms.length / ITEMS_PER_PAGE));

  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, viewFilter, rooms]);

  useEffect(() => {
    if (currentPage > totalPages - 1) {
      setCurrentPage(Math.max(totalPages - 1, 0));
    }
  }, [currentPage, totalPages]);

  const paginatedRooms = useMemo(() => {
    const start = currentPage * ITEMS_PER_PAGE;
    return filteredRooms.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRooms, currentPage]);

  const handleCopyId = async (roomId: string) => {
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard) {
        console.warn('Clipboard API no disponible');
        return;
      }
      await navigator.clipboard.writeText(roomId);
      setCopiedId(roomId);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (error) {
      console.error('Clipboard error', error);
    }
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 0));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages - 1));
  };

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-950 shadow-2xl">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.3),transparent_55%)]"></div>
        <div className="relative z-10 grid gap-8 p-8 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-emerald-200 text-xs font-semibold tracking-[0.3em] uppercase">
              <Sparkles size={16} /> Lobby Exclusivo
            </div>
            <h2 className="mt-4 text-3xl lg:text-4xl font-black text-white leading-tight">
              Encuentra la sala perfecta y vive una experiencia de bingo premium.
            </h2>
            <p className="mt-4 text-emerald-50/80 text-sm lg:text-base max-w-xl">
              Explora salas públicas y privadas, comparte el ID en un clic y mantente sincronizado con las partidas que están por comenzar.
            </p>
            <div className="mt-8 flex flex-wrap gap-6">
              <div>
                <p className="text-slate-400 text-xs">Salas activas</p>
                <p className="text-3xl font-bold text-white">{rooms.length}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Privadas</p>
                <p className="text-3xl font-bold text-amber-300">{privateCount}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Públicas</p>
                <p className="text-3xl font-bold text-cyan-300">{publicCount}</p>
              </div>
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              <button
                onClick={onCreateRoom}
                className="px-6 py-3 rounded-2xl bg-white text-emerald-700 font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/40"
              >
                <Plus size={18} /> Crear Sala
              </button>
              <button
                onClick={onRefresh}
                className="px-6 py-3 rounded-2xl border border-emerald-400/40 text-emerald-100 font-semibold flex items-center gap-2 hover:bg-emerald-500/10 transition-colors"
              >
                <RefreshCw size={18} /> Actualizar lista
              </button>
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-2xl border border-slate-800/80 p-6 flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <Crown className="text-amber-400" />
              <div>
                <p className="text-slate-300 text-sm">Recomendación destacada</p>
                <p className="text-white font-semibold">Salas con contraseña garantizan sorteos exclusivos.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-emerald-400" />
              <div>
                <p className="text-slate-300 text-sm">Acceso seguro</p>
                <p className="text-white font-semibold">Comparte el ID con un clic para invitar amigos.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Globe className="text-cyan-400" />
              <div>
                <p className="text-slate-300 text-sm">Tiempo real</p>
                <p className="text-white font-semibold">La lista se sincroniza con Google Sheets al instante.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              className="w-full bg-slate-900/70 border border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500"
              placeholder="Buscar por nombre o ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setSearchTerm('')}
            className="px-4 py-2 text-xs font-semibold text-slate-300 rounded-xl border border-slate-700 hover:bg-slate-800"
          >
            Limpiar
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="text-slate-500" size={16} />
          {[
            { id: 'all', label: 'Todas' },
            { id: 'public', label: 'Públicas' },
            { id: 'private', label: 'Privadas' }
          ].map(option => (
            <button
              key={option.id}
              onClick={() => setViewFilter(option.id as 'all' | 'public' | 'private')}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${viewFilter === option.id
                ? 'bg-emerald-500 text-white shadow-lg'
                : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Cargando salas...</p>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center">
          <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-300 text-lg mb-2">No encontramos salas con ese criterio.</p>
          <p className="text-slate-500 text-sm mb-6">Cambia el filtro o crea una nueva experiencia.</p>
          <button
            onClick={onCreateRoom}
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold rounded-2xl inline-flex items-center gap-2"
          >
            <Plus size={20} />
            Crear Sala
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="relative">
            {totalPages > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevPage}
                  disabled={currentPage === 0}
                  className="hidden md:flex absolute -left-16 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-slate-700 bg-slate-900/80 text-white items-center justify-center shadow-lg disabled:opacity-30"
                  aria-label="Ver salas anteriores"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages - 1}
                  className="hidden md:flex absolute -right-16 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-slate-700 bg-slate-900/80 text-white items-center justify-center shadow-lg disabled:opacity-30"
                  aria-label="Ver más salas"
                >
                  <ChevronRight size={22} />
                </button>
              </>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {paginatedRooms.map((room) => {
                const formattedPrice = formatCurrency(room.pricePerCard);
                const formattedPot = formatCurrency(room.totalPot);
                const cardsSold = typeof room.cardsSold === 'number'
                  ? room.cardsSold
                  : typeof room.participantsCount === 'number'
                    ? room.participantsCount
                    : undefined;

            return (
              <div key={room.id} className="group relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 p-6 transition-all hover:border-emerald-400/60 hover:shadow-emerald-500/30 hover:shadow-xl">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent"></div>
                <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{room.isPrivate ? 'Sala Privada' : 'Sala Pública'}</p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">{room.name.toUpperCase()}</h3>
                  </div>
                  {room.isPrivate ? (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-200 border border-amber-400/30">
                      Seguridad
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-100 border border-cyan-400/30">
                      Acceso libre
                    </span>
                  )}
                </div>

                <div className="mt-6 space-y-3 text-sm text-slate-300">
                  <div className="flex items-center gap-2">
                    <UserIcon size={16} className="text-slate-500" />
                    <span>Creado por {room.adminName ? toTitleCase(room.adminName) : 'Admin'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className={room.isPrivate ? 'text-amber-300' : 'text-emerald-300'} />
                    <span>{room.isPrivate ? 'Requiere contraseña para ingresar' : 'Disponible sin restricciones'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Coins size={16} className="text-emerald-300" />
                    <span>{formattedPrice ? `${formattedPrice} por cartón` : 'Precio pendiente'}</span>
                  </div>
                  {formattedPot && (
                    <div className="flex items-center gap-2">
                      <PiggyBank size={16} className="text-amber-300" />
                      <span>Pozo acumulado: {formattedPot}</span>
                      {typeof cardsSold === 'number' && (
                        <span className="text-xs text-slate-500">({cardsSold} cartones)</span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-emerald-300" />
                    <span>ID: {room.id}</span>
                    <button
                      onClick={() => handleCopyId(room.id)}
                      className="ml-auto px-3 py-1 text-xs rounded-full border border-slate-700 text-slate-300 hover:text-white hover:border-emerald-500/50 flex items-center gap-1"
                    >
                      <Copy size={12} /> {copiedId === room.id ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-3">
                  <button
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-lime-400 text-slate-900 font-bold shadow-lg shadow-emerald-800/40 transition-transform hover:-translate-y-0.5"
                    onClick={() => onJoinRoom(room)}
                  >
                    Unirse a la sala
                  </button>
                  <button
                    className="w-full py-3 rounded-2xl border border-slate-700 text-slate-300 text-sm hover:border-emerald-500/50"
                    onClick={() => handleCopyId(room.id)}
                  >
                    Compartir invitación
                  </button>
                </div>
              </div>
              </div>
            );
              })}
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col items-center gap-3 text-sm text-slate-400">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handlePrevPage}
                  disabled={currentPage === 0}
                  className="flex md:hidden px-4 py-2 rounded-full border border-slate-700 text-white disabled:opacity-30"
                >
                  <ChevronLeft size={18} />
                </button>
                <p>{`Página ${currentPage + 1} de ${totalPages}`}</p>
                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages - 1}
                  className="flex md:hidden px-4 py-2 rounded-full border border-slate-700 text-white disabled:opacity-30"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
              <div className="flex gap-2">
                {Array.from({ length: totalPages }).map((_, index) => (
                  <span
                    key={index}
                    className={`h-2.5 w-8 rounded-full transition-colors ${index === currentPage ? 'bg-emerald-400' : 'bg-slate-700'}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RoomsSection;
