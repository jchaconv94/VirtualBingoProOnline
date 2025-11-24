import React, { useState } from 'react';
import { X, Home, Lock, DollarSign } from 'lucide-react';

interface Props {
    currentRoomName: string;
    currentPrice: number;
    currentPassword?: string;
    onClose: () => void;
    onSave: (data: { name: string; pricePerCard: number; password?: string }) => void;
    isLoading?: boolean;
}

const EditRoomModal: React.FC<Props> = ({ currentRoomName, currentPrice, currentPassword, onClose, onSave, isLoading = false }) => {
    const [roomName, setRoomName] = useState(currentRoomName);
    const [pricePerCard, setPricePerCard] = useState(currentPrice.toString());
    const [password, setPassword] = useState(currentPassword || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isLoading) return; // Prevent double submission
        
        if (!roomName.trim()) {
            alert('El nombre de la sala es requerido');
            return;
        }

        const price = parseFloat(pricePerCard);
        if (isNaN(price) || price < 0) {
            alert('El precio debe ser un número válido mayor o igual a 0');
            return;
        }

        onSave({
            name: roomName.trim(),
            pricePerCard: price,
            password: password.trim() // Send empty string to remove password, not undefined
        });
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 border-b border-slate-800 flex justify-between items-center">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
                    
                    <div>
                        <h2 className="text-xl font-bold text-white">Editar Sala</h2>
                        <p className="text-xs text-slate-400 mt-1">Actualiza la información de la sala</p>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Nombre de la Sala */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                            <Home size={16} className="text-cyan-400" />
                            Nombre de la Sala
                        </label>
                        <input
                            type="text"
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                            placeholder="Ej: Bingo Navideño 2024"
                            required
                        />
                    </div>

                    {/* Precio por Cartón */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                            <DollarSign size={16} className="text-emerald-400" />
                            Precio por Cartón (S/)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={pricePerCard}
                            onChange={(e) => setPricePerCard(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                            placeholder="0.00"
                            required
                        />
                        <p className="text-xs text-slate-500 mt-1">Define el precio en soles (PEN)</p>
                    </div>

                    {/* Contraseña */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                            <Lock size={16} className="text-amber-400" />
                            Contraseña (Opcional)
                        </label>
                        <input
                            type="text"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                            placeholder="Dejar vacío para sala pública"
                        />
                        <p className="text-xs text-slate-500 mt-1">Solo usuarios con la contraseña podrán ingresar</p>
                    </div>

                    {/* Botones */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold hover:from-cyan-500 hover:to-blue-500 transition-all shadow-lg shadow-cyan-900/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Guardando...
                                </>
                            ) : (
                                'Guardar Cambios'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditRoomModal;
