
import React, { useState, useEffect } from 'react';
import { Lock, User, LogIn, AlertCircle, UserPlus, Mail, Phone, ChevronLeft } from 'lucide-react';

interface LoginRegisterProps {
    onLogin: (user: string, pass: string) => Promise<boolean>;
    onRegister: (data: RegisterData) => Promise<{ success: boolean; message?: string; credentials?: { username: string; password: string } }>;
    isLoading: boolean;
    onOpenSettings: () => void;
}

export interface RegisterData {
    fullName: string;
    email: string;
    phone: string;
}

const LoginRegister: React.FC<LoginRegisterProps> = ({ onLogin, onRegister, isLoading, onOpenSettings }) => {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Register form data
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    // Generated credentials
    const [generatedCredentials, setGeneratedCredentials] = useState<{ username: string; password: string } | null>(null);

    // Implementación del atajo de teclado secreto
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Detectar Ctrl + Shift + K
            if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                onOpenSettings();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onOpenSettings]);

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!username || !password) {
            setError('Por favor ingrese usuario y contraseña');
            return;
        }

        const success = await onLogin(username, password);
        if (!success) {
            setError('Credenciales incorrectas o error de conexión');
        }
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setGeneratedCredentials(null);

        if (!fullName || !email) {
            setError('Por favor complete todos los campos obligatorios');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Por favor ingrese un email válido');
            return;
        }

        const result = await onRegister({ fullName, email, phone });

        if (result.success && result.credentials) {
            setSuccess('¡Registro exitoso! Guarde sus credenciales:');
            setGeneratedCredentials(result.credentials);
            // Limpiar formulario
            setFullName('');
            setEmail('');
            setPhone('');
        } else {
            setError(result.message || 'Error al registrarse');
        }
    };

    const handleBackToLogin = () => {
        setMode('login');
        setError('');
        setSuccess('');
        setGeneratedCredentials(null);
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px]"></div>
            </div>

            <div className="w-full max-w-md relative z-10">

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
                    {mode === 'login' ? (
                        <>
                            {/* Login Form */}
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-cyan-500/20 mb-4">
                                    <Lock className="text-white w-8 h-8" />
                                </div>
                                <h1 className="text-2xl font-bold text-white mb-2">Bienvenido</h1>
                                <p className="text-slate-400 text-sm">Ingrese sus credenciales para acceder</p>
                            </div>

                            <form onSubmit={handleLoginSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                                            <User size={20} />
                                        </div>
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 outline-none transition-all"
                                            placeholder="Usuario"
                                            disabled={isLoading}
                                        />
                                    </div>

                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                                            <Lock size={20} />
                                        </div>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 outline-none transition-all"
                                            placeholder="Contraseña"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
                                        <AlertCircle size={18} />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]"
                                >
                                    {isLoading ? (
                                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <LogIn size={20} />
                                            INICIAR SESIÓN
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Divider */}
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-800"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-slate-900/80 text-slate-500">¿No tienes cuenta?</span>
                                </div>
                            </div>

                            {/* Register button */}
                            <button
                                onClick={() => setMode('register')}
                                className="w-full bg-slate-800/50 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                <UserPlus size={20} />
                                CREAR CUENTA
                            </button>
                        </>
                    ) : (
                        <>
                            {/* Register Form */}
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4">
                                    <UserPlus className="text-white w-8 h-8" />
                                </div>
                                <h1 className="text-2xl font-bold text-white mb-2">Crear Cuenta</h1>
                                <p className="text-slate-400 text-sm">Complete los datos para registrarse</p>
                            </div>

                            {!generatedCredentials ? (
                                <form onSubmit={handleRegisterSubmit} className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors">
                                                <User size={20} />
                                            </div>
                                            <input
                                                type="text"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all"
                                                placeholder="Nombre Completo *"
                                                disabled={isLoading}
                                            />
                                        </div>

                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors">
                                                <Mail size={20} />
                                            </div>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all"
                                                placeholder="Email *"
                                                disabled={isLoading}
                                            />
                                        </div>

                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors">
                                                <Phone size={20} />
                                            </div>
                                            <input
                                                type="tel"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all"
                                                placeholder="Teléfono (opcional)"
                                                disabled={isLoading}
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
                                            <AlertCircle size={18} />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]"
                                    >
                                        {isLoading ? (
                                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <UserPlus size={20} />
                                                REGISTRARSE
                                            </>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleBackToLogin}
                                        className="w-full bg-slate-800/50 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        <ChevronLeft size={20} />
                                        Volver al Login
                                    </button>
                                </form>
                            ) : (
                                <div className="space-y-6">
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 space-y-4">
                                        <div className="text-emerald-400 font-bold text-center">
                                            ¡Cuenta creada exitosamente!
                                        </div>
                                        <div className="text-slate-300 text-sm text-center">
                                            Guarde estas credenciales en un lugar seguro:
                                        </div>
                                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                                            <div>
                                                <div className="text-slate-500 text-xs mb-1">Usuario:</div>
                                                <div className="text-white font-mono font-bold text-lg">{generatedCredentials.username}</div>
                                            </div>
                                            <div>
                                                <div className="text-slate-500 text-xs mb-1">Contraseña:</div>
                                                <div className="text-white font-mono font-bold text-lg">{generatedCredentials.password}</div>
                                            </div>
                                        </div>
                                        <div className="text-amber-400 text-xs text-center">
                                            ⚠️ Importante: No podrá recuperar estas credenciales. Guárdelas ahora.
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleBackToLogin}
                                        className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-2"
                                    >
                                        <LogIn size={20} />
                                        IR AL LOGIN
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="text-center mt-6 text-slate-500 text-xs">
                    &copy; {new Date().getFullYear()} Virtual Bingo Pro. Todos los derechos reservados.
                </div>
            </div>
        </div>
    );
};

export default LoginRegister;
