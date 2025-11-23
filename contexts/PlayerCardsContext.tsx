import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CartonData } from '../types.ts';
import { SheetAPI } from '../services/googleSheetService.ts';

interface PlayerCardsContextValue {
    cards: CartonData[];
    isLoading: boolean;
    lastUpdated: number;
    refreshCards: () => Promise<CartonData[]>;
    setCards: (nextCards: CartonData[]) => void;
}

const PlayerCardsContext = createContext<PlayerCardsContextValue | undefined>(undefined);

interface PlayerCardsProviderProps {
    sheetUrl?: string;
    userId?: string | null;
    children: React.ReactNode;
}

export const PlayerCardsProvider: React.FC<PlayerCardsProviderProps> = ({ sheetUrl, userId, children }) => {
    const [cards, setCardsState] = useState<CartonData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<number>(0);

    const effectiveUserId = useMemo(() => userId || undefined, [userId]);

    const refreshCards = useCallback(async (): Promise<CartonData[]> => {
        if (!sheetUrl || !effectiveUserId) {
            setCardsState([]);
            setLastUpdated(Date.now());
            return [];
        }

        setIsLoading(true);
        try {
            const response = await SheetAPI.getUserCards(sheetUrl, effectiveUserId);
            const nextCards = response.success && Array.isArray(response.cards) ? response.cards : [];
            setCardsState(nextCards);
            setLastUpdated(Date.now());
            return nextCards;
        } catch (error) {
            console.error('Error refreshing player cards', error);
            setCardsState([]);
            setLastUpdated(Date.now());
            return [];
        } finally {
            setIsLoading(false);
        }
    }, [sheetUrl, effectiveUserId]);

    const setCards = useCallback((nextCards: CartonData[]) => {
        setCardsState(nextCards);
        setLastUpdated(Date.now());
    }, []);

    useEffect(() => {
        refreshCards();
    }, [refreshCards]);

    const value = useMemo<PlayerCardsContextValue>(() => ({
        cards,
        isLoading,
        lastUpdated,
        refreshCards,
        setCards
    }), [cards, isLoading, lastUpdated, refreshCards, setCards]);

    return (
        <PlayerCardsContext.Provider value={value}>
            {children}
        </PlayerCardsContext.Provider>
    );
};

export const usePlayerCards = (): PlayerCardsContextValue => {
    const context = useContext(PlayerCardsContext);
    if (!context) {
        throw new Error('usePlayerCards must be used within PlayerCardsProvider');
    }
    return context;
};
