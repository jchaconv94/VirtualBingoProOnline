import React, { useState } from 'react';
import { X, Users, Lock, Type, DollarSign } from 'lucide-react';

interface CreateRoomModalProps {
    onClose: () => void;
    onCreate: (roomData: { name: string; password?: string; pricePerCard: number }) => Promise<void>;
}

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [price, setPrice] = useState('10');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice) || parsedPrice <= 0) {
            alert('Ingresa un precio válido para los cartones');
            return;
        }

        setIsLoading(true);
        try {
            await onCreate({
                name,
                password: isPrivate ? password : undefined,
                pricePerCard: parsedPrice
            });
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Users className="text-emerald-400" />
                        Crear Nueva Sala
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                            Nombre de la Sala
                        </label>
                        <div className="relative">
                            <Type className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                placeholder="Ej: Bingo Familiar"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="flex items-center gap-2 cursor-pointer mb-2">
                            <input
                                type="checkbox"
                                checked={isPrivate}
                                onChange={(e) => setIsPrivate(e.target.checked)}
                                className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500/50"
                            />
                            <span className="text-sm font-medium text-slate-300">Sala Privada</span>
                        </label>

                        {isPrivate && (
                            <div className="relative animate-in slide-in-from-top-2 duration-200">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                    placeholder="Contraseña de acceso"
                                    required={isPrivate}
                                />
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                            Precio por cartón (S/)
                        </label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="number"
                                min="1"
                                step="0.5"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                placeholder="Ej: 10"
                                required
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Este monto aparecerá para todos los jugadores de la sala.</p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white rounded-lg font-bold shadow-lg shadow-emerald-900/20 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>Creating...</>
                            ) : (
                                <>
                                    <Users size={18} />
                                    Crear Sala
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateRoomModal;
