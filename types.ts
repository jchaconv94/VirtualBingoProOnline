export interface BingoCard {
  id: string;
  numbers: number[];
}

export interface Participant {
  id: string;
  name: string;
  surname: string;
  dni: string;
  phone?: string;
  cards: BingoCard[];
}

export interface Winner {
  participantId: string;
  participantName: string;
  cardId: string;
  timestamp: number;
  winningNumber: number;
}

export interface GameState {
  drawnBalls: number[];
  history: string[];
  lastCardSequence: number;
}

export const TOTAL_BALLS = 75;
export const CARDS_PER_USER_LIMIT = 10;
export const NUMBERS_PER_CARD = 10;