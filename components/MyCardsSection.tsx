import React, { useState } from 'react';
import { Ticket, Download, FileText, Search, Filter, Sparkles, ArrowRight } from 'lucide-react';
import { CartonData } from '../types.ts';
import { downloadCardImage, generateBingoCardsPDF } from '../services/exportService.ts';
import { cartonDataToBingoCard } from '../utils/helpers.ts';

const convertToDisplayCard = (carton: CartonData) => cartonDataToBingoCard(carton);

interface MyCardsSectionProps {
    userCards: CartonData[];
    currentUser: {
        idUser: string;
        nombreCompleto: string;
        email: string;
        usuario: string;
    };
    bingoTitle: string;
    bingoSubtitle: string;
    onNavigateToRooms?: () => void;
}

const MyCardsSection: React.FC<MyCardsSectionProps> = ({
    userCards,
    currentUser,
    bingoTitle,
    bingoSubtitle,
    onNavigateToRooms
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    const handleDownloadCard = async (carton: CartonData) => {
        const displayCard = cartonDataToBingoCard(carton);
        const participant = {
            id: currentUser.idUser,
            name: currentUser.nombreCompleto.split(' ')[0],
            surname: currentUser.nombreCompleto.split(' ').slice(1).join(' '),
            dni: currentUser.idUser,
            email: currentUser.email,
            cards: [displayCard]
        };

        await downloadCardImage(participant, displayCard, bingoTitle, bingoSubtitle);
    };

    const handleDownloadPDF = async (carton: CartonData) => {
        const displayCard = cartonDataToBingoCard(carton);
        const participant = {
            id: currentUser.idUser,
            name: currentUser.nombreCompleto.split(' ')[0],
            surname: currentUser.nombreCompleto.split(' ').slice(1).join(' '),
            dni: currentUser.idUser,
            email: currentUser.email,
            cards: [displayCard]
        };

        await generateBingoCardsPDF(participant, bingoTitle, bingoSubtitle, carton.idCarton);
    };

    const normalizedSearch = searchTerm.toLowerCase();
    const filteredCards = userCards.filter(card => {
        if (!normalizedSearch) return true;
        const matchesId = card.idCarton.toLowerCase().includes(normalizedSearch);
        const matchesRoom = (card.roomId || '').toLowerCase().includes(normalizedSearch);
        return matchesId || matchesRoom;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Ticket className="text-cyan-400" />
                        Mis Cartones ({userCards.length})
                    </h2>
                </div>

                <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-slate-900/60 to-slate-950 p-5 text-sm text-emerald-50 flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-emerald-200 font-semibold tracking-[0.2em] uppercase text-xs">
                        <Sparkles size={16} /> Compras dentro de la sala
                    </div>
                    <p className="text-emerald-50/80">
                        Los cartones son específicos de cada sala. Cuando compres cartones dentro de una sala, solo aparecerán en esa sala específica.
                        Para ver tus cartones, ingresa a la sala donde los compraste.
                    </p>
                    {onNavigateToRooms && (
                        <button
                            type="button"
                            onClick={onNavigateToRooms}
                            className="self-start inline-flex items-center gap-2 text-sm font-semibold text-emerald-200 hover:text-white transition-colors"
                        >
                            Ver salas disponibles
                            <ArrowRight size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Search and Filters */}
            {userCards.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar por ID de cartón..."
                            className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 outline-none transition-all"
                        />
                    </div>
                    <button className="px-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:border-slate-700 transition-colors flex items-center gap-2">
                        <Filter size={20} />
                        Filtros
                    </button>
                </div>
            )}

            {/* Cards Grid */}
            {filteredCards.length === 0 ? (
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
                    <Ticket className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg mb-2">
                        {searchTerm ? 'No se encontraron cartones' : 'No tienes cartones aún'}
                    </p>
                    <p className="text-slate-500 text-sm mb-6">
                        {searchTerm ? 'Intenta con otro término de búsqueda' : 'Los cartones solo se muestran dentro de la sala donde fueron comprados. Ingresa a una sala para ver tus cartones.'}
                    </p>
                    {!searchTerm && onNavigateToRooms && (
                        <button
                            onClick={onNavigateToRooms}
                            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold rounded-xl inline-flex items-center gap-2"
                        >
                            Explorar salas
                            <ArrowRight size={20} />
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCards.map((carton) => {
                        const displayCard = convertToDisplayCard(carton);

                        return (
                            <div
                                key={carton.idCarton}
                                className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-cyan-500/50 transition-all group"
                            >
                                {/* Card Header */}
                                <div className="mb-4 flex items-center justify-between gap-2">
                                    <div>
                                        <p className="text-slate-400 text-sm">Cartón</p>
                                        <p className="text-white font-mono font-bold">#{carton.idCarton.slice(-8)}</p>
                                    </div>
                                    <span className="text-[11px] uppercase tracking-wide px-2 py-1 rounded-full border border-slate-800 text-slate-400">
                                        {carton.roomId ? `Sala ${carton.roomId}` : 'Sin sala'}
                                    </span>
                                </div>

                                {/* Bingo Grid */}
                                <div className="mb-4">
                                    <div className="grid grid-cols-5 gap-1 bg-slate-950 p-2 rounded-lg">
                                        {['B', 'I', 'N', 'G', 'O'].map((letter, i) => (
                                            <div key={i} className="text-center font-bold text-cyan-400 text-sm py-1">
                                                {letter}
                                            </div>
                                        ))}
                                        {displayCard.numbers.map((num, idx) => (
                                            <div
                                                key={idx}
                                                className={`
                          aspect-square flex items-center justify-center rounded text-sm font-medium
                          ${num === 0
                                                        ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold text-xs'
                                                        : 'bg-slate-800 text-white group-hover:bg-slate-700 transition-colors'
                                                    }
                        `}
                                            >
                                                {num === 0 ? 'FREE' : num}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Card Actions */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleDownloadCard(carton)}
                                        className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Download size={16} />
                                        PNG
                                    </button>
                                    <button
                                        onClick={() => handleDownloadPDF(carton)}
                                        className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <FileText size={16} />
                                        PDF
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

        </div>
    );
};

export default MyCardsSection;
