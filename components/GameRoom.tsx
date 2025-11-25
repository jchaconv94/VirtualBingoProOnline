import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Participant, GameState, Winner, TOTAL_BALLS, BingoCard, PatternKey, Prize, WinPattern, CartonData } from '../types.ts';
import { generateBingoCardNumbers, generateId, generateUniqueId, checkWinners, WIN_PATTERNS, toTitleCase, cartonListToBingoCards, removeFreeSpace } from '../utils/helpers.ts';
import { exportToExcel, parseExcel, downloadCardImage, downloadAllCardsZip, generateBingoCardsPDF } from '../services/exportService.ts';
import { SheetAPI } from '../services/googleSheetService.ts';
import RegistrationPanel from './RegistrationPanel.tsx';
import GamePanel from './GamePanel.tsx';
import ParticipantsPanel from './ParticipantsPanel.tsx';
import WinnerModal from './WinnerModal.tsx';
import WinnerDetailsModal from './WinnerDetailsModal.tsx';
import PrizesPanel from './PrizesPanel.tsx';
import EditTitleModal from './EditTitleModal.tsx';
import ConnectionModal from './ConnectionModal.tsx';
import BuyCardsModal from './BuyCardsModal.tsx';
import EditRoomModal from './EditRoomModal.tsx';
import { Maximize2, Minimize2, PanelLeftOpen, Edit, FileText, Image as ImageIcon, Cloud, RefreshCw, Loader2, Link, Zap, LogOut, Menu, X, ShoppingCart, Sparkles, DoorOpen, User, Settings } from 'lucide-react';
import { useAlert, AlertAction } from '../contexts/AlertContext.tsx';
import { usePlayerCards } from '../contexts/PlayerCardsContext.tsx';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2
}).format(value);

// LocalStorage Keys (Scoped by room if needed, for now global for admin)
const LS_KEYS = {
    PARTICIPANTS: 'bingo_participants_v1',
    GAME_STATE: 'bingo_gamestate_v1',
    WINNERS: 'bingo_winners_v1',
    PRIZES: 'bingo_prizes_v1',
    TITLE: 'bingo_title_v1',
    SUBTITLE: 'bingo_subtitle_v1',
    SHEET_URL: 'bingo_sheet_url_v1',
    AUTO_SYNC: 'bingo_auto_sync_v1',
    SYNC_INTERVAL: 'bingo_sync_interval_v1'
};

// Helper to scope localStorage keys by room
const getRoomScopedKey = (baseKey: string, roomId?: string): string => {
    return roomId ? `${baseKey}_room_${roomId}` : baseKey;
};

interface GameRoomProps {
    currentUser: { username: string; fullName?: string; email?: string; userId?: string; phone?: string } | null;
    userRole: 'admin' | 'player';
    sheetUrl: string;
    onLogout: () => void;
    isMaster: boolean; // True if user is the creator/master of this specific room
    roomData?: any; // For future use with specific room data
    onExitRoom?: () => void; // For players to go back to dashboard
    onRoomUpdate?: (updatedRoom: any) => void; // Callback to notify parent of room updates
}

const GameRoom: React.FC<GameRoomProps> = ({
    currentUser,
    userRole,
    sheetUrl: initialSheetUrl,
    onLogout,
    isMaster,
    roomData: initialRoomData,
    onExitRoom,
    onRoomUpdate
}) => {
    const { showAlert, showConfirm } = useAlert();
    const { refreshCards: refreshPlayerCards } = usePlayerCards();
    
    // Local state for room data to allow instant updates
    const [roomData, setRoomData] = useState(initialRoomData);
    const activeRoomId = roomData?.id;

    // Sync with prop changes
    useEffect(() => {
        setRoomData(initialRoomData);
    }, [initialRoomData]);

    // --- Configuración de Nube ---
    const [sheetUrl, setSheetUrl] = useState<string>(initialSheetUrl);

    // Auto Sync Config
    const [autoSync, setAutoSync] = useState<boolean>(() => {
        const saved = localStorage.getItem(LS_KEYS.AUTO_SYNC);
        return saved ? JSON.parse(saved) : true;
    });
    const [syncInterval, setSyncInterval] = useState<number>(() => {
        const saved = localStorage.getItem(LS_KEYS.SYNC_INTERVAL);
        return saved ? JSON.parse(saved) : 2000;
    });

    const [isSyncing, setIsSyncing] = useState(false);
    const [showConnectionModal, setShowConnectionModal] = useState(false);
    const isPollingRef = useRef(false);

    // --- State ---
    // Always start empty and load from database (no localStorage cache)
    const [participants, setParticipants] = useState<Participant[]>([]);

    const [gameState, setGameState] = useState<GameState>(() => {
        const defaults = {
            drawnBalls: [],
            history: [],
            selectedPattern: 'NONE' as PatternKey,
            roundLocked: false,
            gameRound: 1,
            isPaused: false
        };
        const key = getRoomScopedKey(LS_KEYS.GAME_STATE, activeRoomId);
        const saved = localStorage.getItem(key);
        const loaded = saved ? JSON.parse(saved) : defaults;
        return { ...defaults, ...loaded, isPaused: loaded.isPaused || false };
    });

    const [winners, setWinners] = useState<Winner[]>(() => {
        const key = getRoomScopedKey(LS_KEYS.WINNERS, activeRoomId);
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : [];
    });

    const [prizes, setPrizes] = useState<Prize[]>(() => {
        const key = getRoomScopedKey(LS_KEYS.PRIZES, activeRoomId);
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : [];
    });

    const [bingoTitle, setBingoTitle] = useState<string>(() => {
        const key = getRoomScopedKey(LS_KEYS.TITLE, activeRoomId);
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : "VIRTUAL BINGO PRO";
    });

    const [bingoSubtitle, setBingoSubtitle] = useState<string>(() => {
        const key = getRoomScopedKey(LS_KEYS.SUBTITLE, activeRoomId);
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : "Aplicación web de bingo virtual";
    });

    const [showTitleModal, setShowTitleModal] = useState(false);
    const [showEditRoomModal, setShowEditRoomModal] = useState(false);
    const [isUpdatingRoom, setIsUpdatingRoom] = useState(false);
    const [currentBatchWinners, setCurrentBatchWinners] = useState<Winner[]>([]);
    const [viewingDetailsData, setViewingDetailsData] = useState<{
        winner: Winner;
        participant: Participant;
        card: BingoCard;
    } | null>(null);

    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showBuyModal, setShowBuyModal] = useState(false);
    const [isProcessingPurchase, setIsProcessingPurchase] = useState(false);

    const totalCards = participants.reduce((acc, p) => acc + p.cards.length, 0);
    const resolveCardPrice = (value: unknown): number | undefined => {
        if (typeof value === 'number' && Number.isFinite(value)) return value;
        if (typeof value === 'string') {
            const sanitized = value.replace(/[^0-9,.-]/g, '').replace(',', '.');
            const parsed = Number(sanitized);
            return Number.isFinite(parsed) ? parsed : undefined;
        }
        return undefined;
    };

    const cardPrice = resolveCardPrice(roomData?.pricePerCard);
    const hasValidCardPrice = typeof cardPrice === 'number' && cardPrice > 0;
    const canPurchaseCards = userRole === 'player' && hasValidCardPrice;
    const derivePlayerParticipantFromCards = useCallback((cartons: CartonData[]): Participant | null => {
        if (!currentUser || cartons.length === 0) return null;
        const participantId = currentUser.userId || generateUniqueId('P');
        const fallbackName = currentUser.fullName || currentUser.username || 'Jugador';
        const parts = fallbackName.trim().split(/\s+/);
        const firstName = parts[0] || fallbackName;
        const surname = parts.slice(1).join(' ');
        const normalizedCards = cartonListToBingoCards(cartons);

        return {
            id: participantId,
            userId: currentUser.userId,
            name: toTitleCase(firstName),
            surname: toTitleCase(surname),
            dni: currentUser.userId || currentUser.username || currentUser.email || participantId,
            phone: currentUser.phone,
            email: currentUser.email,
            cards: normalizedCards
        };
    }, [currentUser]);

    const persistPlayerParticipant = useCallback(async (cartons: CartonData[]) => {
        if (!sheetUrl || !currentUser) return;
        const payload = derivePlayerParticipantFromCards(cartons);
        if (!payload) return;

        // Add timestamp to track when cards were added/updated
        payload.createdAt = Date.now();

        setParticipants(prev => {
            const idx = prev.findIndex(p => p.id === payload.id || (payload.userId && p.userId === payload.userId));
            if (idx >= 0) {
                // Update existing participant with ALL new data including cards
                const cloned = [...prev];
                cloned[idx] = payload; // Replace completely, not merge
                return cloned;
            }
            return [payload, ...prev];
        });

        try {
            await SheetAPI.syncParticipant(sheetUrl, payload);
        } catch (error) {
            console.error('Error syncing participant after purchase', error);
        }
    }, [currentUser, sheetUrl, derivePlayerParticipantFromCards]);

    // --- Persistence ---
    // Note: Participants are NOT saved to localStorage, always loaded fresh from DB
    useEffect(() => {
        if (activeRoomId) {
            const key = getRoomScopedKey(LS_KEYS.GAME_STATE, activeRoomId);
            localStorage.setItem(key, JSON.stringify(gameState));
        }
    }, [gameState, activeRoomId]);
    useEffect(() => {
        if (activeRoomId) {
            const key = getRoomScopedKey(LS_KEYS.WINNERS, activeRoomId);
            localStorage.setItem(key, JSON.stringify(winners));
        }
    }, [winners, activeRoomId]);
    useEffect(() => {
        if (activeRoomId) {
            const key = getRoomScopedKey(LS_KEYS.PRIZES, activeRoomId);
            localStorage.setItem(key, JSON.stringify(prizes));
        }
    }, [prizes, activeRoomId]);
    useEffect(() => {
        if (activeRoomId) {
            const key = getRoomScopedKey(LS_KEYS.TITLE, activeRoomId);
            localStorage.setItem(key, JSON.stringify(bingoTitle));
        }
    }, [bingoTitle, activeRoomId]);
    useEffect(() => {
        if (activeRoomId) {
            const key = getRoomScopedKey(LS_KEYS.SUBTITLE, activeRoomId);
            localStorage.setItem(key, JSON.stringify(bingoSubtitle));
        }
    }, [bingoSubtitle, activeRoomId]);
    useEffect(() => { localStorage.setItem(LS_KEYS.AUTO_SYNC, JSON.stringify(autoSync)); }, [autoSync]);
    useEffect(() => { localStorage.setItem(LS_KEYS.SYNC_INTERVAL, JSON.stringify(syncInterval)); }, [syncInterval]);

    // --- Helper Functions ---
    const addLog = (message: string) => {
        const time = new Date().toLocaleTimeString();
        setGameState(prev => ({ ...prev, history: [...prev.history, `${time}: ${message}`] }));
    };

    const loadFromCloud = async (silent: boolean = false) => {
        if (!sheetUrl || isPollingRef.current) return;
        isPollingRef.current = true;
        if (!silent) setIsSyncing(true);
        try {
            const data = await SheetAPI.fetchAll(sheetUrl);
            if (data) {
                const normalized = data.map(p => ({ ...p, name: toTitleCase(p.name), surname: toTitleCase(p.surname) }));
                setParticipants(prev => {
                    if (normalized.length !== prev.length) return normalized;
                    const hasCardChanges = normalized.some(newP => {
                        const existingP = prev.find(p => p.id === newP.id);
                        if (!existingP) return true;
                        if (newP.cards.length !== existingP.cards.length) return true;
                        const existingCardIds = new Set(existingP.cards.map(c => c.id));
                        return newP.cards.some(c => !existingCardIds.has(c.id));
                    });
                    return hasCardChanges ? normalized : prev;
                });
                if (!silent) addLog("Datos sincronizados desde la nube.");
            }
        } catch (error) {
            console.error("Error loading from cloud", error);
            if (!silent) showAlert({ title: 'Error de Sincronización', message: 'No se pudieron cargar los datos de la nube.', type: 'danger' });
        } finally {
            isPollingRef.current = false;
            if (!silent) setIsSyncing(false);
        }
    };

    const syncToCloud = async (action: 'save' | 'delete' | 'deleteAll', data?: any) => {
        if (!sheetUrl) return;
        setIsSyncing(true);
        try {
            if (action === 'save' && data) await SheetAPI.syncParticipant(sheetUrl, data);
            else if (action === 'delete' && data) await SheetAPI.deleteParticipant(sheetUrl, data);
            else if (action === 'deleteAll') await SheetAPI.deleteAll(sheetUrl);
        } catch (error) {
            console.error("Error syncing to cloud", error);
            addLog(`Error al sincronizar (${action}) con la nube.`);
        } finally {
            setIsSyncing(false);
        }
    };

    // Initial Load & Polling
    useEffect(() => {
        if (sheetUrl && isMaster) {
            loadFromCloud();
        }
    }, []);

    // When a player enters a room ensure their cards are scoped to that room
    useEffect(() => {
        if (userRole === 'player' && activeRoomId) {
            refreshPlayerCards(activeRoomId).then(cards => {
                // Sync loaded cards to participants state so they display in ParticipantsPanel
                persistPlayerParticipant(cards);
            });
        }
    }, [userRole, activeRoomId, refreshPlayerCards, persistPlayerParticipant]);

    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval>;
        if (autoSync && sheetUrl && isMaster) {
            intervalId = setInterval(() => {
                loadFromCloud(true);
            }, syncInterval);
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [autoSync, sheetUrl, syncInterval, isMaster]);

    // --- Game Logic Handlers ---
    const handleDrawBall = () => {
        if (gameState.drawnBalls.length >= TOTAL_BALLS) return;
        if (gameState.roundLocked) {
            showAlert({ message: "La ronda ha finalizado. Por favor reinicia o confirma para continuar.", type: 'warning' });
            return;
        }

        let nextBall: number;
        do {
            nextBall = Math.floor(Math.random() * TOTAL_BALLS) + 1;
        } while (gameState.drawnBalls.includes(nextBall));

        const newDrawnBalls = [...gameState.drawnBalls, nextBall];
        setGameState(prev => ({ ...prev, drawnBalls: newDrawnBalls }));

        // Check winners
        if (gameState.selectedPattern !== 'NONE') {
            const newWinners = checkWinners(participants, newDrawnBalls, winners, gameState.selectedPattern, gameState.gameRound);
            const previousWinnerIds = new Set(winners.map(w => w.cardId));
            const brandNewWinners = newWinners.filter(w => !previousWinnerIds.has(w.cardId));

            if (brandNewWinners.length > 0) {
                setGameState(prev => ({ ...prev, roundLocked: true }));
                setCurrentBatchWinners(brandNewWinners);
                confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, zIndex: 9999 });
                const winnerNames = brandNewWinners.map(w => w.participantName).join(', ');
                addLog(`¡BINGO! Ganadores: ${winnerNames}`);
            }
        }
    };

    const handleReset = async () => {
        if (await showConfirm({ title: 'Reiniciar Juego', message: '¿Estás seguro? Se borrará el progreso actual.', type: 'warning' })) {
            setGameState(prev => ({
                drawnBalls: [],
                history: [...prev.history, '--- JUEGO REINICIADO ---'],
                selectedPattern: 'NONE',
                roundLocked: false,
                gameRound: prev.gameRound + 1,
                isPaused: false
            }));
            setWinners([]);
        }
    };

    const handlePatternChange = (pattern: PatternKey) => {
        setGameState(prev => ({ ...prev, selectedPattern: pattern }));
        addLog(`Patrón cambiado a: ${WIN_PATTERNS[pattern].label}`);
    };

    const handleRegister = async (data: Omit<Participant, 'id' | 'cards'>, cardsCount: number) => {
        const isDuplicate = participants.some(p => p.dni.trim().toLowerCase() === data.dni.trim().toLowerCase());
        if (isDuplicate) {
            showAlert({ title: 'DNI Duplicado', message: `Ya existe un participante con ID ${data.dni}.`, type: 'warning' });
            return;
        }
        const newParticipant: Participant = { id: generateUniqueId('P'), ...data, name: toTitleCase(data.name), surname: toTitleCase(data.surname), cards: [], createdAt: Date.now() };

        const newCards = [];
        for (let i = 0; i < cardsCount; i++) {
            newCards.push({ id: generateUniqueId('C'), numbers: generateBingoCardNumbers() });
        }
        newParticipant.cards = newCards;

        setParticipants(prev => [newParticipant, ...prev]);
        await syncToCloud('save', newParticipant);
        addLog(`Registrado: ${newParticipant.name} (${cardsCount} cartones)`);
        showAlert({ title: 'Registro Exitoso', message: `${newParticipant.name} ha sido registrado correctamente.`, type: 'success' });
    };

    const handleImport = async (file: File) => {
        try {
            const importedData = await parseExcel(file);
            const newParticipants: Participant[] = [];
            let addedCount = 0;

            for (const row of importedData as any[]) {
                if (!row.dni || !row.name) continue;
                const exists = participants.some(p => p.dni === row.dni) || newParticipants.some(p => p.dni === row.dni);
                if (exists) continue;

                const pId = generateUniqueId('P');
                const cards = [];
                const cardsToGen = row.cardsCount || 1;
                for (let i = 0; i < cardsToGen; i++) {
                    cards.push({ id: generateUniqueId('C'), numbers: generateBingoCardNumbers() });
                }

                newParticipants.push({
                    id: pId,
                    name: toTitleCase(row.name),
                    surname: toTitleCase(row.surname || ''),
                    dni: row.dni,
                    email: row.email,
                    phone: row.phone,
                    cards: cards,
                    createdAt: Date.now()
                });
                addedCount++;
            }

            if (addedCount > 0) {
                const updatedList = [...newParticipants, ...participants];
                setParticipants(updatedList);
                for (const p of newParticipants) await syncToCloud('save', p);
                addLog(`Importados ${addedCount} participantes.`);
                showAlert({ title: 'Importación Exitosa', message: `Se han importado ${addedCount} participantes nuevos.`, type: 'success' });
            } else {
                showAlert({ title: 'Importación', message: 'No se encontraron participantes nuevos para importar.', type: 'info' });
            }
        } catch (error) {
            console.error(error);
            showAlert({ title: 'Error', message: 'Error al procesar el archivo Excel.', type: 'danger' });
        }
    };

    const handleAddCard = async (participantId: string) => {
        const currentParticipant = participants.find(p => p.id === participantId);
        if (!currentParticipant) return;

        const newCardId = generateUniqueId('C');
        const newCard = { id: newCardId, numbers: generateBingoCardNumbers() };
        const updatedParticipant = { ...currentParticipant, cards: [newCard, ...currentParticipant.cards] };

        setParticipants(prev => prev.map(p => p.id === participantId ? updatedParticipant : p));
        await syncToCloud('save', updatedParticipant);
        const successActions: AlertAction[] = [
            { label: 'Descargar PNG', onClick: () => downloadCardImage(updatedParticipant, newCard, bingoTitle, bingoSubtitle), icon: <ImageIcon size={18} />, className: 'bg-slate-800 hover:bg-cyan-900/50 text-cyan-400 border-cyan-800' },
            { label: 'Descargar PDF', onClick: () => generateBingoCardsPDF(updatedParticipant, bingoTitle, bingoSubtitle, newCard.id), icon: <FileText size={18} />, className: 'bg-slate-800 hover:bg-emerald-900/50 text-emerald-400 border-emerald-800' }
        ];
        showAlert({ title: 'Cartón Agregado', message: `Se ha añadido exitosamente el cartón #${newCardId} a ${currentParticipant.name}.`, type: 'success', actions: successActions });
    };

    const handleDeleteCard = async (participantId: string, cardId: string) => {
        if (await showConfirm({ title: 'Eliminar Cartón', message: '¿Estás seguro de eliminar este cartón?', type: 'danger' })) {
            const currentParticipant = participants.find(p => p.id === participantId);
            if (!currentParticipant) return;

            const updatedCards = currentParticipant.cards.filter(c => c.id !== cardId);
            const updatedParticipant = { ...currentParticipant, cards: updatedCards };

            setParticipants(prev => prev.map(p => p.id === participantId ? updatedParticipant : p));
            await syncToCloud('save', updatedParticipant);
            addLog(`Cartón eliminado de ${currentParticipant.name}`);
        }
    };

    const handleEditParticipant = async (id: string, data: Partial<Participant>) => {
        const currentParticipant = participants.find(p => p.id === id);
        if (!currentParticipant) return;

        const updatedParticipant = { ...currentParticipant, ...data };
        setParticipants(prev => prev.map(p => p.id === id ? updatedParticipant : p));
        await syncToCloud('save', updatedParticipant);
        addLog(`Participante editado: ${updatedParticipant.name}`);
    };

    const handleDeleteParticipant = async (id: string) => {
        if (await showConfirm({ title: 'Eliminar Participante', message: '¿Eliminar participante y sus cartones?', type: 'danger' })) {
            const p = participants.find(part => part.id === id);
            setParticipants(prev => prev.filter(part => part.id !== id));
            if (p) await syncToCloud('delete', p);
            addLog(`Participante eliminado: ${p?.name}`);
        }
    };

    const handleDeleteAllParticipants = async () => {
        if (await showConfirm({ title: 'Eliminar TODOS', message: '¿ESTÁS SEGURO? Se borrarán TODOS los participantes.', type: 'danger' })) {
            setParticipants([]);
            await syncToCloud('deleteAll');
            addLog('Todos los participantes eliminados.');
        }
    };

    const handleConfirmRound = () => {
        setWinners(prev => [...prev, ...currentBatchWinners]);
        setCurrentBatchWinners([]);
        setGameState(prev => ({ ...prev, roundLocked: false }));
    };

    const handleRejectWinner = (winner: Winner) => {
        setCurrentBatchWinners(prev => prev.filter(w => w.cardId !== winner.cardId));
        if (currentBatchWinners.length <= 1) {
            setGameState(prev => ({ ...prev, roundLocked: false }));
        }
    };

    const handleViewDetailsFromSummary = (winner: Winner) => {
        const participant = participants.find(p => p.id === winner.participantId);
        if (participant) {
            const card = participant.cards.find(c => c.id === winner.cardId);
            if (card) {
                setViewingDetailsData({ winner, participant, card });
            }
        }
    };

    // Prize Handlers
    const handleAddPrize = (name: string, description: string) => { setPrizes(prev => [...prev, { id: generateId('PR'), name, description, isAwarded: false }]); };
    const handleEditPrize = (id: string, name: string, description: string) => { setPrizes(prev => prev.map(p => p.id === id ? { ...p, name, description } : p)); };
    const handleRemovePrize = async (id: string) => {
        const prize = prizes.find(p => p.id === id);
        if (prize?.isAwarded) { await showAlert({ message: "No puedes eliminar premios entregados.", type: 'danger' }); return; }
        if (await showConfirm({ title: 'Eliminar', message: "¿Eliminar premio?", type: 'danger' })) { setPrizes(prev => prev.filter(p => p.id !== id)); }
    };
    const handleTogglePrize = (id: string) => {
        setPrizes(prev => prev.map(p => p.id === id ? { ...p, isAwarded: !p.isAwarded } : p));
    };

    // UI Handlers
    const toggleFullScreen = () => {
        if (!document.fullscreenElement) { document.documentElement.requestFullscreen().catch(err => console.error(err)); }
        else { if (document.exitFullscreen) document.exitFullscreen(); }
    };

    const handleDownloadCard = async (p: Participant, cid: string) => { const card = p.cards.find(c => c.id === cid); if (card) await downloadCardImage(p, card, bingoTitle, bingoSubtitle); };

    const handleShareCard = async (p: Participant, cid: string) => {
        if (!p.phone) return;
        const card = p.cards.find(c => c.id === cid);
        if (card) {
            await generateBingoCardsPDF(p, bingoTitle, bingoSubtitle, cid);
            const url = `https://web.whatsapp.com/send?phone=${p.phone.replace(/\D/g, '')}&text=${encodeURIComponent(`Hola ${p.name}, este es tu cartón #${card.id}, para jugar en Bingo Virtual,\nBuena suerte! 🍀`)}`;
            window.open(url);
        }
    };

    const handleShareAllCards = async (p: Participant) => {
        if (!p.phone) return;
        await generateBingoCardsPDF(p, bingoTitle, bingoSubtitle);
        const url = `https://web.whatsapp.com/send?phone=${p.phone.replace(/\D/g, '')}&text=${encodeURIComponent(`Hola ${p.name}, adjuntamos tus cartones para jugar en Bingo Virtual,\nBuena suerte! 🍀`)}`;
        window.open(url);
    };

    const handleBuyCards = () => {
        if (!canPurchaseCards) {
            showAlert({ title: 'Precio no disponible', message: 'Consulta con el administrador para habilitar las compras.', type: 'info' });
            return;
        }
        if (!activeRoomId) {
            showAlert({ title: 'Sala no disponible', message: 'No se encontró la sala actual para vincular los cartones.', type: 'warning' });
            return;
        }
        setShowBuyModal(true);
    };

    const executeBuyCards = async (quantity: number) => {
        if (!currentUser?.userId) {
            showAlert({ title: 'Sesión inválida', message: 'No encontramos tu usuario. Vuelve a iniciar sesión.', type: 'danger' });
            return;
        }
        if (!sheetUrl) {
            showAlert({ title: 'Sin conexión', message: 'Configura la conexión con Google Sheets antes de comprar.', type: 'warning' });
            return;
        }
        if (!activeRoomId) {
            showAlert({ title: 'Sala no disponible', message: 'Necesitas ingresar desde una sala válida para comprar cartones.', type: 'danger' });
            return;
        }
        setIsProcessingPurchase(true);
        try {
            // Generate all cards data at once
            const cardsData = [];
            for (let i = 0; i < quantity; i++) {
                const numbers = generateBingoCardNumbers();
                const sheetNumbers = removeFreeSpace(numbers);
                cardsData.push({ numbers: sheetNumbers, roomId: activeRoomId });
            }

            // Create all cards in a single API call
            const response = await SheetAPI.createMultipleCards(sheetUrl, currentUser.userId, cardsData);
            
            if (!response.success) {
                throw new Error(response.message || 'No se pudieron crear los cartones');
            }

            // Refresh cards from server
            const latestCards = await refreshPlayerCards(activeRoomId);
            await persistPlayerParticipant(latestCards);

            const purchaseSummary = hasValidCardPrice
                ? `${quantity} cartones por ${formatCurrency(quantity * (cardPrice || 0))}`
                : `${quantity} cartones generados`;

            showAlert({
                title: 'Compra exitosa',
                message: `Listo, ${purchaseSummary}. Tus cartones ya están disponibles en tu perfil y panel.`,
                type: 'success'
            });
            setShowBuyModal(false);
        } catch (error) {
            console.error('Error buying cards', error);
            showAlert({ title: 'Error', message: 'No pudimos procesar la compra. Intenta nuevamente.', type: 'danger' });
        } finally {
            setIsProcessingPurchase(false);
        }
    };

    const handleUpdateRoomData = async (data: { name: string; pricePerCard: number; password?: string }) => {
        if (!sheetUrl || !activeRoomId) {
            showAlert({
                title: 'Error',
                message: 'No se pudo identificar la sala o la conexión.',
                type: 'danger'
            });
            return;
        }

        setIsUpdatingRoom(true);
        try {
            const response = await SheetAPI.updateRoom(sheetUrl, activeRoomId, data);
            
            if (response.success) {
                // Update local roomData state immediately
                const updatedRoomData = {
                    ...roomData,
                    name: data.name,
                    pricePerCard: data.pricePerCard,
                    password: data.password,
                    isPrivate: !!data.password // Update isPrivate based on password
                };
                setRoomData(updatedRoomData);
                
                // Notify parent component (PlayerDashboard) of the update
                if (onRoomUpdate) {
                    onRoomUpdate(updatedRoomData);
                }
                
                showAlert({
                    title: 'Sala actualizada',
                    message: `Los datos de la sala "${data.name}" se han actualizado correctamente.`,
                    type: 'success'
                });
                setShowEditRoomModal(false);
            } else {
                throw new Error(response.message || 'Error al actualizar la sala');
            }
        } catch (error) {
            console.error('Error updating room', error);
            showAlert({
                title: 'Error',
                message: error instanceof Error ? error.message : 'No se pudieron actualizar los datos de la sala.',
                type: 'danger'
            });
        } finally {
            setIsUpdatingRoom(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative">
            <div
                className={`fixed inset-0 bg-black/70 backdrop-blur-[2px] z-[90] transition-opacity duration-300 ${showSidebar ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setShowSidebar(false)}
            />

            {isMaster && (
                <aside
                    className={`fixed top-0 left-0 h-full w-full sm:w-[450px] bg-slate-900/95 border-r border-slate-800 shadow-2xl z-[100] transform transition-transform duration-300 ease-out overflow-y-auto custom-scrollbar p-4 flex flex-col gap-6 ${showSidebar ? 'translate-x-0' : '-translate-x-full'}`}
                >
                    <div className="flex justify-between items-center pb-2 border-b border-slate-800/50 flex-shrink-0">
                        <h3 className="font-bold text-white flex items-center gap-2 text-lg">
                            <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-lg shadow-cyan-500/50"></div>
                            Menú de Gestión
                        </h3>
                        <button onClick={() => setShowSidebar(false)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                            <PanelLeftOpen className="rotate-180" size={22} />
                        </button>
                    </div>

                    <div className="flex-1 flex flex-col gap-6 min-h-0">
                        <RegistrationPanel
                            onRegister={handleRegister}
                            onImport={handleImport}
                            onExport={() => exportToExcel(participants)}
                            onGenerateAllImages={() => downloadAllCardsZip(participants, bingoTitle, bingoSubtitle)}
                            totalParticipants={participants.length}
                            totalCards={totalCards}
                        />

                        <PrizesPanel
                            prizes={prizes}
                            onAddPrize={handleAddPrize}
                            onEditPrize={handleEditPrize}
                            onRemovePrize={handleRemovePrize}
                            onTogglePrize={handleTogglePrize}
                        />
                    </div>
                </aside>
            )}

            <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-4">
                    {isMaster && (
                        <button
                            onClick={() => setShowSidebar(!showSidebar)}
                            className={`p-1.5 rounded-lg transition-colors border ${
                                showSidebar 
                                    ? 'border-cyan-500/50 bg-cyan-900/30 text-cyan-400' 
                                    : 'border-slate-700 bg-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30'
                            }`}
                            title={showSidebar ? "Cerrar menú de gestión" : "Abrir menú de gestión"}
                        >
                            <PanelLeftOpen size={20} className={showSidebar ? '' : 'rotate-180'} />
                        </button>
                    )}

                    <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                            <h1 className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600 leading-none uppercase">
                                {bingoTitle}
                            </h1>
                            <span className="text-[10px] text-slate-500 font-medium leading-tight">{bingoSubtitle}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Admin Controls */}
                    {userRole === 'admin' && (
                        <div className="hidden md:flex items-center gap-2">
                            <button
                                onClick={() => setShowConnectionModal(true)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${sheetUrl ? (isSyncing ? 'bg-amber-900/30 text-amber-400 border-amber-500/50' : 'bg-emerald-900/30 text-emerald-400 border-emerald-500/50') : 'bg-slate-800 text-slate-500 border-slate-700 hover:bg-slate-700'}`}
                                title={sheetUrl ? "Conectado a Google Sheets" : "Configurar Nube"}
                            >
                                {isSyncing ? <Loader2 size={14} className="animate-spin" /> : (autoSync ? <Zap size={14} className="text-yellow-400 fill-yellow-400" /> : <Cloud size={14} />)}
                                <span className="hidden lg:inline">{sheetUrl ? (isSyncing ? 'Sincronizando...' : (autoSync ? 'Auto-Sync ON' : 'Online')) : 'Offline'}</span>
                            </button>

                            {sheetUrl && !isSyncing && (
                                <button
                                    onClick={() => loadFromCloud(false)}
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-emerald-400 border border-slate-700"
                                    title="Sincronizar ahora"
                                >
                                    <RefreshCw size={16} />
                                </button>
                            )}

                            <button 
                                onClick={() => setShowTitleModal(true)} 
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
                                title="Editar título"
                            >
                                <Edit size={18} />
                            </button>

                            <div className="w-px h-6 bg-slate-700"></div>
                        </div>
                    )}

                    {/* Player Buy Button */}
                    {canPurchaseCards && (
                        <button
                            onClick={handleBuyCards}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-200 border border-emerald-500/40 hover:bg-emerald-600/30 text-xs font-semibold transition-all"
                            title="Comprar cartones"
                        >
                            <ShoppingCart size={16} />
                            <span className="hidden sm:inline">Comprar cartón ({formatCurrency(cardPrice || 0)})</span>
                            <span className="sm:hidden">Comprar</span>
                        </button>
                    )}

                    {/* View Controls */}
                    <button 
                        onClick={toggleFullScreen} 
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all"
                        title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
                    >
                        {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>

                    {/* Exit Room Button */}
                    {onExitRoom && (
                        <>
                            <div className="w-px h-6 bg-slate-700"></div>
                            <button
                                onClick={onExitRoom}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-900/20 hover:bg-amber-900/30 text-amber-300 border border-amber-700/40 text-xs font-medium transition-all"
                                title="Salir de esta sala"
                            >
                                <DoorOpen size={16} />
                                <span className="hidden sm:inline">Salir de Sala</span>
                            </button>
                        </>
                    )}
                </div>
            </header>

            <main className="flex-1 p-4 max-w-[1920px] mx-auto w-full grid grid-cols-1 gap-4 transition-all duration-300 items-start xl:grid-cols-[1fr_400px] 2xl:grid-cols-[1fr_500px]">
                <section className="flex flex-col gap-4">
                    <GamePanel
                        drawnBalls={gameState.drawnBalls}
                        onDrawBall={handleDrawBall}
                        onReset={handleReset}
                        historyLog={gameState.history}
                        hasParticipants={participants.length > 0}
                        currentPattern={gameState.selectedPattern}
                        onPatternChange={handlePatternChange}
                        prizes={prizes}
                        onTogglePrize={handleTogglePrize}
                        roundLocked={gameState.roundLocked || false}
                        isPaused={gameState.isPaused}
                        canControlGame={isMaster}
                        roomName={roomData?.name}
                        masterName={roomData?.adminName || 'Admin'}
                        onEditRoom={() => setShowEditRoomModal(true)}
                        isMaster={isMaster}
                        userRole={userRole}
                    />
                </section>

                <aside className="flex flex-col gap-4">
                    <ParticipantsPanel
                        participants={participants}
                        drawnBalls={gameState.drawnBalls}
                        winners={winners}
                        onAddCard={handleAddCard}
                        onDeleteCard={handleDeleteCard}
                        onDownloadCard={handleDownloadCard}
                        onEditParticipant={handleEditParticipant}
                        onDeleteParticipant={handleDeleteParticipant}
                        onDeleteAllParticipants={handleDeleteAllParticipants}
                        currentPattern={gameState.selectedPattern}
                        onShareCard={handleShareCard}
                        onShareAllCards={handleShareAllCards}
                        prizes={prizes}
                        totalCards={totalCards}
                        userRole={isMaster || userRole === 'admin' ? 'admin' : 'player'}
                        currentUser={currentUser}
                    />
                </aside>
            </main>

            {/* Modals */}
            {currentBatchWinners.length > 0 && (
                <WinnerModal
                    winners={currentBatchWinners}
                    onClose={() => setCurrentBatchWinners([])}
                    onRejectWinner={handleRejectWinner}
                    onViewDetails={handleViewDetailsFromSummary}
                    onConfirmRound={handleConfirmRound}
                />
            )}

            {viewingDetailsData && (
                <WinnerDetailsModal
                    winner={viewingDetailsData.winner}
                    participant={viewingDetailsData.participant}
                    card={viewingDetailsData.card}
                    onClose={() => setViewingDetailsData(null)}
                    drawnBalls={gameState.drawnBalls}
                    onDeleteCard={handleDeleteCard}
                    onDownloadCard={handleDownloadCard}
                    onShareCard={(cardId) => handleShareCard(viewingDetailsData.participant, cardId)}
                    prizes={prizes}
                    allWinners={winners}
                    currentPattern={gameState.selectedPattern}
                    userRole={isMaster ? 'admin' : 'player'}
                />
            )}

            {showTitleModal && (
                <EditTitleModal
                    currentTitle={bingoTitle}
                    currentSubtitle={bingoSubtitle}
                    onSave={(t, s) => {
                        setBingoTitle(t);
                        setBingoSubtitle(s);
                        setShowTitleModal(false);
                    }}
                    onClose={() => setShowTitleModal(false)}
                />
            )}

            {showConnectionModal && (
                <ConnectionModal
                    currentUrl={sheetUrl}
                    currentAutoSync={autoSync}
                    currentInterval={syncInterval}
                    onSave={(url, newAutoSync, newInterval) => {
                        setSheetUrl(url);
                        setAutoSync(newAutoSync);
                        setSyncInterval(newInterval);
                        if (url && isMaster) loadFromCloud();
                    }}
                    onClose={() => setShowConnectionModal(false)}
                    onSyncNow={() => loadFromCloud(false)}
                />
            )}

            {canPurchaseCards && showBuyModal && (
                <BuyCardsModal
                    onClose={() => setShowBuyModal(false)}
                    onBuy={executeBuyCards}
                    isLoading={isProcessingPurchase}
                    pricePerCard={cardPrice}
                />
            )}

            {showEditRoomModal && roomData && (
                <EditRoomModal
                    currentRoomName={roomData.name || ''}
                    currentPrice={cardPrice || 0}
                    currentPassword={roomData.password}
                    onClose={() => setShowEditRoomModal(false)}
                    onSave={handleUpdateRoomData}
                    isLoading={isUpdatingRoom}
                />
            )}
        </div>
    );
};

export default GameRoom;
