
export interface BingoCard {
  id: string;
  numbers: number[]; // Array of 25 items (index 12 is 0/placeholder)
  isInvalid?: boolean; // New flag to mark void cards
}

// New interface for user data in restructured database
export interface UserData {
  idUser: string;
  nombreCompleto: string;
  email: string;
  telefono: string;
  usuario: string;
  rol: 'admin' | 'player';
  fechaRegistro: string;
}

// New interface for carton data in restructured database
export interface CartonData {
  idUser: string;
  idCarton: string;
  roomId?: string;
  numbers: number[]; // Array of 24 numbers (no free space in sheet)
}

export interface Participant {
  id: string;  // UUID
  userId?: string;  // UUID - Links to User (optional for backward compatibility)
  name: string;
  surname: string;
  dni: string;
  phone?: string;
  email?: string;  //User email for communication
  cards: BingoCard[];
  createdAt?: number;  // Timestamp for ordering by registration date
}

export interface Winner {
  participantId: string;
  participantName: string;
  cardId: string;
  timestamp: number;
  winningNumber: number;
  winningPattern?: PatternKey; // The pattern used when this win occurred
  drawnBalls?: number[]; // Snapshot of balls drawn at the moment of win
  cardSnapshot?: BingoCard; // Snapshot of the card layout at the moment of win
  // Snapshot of the prize won at that moment
  prizeId?: string;
  prizeName?: string;
  prizeDescription?: string;
  round?: number; // The game round index (1, 2, 3...) this win belongs to
}

export interface Prize {
  id: string;
  name: string;
  description: string; // e.g. "S/ 100.00"
  isAwarded: boolean;
}

export type PatternKey =
  | 'NONE'
  | 'FULL'
  | 'X'
  | 'L'
  | 'FRAME'
  | 'CORNERS'
  | 'LETTER_E'
  | 'LETTER_H'
  | 'CENTER'
  | 'LETTER_N'
  | 'LETTER_I'
  | 'LETTER_Z'
  | 'FRAME_SMALL'
  | 'CROSS'
  | 'DIAGONAL'
  | 'DIAMOND'
  | 'ARROW';

export interface WinPattern {
  key: PatternKey;
  label: string;
  indices: number[]; // Indices 0-24 required to win
}

export interface GameState {
  drawnBalls: number[];
  history: string[];
  // lastCardSequence removed - now using UUIDs for card IDs
  selectedPattern: PatternKey;
  roundLocked?: boolean;
  gameRound: number; // Tracks the current round sequence (increments on partial reset)
  isPaused: boolean; // New: allows admin actions during a game
}

export const TOTAL_BALLS = 75;
export const CARDS_PER_USER_LIMIT = 100;
export const NUMBERS_PER_CARD = 24; // 24 numbers + 1 free space