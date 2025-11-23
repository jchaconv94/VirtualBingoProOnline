import React, { useState } from 'react';
import { X, Ticket, ShoppingCart, Plus, Minus, CreditCard } from 'lucide-react';

interface Props {
    onClose: () => void;
    onBuy: (quantity: number) => void;
    isLoading?: boolean;
    pricePerCard?: number; // Opcional, por si implementamos precios luego
}

const currencyFormatter = new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2
});

const BuyCardsModal: React.FC<Props> = ({ onClose, onBuy, isLoading = false, pricePerCard = 5 }) => {
    const [quantity, setQuantity] = useState(1);

    const handleIncrement = () => {
        if (quantity < 50) setQuantity(prev => prev + 1);
    };

    const handleDecrement = () => {
        if (quantity > 1) setQuantity(prev => prev - 1);
    };

    const handleQuickSelect = (num: number) => {
        setQuantity(num);
    };

    const unitPrice = pricePerCard > 0 ? pricePerCard : 0;
    const total = quantity * unitPrice;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 border-b border-slate-800 flex justify-between items-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500"></div>

                    <div className="flex items-center gap-3 z-10">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                            <Ticket className="text-emerald-400" size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Comprar Cartones</h2>
                            <p className="text-xs text-slate-400">Selecciona la cantidad deseada</p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors z-10"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-8">

                    {/* Quantity Selector */}
                    <div className="flex flex-col items-center gap-4">
                        <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">Cantidad</span>

                        <div className="flex items-center gap-6">
                            <button
                                onClick={handleDecrement}
                                className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:bg-slate-700 hover:border-slate-600 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                                disabled={quantity <= 1}
                            >
                                <Minus size={20} />
                            </button>

                            <div className="w-24 h-20 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
                                <div className="absolute inset-0 bg-emerald-500/5"></div>
                                <span className="text-4xl font-black text-white z-10">{quantity}</span>
                            </div>

                            <button
                                onClick={handleIncrement}
                                className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:bg-slate-700 hover:border-slate-600 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                                disabled={quantity >= 50}
                            >
                                <Plus size={20} />
                            </button>
                        </div>

                        {/* Quick Select */}
                        <div className="flex gap-2 mt-2">
                            {[1, 3, 5, 10, 20].map(num => (
                                <button
                                    key={num}
                                    onClick={() => handleQuickSelect(num)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${quantity === num
                                            ? 'bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/20'
                                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600 hover:text-white'
                                        }`}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Summary Card */}
                    <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800 space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                <CreditCard size={18} className="text-blue-400" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-400 uppercase tracking-wide">Precio unitario</span>
                                <span className="text-sm font-bold text-white">{currencyFormatter.format(unitPrice)}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400 uppercase tracking-wide">Total a pagar</span>
                            <span className="text-2xl font-black text-emerald-400">{currencyFormatter.format(total)}</span>
                        </div>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={() => onBuy(quantity)}
                        disabled={isLoading}
                        className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Procesando...</span>
                            </>
                        ) : (
                            <>
                                <ShoppingCart size={20} className="group-hover:animate-bounce" />
                                <span>CONFIRMAR COMPRA</span>
                            </>
                        )}
                    </button>

                </div>
            </div>
        </div>
    );
};

export default BuyCardsModal;
