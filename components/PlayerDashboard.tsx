import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LogOut, User, Ticket, Users, Settings, TrendingUp, ChevronDown } from 'lucide-react';
import { CartonData } from '../types.ts';
import { SheetAPI } from '../services/googleSheetService.ts';
import MyCardsSection from './MyCardsSection.tsx';
import EditProfileModal from './EditProfileModal.tsx';
import CreateRoomModal from './CreateRoomModal.tsx';
import GameRoom from './GameRoom.tsx';
import JoinRoomModal from './JoinRoomModal.tsx';
import RoomsSection from './RoomsSection.tsx';
import { usePlayerCards } from '../contexts/PlayerCardsContext.tsx';

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

const parsePricePerCard = (value: unknown): number | undefined => {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === 'string') {
        const sanitized = value.replace(/[^0-9,.-]/g, '').replace(',', '.');
        const parsed = Number(sanitized);
        return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
};

const PlayerDashboard: React.FC<PlayerDashboardProps> = ({
    currentUser,
    sheetUrl,
    onLogout,
    bingoTitle,
    bingoSubtitle
}) => {
    const [activeSection, setActiveSection] = useState<DashboardSection>('rooms');
    const [isLoading, setIsLoading] = useState(false);
    const [userData, setUserData] = useState(currentUser);

    // Room State
    const [activeRoom, setActiveRoom] = useState<any | null>(null);
    const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [roomToJoin, setRoomToJoin] = useState<any | null>(null);
    const [rooms, setRooms] = useState<any[]>([]);
    const [roomsLoading, setRoomsLoading] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement | null>(null);

    const { cards: userCards } = usePlayerCards();

    // Don't load cards in dashboard - cards are room-specific
    // useEffect(() => {
    //     refreshCards();
    // }, [refreshCards]);

    const loadRooms = useCallback(async () => {
        setRoomsLoading(true);
        try {
            const result = await SheetAPI.getRooms(sheetUrl);
            if (result.success && result.rooms) {
                const normalized = result.rooms.map(room => {
                    const pricePerCard = parsePricePerCard(room.pricePerCard);
                    const cardsSold = typeof room.cardsSold === 'number' ? room.cardsSold : undefined;
                    return {
                        ...room,
                        pricePerCard,
                        cardsSold,
                        participantsCount: typeof room.participantsCount === 'number' ? room.participantsCount : undefined,
                        totalPot: typeof room.totalPot === 'number'
                            ? room.totalPot
                            : (typeof pricePerCard === 'number' && typeof cardsSold === 'number'
                                ? pricePerCard * cardsSold
                                : undefined)
                    };
                });
                setRooms(normalized);
            }
        } catch (error) {
            console.error('Error loading rooms:', error);
        } finally {
            setRoomsLoading(false);
        }
    }, [sheetUrl]);

    useEffect(() => {
        loadRooms();
    }, [loadRooms]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setIsProfileMenuOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsProfileMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, []);

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

    const handleCreateRoom = async (roomData: { name: string; password?: string; pricePerCard: number }) => {
        setIsLoading(true);
        try {
            const result = await SheetAPI.createRoom(sheetUrl, {
                name: roomData.name,
                password: roomData.password,
                adminId: currentUser.idUser,
                pricePerCard: roomData.pricePerCard
            });

            if (result.success && result.room) {
                await loadRooms();
                const createdRoomPrice = parsePricePerCard(result.room.pricePerCard ?? roomData.pricePerCard);
                setActiveRoom({ ...result.room, pricePerCard: createdRoomPrice });
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
        // Don't refresh cards when exiting - cards are room-specific
    };

    const handleSelectSection = (section: DashboardSection) => {
        setActiveSection(section);
        setIsProfileMenuOpen(false);
    };

    const handleOpenJoinRoom = (room: any) => {
        setRoomToJoin(room);
        setShowJoinModal(true);
    };

    const handleJoinRoom = async (roomId: string, password?: string) => {
        const selectedRoom = (roomToJoin && roomToJoin.id === roomId)
            ? roomToJoin
            : rooms.find(r => r.id === roomId);
        try {
            const stored = JSON.parse(sessionStorage.getItem('bingo_user_data') || '{}');
            const userId = stored.userId || currentUser.idUser;
            const res = await SheetAPI.joinRoom(sheetUrl, roomId, userId, password);
            if (res.success) {
                await loadRooms();
                const normalizedSelectedRoom = selectedRoom ? {
                    ...selectedRoom,
                    pricePerCard: parsePricePerCard(selectedRoom.pricePerCard)
                } : null;
                const backendRoom = res.room ? {
                    ...res.room,
                    pricePerCard: parsePricePerCard(res.room.pricePerCard)
                } : null;
                const resolvedRoom = {
                    ...(normalizedSelectedRoom || backendRoom || { id: roomId }),
                    pricePerCard: normalizedSelectedRoom?.pricePerCard ?? backendRoom?.pricePerCard
                };
                setActiveRoom(resolvedRoom);
                setShowJoinModal(false);
                setRoomToJoin(null);
            } else {
                alert(res.message || 'No se pudo unir a la sala');
            }
        } catch (err) {
            console.error('Error joining room:', err);
            alert('Ocurrió un error al unirse a la sala');
        }
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
                isMaster={currentUser.idUser === activeRoom.adminId} // True if the player is the creator/master of this room
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
                            <button
                                type="button"
                                onClick={() => handleSelectSection('rooms')}
                                className="text-left group focus:outline-none"
                                aria-label="Ir al lobby principal"
                            >
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent group-hover:opacity-90 transition-opacity">
                                    {bingoTitle}
                                </h1>
                            </button>
                            <p className="text-slate-400 text-sm mt-1">
                                Bienvenido, {userData.nombreCompleto}
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="relative" ref={profileMenuRef}>
                                <button
                                    type="button"
                                    onClick={() => setIsProfileMenuOpen(prev => !prev)}
                                    className="flex items-center gap-3 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700 text-left min-w-[180px]"
                                >
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold">
                                        {userData.nombreCompleto.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white text-sm font-medium">{userData.usuario}</p>
                                        <p className="text-slate-400 text-xs">{userCards.length} cartones</p>
                                    </div>
                                    <ChevronDown size={18} className={`text-slate-400 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isProfileMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-60 rounded-xl border border-slate-800 bg-slate-900/95 shadow-2xl z-20 overflow-hidden">
                                        <div className="px-4 py-3 border-b border-slate-800 text-xs text-slate-400 uppercase tracking-[0.3em]">
                                            Navegación
                                        </div>
                                        <div className="flex flex-col">
                                            <button
                                                className={`flex items-center gap-3 px-4 py-3 text-left text-sm hover:bg-slate-800/80 text-white ${activeSection === 'profile' ? 'bg-slate-800/80' : 'text-slate-300'}`}
                                                onClick={() => handleSelectSection('profile')}
                                            >
                                                <User size={16} /> Mi Perfil
                                            </button>
                                            <button
                                                className={`flex items-center gap-3 px-4 py-3 text-left text-sm hover:bg-slate-800/80 text-white ${activeSection === 'cards' ? 'bg-slate-800/80' : 'text-slate-300'}`}
                                                onClick={() => handleSelectSection('cards')}
                                            >
                                                <Ticket size={16} /> Mis Cartones
                                            </button>
                                            <button
                                                className={`flex items-center gap-3 px-4 py-3 text-left text-sm hover:bg-slate-800/80 text-white ${activeSection === 'rooms' ? 'bg-slate-800/80' : 'text-slate-300'}`}
                                                onClick={() => handleSelectSection('rooms')}
                                            >
                                                <Users size={16} /> Salas de Bingo
                                            </button>
                                        </div>
                                        <div className="border-t border-slate-800">
                                            <button
                                                className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-rose-300 hover:bg-rose-900/20"
                                                onClick={onLogout}
                                            >
                                                <LogOut size={16} /> Cerrar sesión
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs (mobile) */}
            <div className="bg-slate-900/30 border-b border-slate-800 lg:hidden">
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

            {/* Main Content + Side Panel */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="min-w-0 space-y-8">
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
                            bingoTitle={bingoTitle}
                            bingoSubtitle={bingoSubtitle}
                            onNavigateToRooms={() => setActiveSection('rooms')}
                        />
                    )}

                    {activeSection === 'rooms' && (
                        <RoomsSection
                            rooms={rooms}
                            isLoading={roomsLoading}
                            onCreateRoom={() => setShowCreateRoomModal(true)}
                            onJoinRoom={handleOpenJoinRoom}
                            onRefresh={loadRooms}
                        />
                    )}
                </div>
            </div>

            {/* Create Room Modal */}
            {showCreateRoomModal && (
                <CreateRoomModal
                    onClose={() => setShowCreateRoomModal(false)}
                    onCreate={handleCreateRoom}
                />
            )}
            {showJoinModal && roomToJoin && (
                <JoinRoomModal
                    room={roomToJoin}
                    onClose={() => { setShowJoinModal(false); setRoomToJoin(null); }}
                    onJoin={handleJoinRoom}
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

export default PlayerDashboard;
