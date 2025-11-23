import React, { useState } from 'react';
import { Ticket, ShoppingCart, Download, FileText, Search, Filter } from 'lucide-react';
import { CartonData } from '../types.ts';
import { SheetAPI } from '../services/googleSheetService.ts';
import { downloadCardImage, generateBingoCardsPDF } from '../services/exportService.ts';
import BuyCardsModal from './BuyCardsModal.tsx';

interface MyCardsSectionProps {
    userCards: CartonData[];
    currentUser: {
        idUser: string;
        nombreCompleto: string;
        email: string;
        usuario: string;
    };
    sheetUrl: string;
    bingoTitle: string;
    bingoSubtitle: string;
    onCardsUpdated: () => void;
}

const MyCardsSection: React.FC<MyCardsSectionProps> = ({
    userCards,
    currentUser,
    sheetUrl,
    bingoTitle,
    bingoSubtitle,
    onCardsUpdated
}) => {
    const [showBuyModal, setShowBuyModal] = useState(false);
    const [isBuying, setIsBuying] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const handleBuyCards = async (quantity: number) => {
        setIsBuying(true);
        try {
            for (let i = 0; i < quantity; i++) {
                const numbers = generateBingoNumbers();
                await SheetAPI.createCard(sheetUrl, currentUser.idUser, numbers);
            }

            await onCardsUpdated();
            setShowBuyModal(false);

            return { success: true, message: `${quantity} cartón(es) comprado(s) exitosamente` };
        } catch (error) {
            console.error('Error buying cards:', error);
            return { success: false, message: 'Error al comprar cartones' };
        } finally {
            setIsBuying(false);
        }
    };

    const generateBingoNumbers = (): number[] => {
        const numbers: number[] = [];
        const ranges = [
            [1, 15],   // B column
            [16, 30],  // I column
            [31, 45],  // N column (skip center)
            [46, 60],  // G column
            [61, 75]   // O column
        ];

        ranges.forEach((range, colIndex) => {
            const available = Array.from(
                { length: range[1] - range[0] + 1 },
                (_, i) => range[0] + i
            );

            for (let i = 0; i < 5; i++) {
                if (colIndex === 2 && i === 2) continue; // Skip center

                const randomIndex = Math.floor(Math.random() * available.length);
                numbers.push(available[randomIndex]);
                available.splice(randomIndex, 1);
            }
        });

        return numbers;
    };

    const convertToDisplayCard = (carton: CartonData) => {
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

    const filteredCards = userCards.filter(card =>
        card.idCarton.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Ticket className="text-cyan-400" />
                    Mis Cartones ({userCards.length})
                </h2>
                <button
                    onClick={() => setShowBuyModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg transition-all transform hover:scale-105"
                >
                    <ShoppingCart size={20} />
                    Comprar Cartones
                </button>
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
                        {searchTerm ? 'Intenta con otro término de búsqueda' : 'Compra tus primeros cartones para empezar a jugar'}
                    </p>
                    {!searchTerm && (
                        <button
                            onClick={() => setShowBuyModal(true)}
                            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold rounded-xl inline-flex items-center gap-2"
                        >
                            <ShoppingCart size={20} />
                            Comprar Cartones
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
                                <div className="mb-4">
                                    <p className="text-slate-400 text-sm">Cartón</p>
                                    <p className="text-white font-mono font-bold">#{carton.idCarton.slice(-8)}</p>
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

            {/* Buy Cards Modal */}
            {showBuyModal && (
                <BuyCardsModal
                    onClose={() => setShowBuyModal(false)}
                    onBuy={handleBuyCards}
                    isLoading={isBuying}
                />
            )}
        </div>
    );
};

export default MyCardsSection;
