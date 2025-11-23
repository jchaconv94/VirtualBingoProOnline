import React, { useState, useEffect } from 'react';
import { LogOut, User, Ticket, Users, Settings, Plus, TrendingUp } from 'lucide-react';
import { CartonData } from '../types.ts';
import { SheetAPI } from '../services/googleSheetService.ts';
import MyCardsSection from './MyCardsSection.tsx';
import EditProfileModal from './EditProfileModal.tsx';
import CreateRoomModal from './CreateRoomModal.tsx';
import GameRoom from './GameRoom.tsx';

interface PlayerDashboardProps {
    currentUser: {
        idUser: string;
        nombreCompleto: string;
        email: string;
        usuario: string;
        telefono?: string;
    };
    sheetUrl: string;
    onLogout: () => void;
    bingoTitle: string;
    bingoSubtitle: string;
}

type DashboardSection = 'profile' | 'cards' | 'rooms';

const PlayerDashboard: React.FC<PlayerDashboardProps> = ({
    currentUser,
    sheetUrl,
    onLogout,
    bingoTitle,
    bingoSubtitle
}) => {
    const [activeSection, setActiveSection] = useState<DashboardSection>('rooms');
    const [userCards, setUserCards] = useState<CartonData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [userData, setUserData] = useState(currentUser);

    // Room State
    const [activeRoom, setActiveRoom] = useState<any | null>(null);
    const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);

    useEffect(() => {
        loadUserCards();
    }, [currentUser.idUser]);

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

    const handleProfileUpdated = () => {
        const storedUser = JSON.parse(sessionStorage.getItem('bingo_user_data') || '{}');
        setUserData({
            idUser: storedUser.userId || currentUser.idUser,
            nombreCompleto: storedUser.fullName || currentUser.nombreCompleto,
            email: storedUser.email || currentUser.email,
            usuario: storedUser.username || currentUser.usuario,
            telefono: storedUser.phone || currentUser.telefono
        });
    };

    const handleCreateRoom = async (roomData: { name: string; password?: string }) => {
        setIsLoading(true);
        try {
            const result = await SheetAPI.createRoom(sheetUrl, {
                name: roomData.name,
                password: roomData.password,
                adminId: currentUser.idUser
            });

            if (result.success && result.room) {
                setActiveRoom(result.room);
                setShowCreateRoomModal(false);
            } else {
                console.error('Error creating room:', result.message);
                alert(`Error al crear sala: ${result.message}`);
            }
        } catch (error) {
            console.error('Error creating room:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExitRoom = () => {
        setActiveRoom(null);
    };

    // If in a room, render the GameRoom component
    if (activeRoom) {
        return (
            <GameRoom
                currentUser={{
                    username: userData.usuario,
                    fullName: userData.nombreCompleto,
                    email: userData.email,
                    userId: userData.idUser
                }}
                userRole="player" // Still a player role globally
                sheetUrl={sheetUrl}
                onLogout={onLogout}
                isRoomAdmin={true} // They are admin of THIS room
                roomData={activeRoom}
                onExitRoom={handleExitRoom}
            />
        );
    }

    const navItems = [
        { id: 'profile' as DashboardSection, label: 'Mi Perfil', icon: User, color: 'from-purple-500 to-pink-500' },
        { id: 'cards' as DashboardSection, label: 'Mis Cartones', icon: Ticket, color: 'from-cyan-500 to-blue-500' },
        { id: 'rooms' as DashboardSection, label: 'Salas de Bingo', icon: Users, color: 'from-emerald-500 to-green-500' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Header */}
            <div className="bg-slate-900/50 border-b border-slate-800 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                                {bingoTitle}
                            </h1>
                            <p className="text-slate-400 text-sm mt-1">
                                Bienvenido, {userData.nombreCompleto}
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold">
                                    {userData.nombreCompleto.charAt(0).toUpperCase()}
                                </div>
                                <div className="text-left">
                                    <p className="text-white text-sm font-medium">{userData.usuario}</p>
                                    <p className="text-slate-400 text-xs">{userCards.length} cartones</p>
                                </div>
                            </div>

                            <button
                                onClick={onLogout}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                            >
                                <LogOut size={18} />
                                <span className="hidden sm:inline">Salir</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-slate-900/30 border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex gap-2 overflow-x-auto py-4">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeSection === item.id;

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveSection(item.id)}
                                    className={`
                    flex items-center gap-3 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap
                    ${isActive
                                            ? `bg-gradient-to-r ${item.color} text-white shadow-lg transform scale-105`
                                            : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'
                                        }
                  `}
                                >
                                    <Icon size={20} />
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeSection === 'profile' && (
                    <ProfileSection
                        currentUser={userData}
                        userCards={userCards}
                        sheetUrl={sheetUrl}
                        onProfileUpdated={handleProfileUpdated}
                    />
                )}

                {activeSection === 'cards' && (
                    <MyCardsSection
                        userCards={userCards}
                        currentUser={userData}
                        sheetUrl={sheetUrl}
                        bingoTitle={bingoTitle}
                        bingoSubtitle={bingoSubtitle}
                        onCardsUpdated={loadUserCards}
                    />
                )}

                {activeSection === 'rooms' && (
                    <RoomsSection
                        currentUser={userData}
                        sheetUrl={sheetUrl}
                        onCreateRoom={() => setShowCreateRoomModal(true)}
                    />
                )}
            </div>

            {/* Create Room Modal */}
            {showCreateRoomModal && (
                <CreateRoomModal
                    onClose={() => setShowCreateRoomModal(false)}
                    onCreate={handleCreateRoom}
                />
            )}
        </div>
    );
};

// Profile Section Component
const ProfileSection: React.FC<{
    currentUser: any;
    userCards: CartonData[];
    sheetUrl: string;
    onProfileUpdated: () => void;
}> = ({ currentUser, userCards, sheetUrl, onProfileUpdated }) => {
    const [showEditModal, setShowEditModal] = useState(false);

    const handleSaveProfile = async (data: {
        nombreCompleto: string;
        email: string;
        telefono: string;
    }) => {
        try {
            const result = await SheetAPI.updateProfile(sheetUrl, currentUser.idUser, data);

            if (result.success) {
                // Update session storage
                const storedUser = JSON.parse(sessionStorage.getItem('bingo_user_data') || '{}');
                const updatedUser = {
                    ...storedUser,
                    fullName: data.nombreCompleto,
                    email: data.email,
                    phone: data.telefono
                };
                sessionStorage.setItem('bingo_user_data', JSON.stringify(updatedUser));

                // Trigger parent update
                onProfileUpdated();

                return { success: true };
            }

            return result;
        } catch (error) {
            console.error('Error updating profile:', error);
            return { success: false, message: 'Error al actualizar el perfil' };
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Mi Perfil</h2>
                <button
                    onClick={() => setShowEditModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg flex items-center gap-2 transition-all"
                >
                    <Settings size={18} />
                    Editar Perfil
                </button>
            </div>

            {/* Profile Card */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8">
                <div className="flex items-start gap-6">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-4xl font-bold">
                        {currentUser.nombreCompleto.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 space-y-4">
                        <div>
                            <label className="text-slate-500 text-sm">Nombre Completo</label>
                            <p className="text-white text-lg font-medium">{currentUser.nombreCompleto}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-slate-500 text-sm">Usuario</label>
                                <p className="text-white">{currentUser.usuario}</p>
                            </div>
                            <div>
                                <label className="text-slate-500 text-sm">Email</label>
                                <p className="text-white">{currentUser.email}</p>
                            </div>
                            {currentUser.telefono && (
                                <div>
                                    <label className="text-slate-500 text-sm">Teléfono</label>
                                    <p className="text-white">{currentUser.telefono}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                            <Ticket className="text-cyan-400" size={24} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm">Cartones Comprados</p>
                            <p className="text-white text-2xl font-bold">{userCards.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20 rounded-xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                            <Users className="text-emerald-400" size={24} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm">Partidas Jugadas</p>
                            <p className="text-white text-2xl font-bold">0</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
                            <TrendingUp className="text-amber-400" size={24} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm">Victorias</p>
                            <p className="text-white text-2xl font-bold">0</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal */}
            {showEditModal && (
                <EditProfileModal
                    currentUser={currentUser}
                    onClose={() => setShowEditModal(false)}
                    onSave={handleSaveProfile}
                />
            )}
        </div>
    );
};

// Rooms Section Component
const RoomsSection: React.FC<{
    currentUser: any;
    sheetUrl: string;
    onCreateRoom: () => void;
}> = ({ currentUser, sheetUrl, onCreateRoom }) => {
    const [rooms, setRooms] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        loadRooms();
    }, []);

    const loadRooms = async () => {
        setIsLoading(true);
        try {
            const result = await SheetAPI.getRooms(sheetUrl);
            if (result.success && result.rooms) {
                setRooms(result.rooms);
            }
        } catch (error) {
            console.error('Error loading rooms:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Users className="text-emerald-400" />
                    Salas de Bingo
                </h2>
                <button
                    onClick={onCreateRoom}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg transition-all transform hover:scale-105"
                >
                    <Plus size={20} />
                    Crear Sala
                </button>
            </div>

            {isLoading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                    <p className="text-slate-400">Cargando salas...</p>
                </div>
            ) : rooms.length === 0 ? (
                /* Empty state */
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
                    <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg mb-2">No hay salas disponibles</p>
                    <p className="text-slate-500 text-sm mb-6">Crea una nueva sala para empezar a jugar</p>
                    <button
                        onClick={onCreateRoom}
                        className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold rounded-xl inline-flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Crear Mi Primera Sala
                    </button>
                </div>
            ) : (
                /* Room List */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rooms.map((room) => (
                        <div key={room.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-emerald-500/50 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1">{room.name}</h3>
                                    <p className="text-slate-400 text-xs">ID: {room.id}</p>
                                </div>
                                {room.isPrivate && (
                                    <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-lg border border-amber-500/20">
                                        Privada
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-2 text-slate-400 text-sm mb-6">
                                <User size={14} />
                                <span>Creado por Admin</span>
                            </div>

                            <button
                                className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium"
                                onClick={() => alert("La funcionalidad de unirse a salas estará disponible pronto.")}
                            >
                                Unirse a Sala
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PlayerDashboard;
