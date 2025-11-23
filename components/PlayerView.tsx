import React, { useState, useEffect, ReactNode } from 'react';
import { LogOut, Ticket, Download, FileText, Sparkles, ArrowRight, DoorOpen, ShoppingCart } from 'lucide-react';
import { BingoCard, CartonData } from '../types.ts';
import { SheetAPI } from '../services/googleSheetService.ts';
import { downloadCardImage, generateBingoCardsPDF } from '../services/exportService.ts';

interface PlayerViewProps {
    currentUser: {
        idUser: string;
        nombreCompleto: string;
        email: string;
        usuario: string;
    };
    sheetUrl: string;
    onLogout: () => void;
    bingoTitle: string;
    bingoSubtitle: string;
    onExitRoom?: () => void;
    onRequestPurchase?: () => void;
    purchasePriceLabel?: string;
    customNotice?: ReactNode;
    refreshSignal?: number;
}

const PlayerView: React.FC<PlayerViewProps> = ({
    currentUser,
    sheetUrl,
    onLogout,
    bingoTitle,
    bingoSubtitle,
    onExitRoom,
    onRequestPurchase,
    purchasePriceLabel,
    customNotice,
    refreshSignal = 0
}) => {
    const [userCards, setUserCards] = useState<CartonData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load user's cards
    useEffect(() => {
        loadUserCards();
    }, [currentUser.idUser, sheetUrl, refreshSignal]);

    const loadUserCards = async () => {
        setIsLoading(true);
        try {
            const result = await SheetAPI.getUserCards(sheetUrl, currentUser.idUser);
            if (result.success && result.cards) {
                setUserCards(result.cards);
            }
        } catch (error) {
            console.error('Error loading cards:', error);
        } finally {
            setIsLoading(false);
        }
    };


    const convertToDisplayCard = (carton: CartonData): BingoCard => {
        // Convert 24 numbers to 25 (with center free space at index 12)
        const displayNumbers = [...carton.numbers];
        displayNumbers.splice(12, 0, 0); // Insert free space at center

        return {
            id: carton.idCarton,
            numbers: displayNumbers
        };
    };

    const handleDownloadCard = async (carton: CartonData) => {
        const displayCard = convertToDisplayCard(carton);
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
        const displayCard = convertToDisplayCard(carton);
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Header */}
            <div className="bg-slate-900/50 border-b border-slate-800 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                                {bingoTitle}
                            </h1>
                            <p className="text-slate-400 text-sm mt-1">
                                Bienvenido, {currentUser.nombreCompleto}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 justify-end">
                            {onRequestPurchase && (
                                <button
                                    onClick={onRequestPurchase}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 border border-emerald-500/40 text-emerald-200 rounded-lg text-sm font-semibold hover:bg-emerald-600/30"
                                >
                                    <ShoppingCart size={18} />
                                    {purchasePriceLabel ? `Comprar (${purchasePriceLabel})` : 'Comprar cartones'}
                                </button>
                            )}

                            {onExitRoom && (
                                <button
                                    onClick={onExitRoom}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-sm hover:bg-slate-700"
                                >
                                    <DoorOpen size={18} />
                                    Salir de sala
                                </button>
                            )}

                            <button
                                onClick={onLogout}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                            >
                                <LogOut size={18} />
                                Cerrar sesión
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Purchase Notice */}
                <div className="mb-8">
                    {customNotice ?? (
                        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-slate-900/60 to-slate-950 p-6 text-emerald-50">
                            <div className="flex items-center gap-2 text-emerald-200 text-xs font-semibold tracking-[0.3em] uppercase">
                                <Sparkles size={16} /> Compras dentro de la sala
                            </div>
                            <p className="mt-3 text-sm text-emerald-50/80">
                                Para comprar cartones debes ingresar a una sala activa. El administrador de la sala define el precio y habilita la compra segura.
                            </p>
                            <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-emerald-200">
                                Revisa el lobby y únete cuando estés listo
                                <ArrowRight size={16} />
                            </p>
                        </div>
                    )}
                </div>

                {/* Cards Grid */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Ticket className="text-cyan-400" size={24} />
                            Mis Cartones ({userCards.length})
                        </h2>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                        </div>
                    ) : userCards.length === 0 ? (
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
                            <Ticket className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-400 text-lg mb-2">No tienes cartones aún</p>
                            <p className="text-slate-500 text-sm">Compra tus primeros cartones para empezar a jugar</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {userCards.map((carton) => {
                                const displayCard = convertToDisplayCard(carton);

                                return (
                                    <div
                                        key={carton.idCarton}
                                        className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-cyan-500/50 transition-all"
                                    >
                                        {/* Card Header */}
                                        <div className="mb-4">
                                            <p className="text-slate-400 text-sm">Cartón #{carton.idCarton.slice(-8)}</p>
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
                              aspect-square flex items-center justify-center rounded
                              ${num === 0
                                                                ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold text-xs'
                                                                : 'bg-slate-800 text-white text-sm'
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
                                                className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
                                            >
                                                <Download size={16} />
                                                PNG
                                            </button>
                                            <button
                                                onClick={() => handleDownloadPDF(carton)}
                                                className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
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
            </div>

        </div>
    );
};

export default PlayerView;
