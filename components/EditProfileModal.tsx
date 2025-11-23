import React, { useState } from 'react';
import { X, User, Mail, Phone, Lock, Save } from 'lucide-react';

interface EditProfileModalProps {
    currentUser: {
        idUser: string;
        nombreCompleto: string;
        email: string;
        usuario: string;
        telefono?: string;
    };
    onClose: () => void;
    onSave: (data: {
        nombreCompleto: string;
        email: string;
        telefono: string;
    }) => Promise<{ success: boolean; message?: string }>;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
    currentUser,
    onClose,
    onSave
}) => {
    const [formData, setFormData] = useState({
        nombreCompleto: currentUser.nombreCompleto,
        email: currentUser.email,
        telefono: currentUser.telefono || ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validation
        if (!formData.nombreCompleto.trim()) {
            setError('El nombre completo es obligatorio');
            return;
        }

        if (!formData.email.trim()) {
            setError('El email es obligatorio');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Por favor ingrese un email válido');
            return;
        }

        setIsSaving(true);
        try {
            const result = await onSave(formData);

            if (result.success) {
                setSuccess('Perfil actualizado exitosamente');
                setTimeout(() => {
                    onClose();
                }, 1500);
            } else {
                setError(result.message || 'Error al actualizar el perfil');
            }
        } catch (err) {
            setError('Error al actualizar el perfil');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                            <User className="text-white" size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Editar Perfil</h2>
                            <p className="text-slate-400 text-sm">Actualiza tu información personal</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Read-only Usuario */}
                    <div>
                        <label className="block text-slate-400 text-sm mb-2">
                            Usuario (no se puede cambiar)
                        </label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                            <input
                                type="text"
                                value={currentUser.usuario}
                                disabled
                                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-slate-500 cursor-not-allowed"
                            />
                        </div>
                    </div>

                    {/* Nombre Completo */}
                    <div>
                        <label className="block text-slate-400 text-sm mb-2">
                            Nombre Completo <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                            <input
                                type="text"
                                value={formData.nombreCompleto}
                                onChange={(e) => setFormData({ ...formData, nombreCompleto: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-600 focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 outline-none transition-all"
                                placeholder="Ingresa tu nombre completo"
                                disabled={isSaving}
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-slate-400 text-sm mb-2">
                            Email <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-600 focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 outline-none transition-all"
                                placeholder="tu@email.com"
                                disabled={isSaving}
                            />
                        </div>
                    </div>

                    {/* Teléfono */}
                    <div>
                        <label className="block text-slate-400 text-sm mb-2">
                            Teléfono
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                            <input
                                type="tel"
                                value={formData.telefono}
                                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-600 focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 outline-none transition-all"
                                placeholder="Opcional"
                                disabled={isSaving}
                            />
                        </div>
                    </div>

                    {/* Change Password Note */}
                    <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
                        <Lock className="text-slate-500 flex-shrink-0 mt-0.5" size={20} />
                        <div>
                            <p className="text-slate-300 text-sm font-medium">Cambiar Contraseña</p>
                            <p className="text-slate-500 text-xs mt-1">
                                Para cambiar tu contraseña, contacta al administrador del sistema.
                            </p>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Success Message */}
                    {success && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-emerald-400 text-sm">
                            {success}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSaving}
                            className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    Guardar Cambios
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProfileModal;
