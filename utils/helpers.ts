import { Participant, Winner } from '../types.ts';

export const generateUniqueRandomNumbers = (count: number, min: number, max: number): number[] => {
  const nums = new Set<number>();
  while (nums.size < count) {
    nums.add(Math.floor(Math.random() * (max - min + 1)) + min);
  }
  return Array.from(nums).sort((a, b) => a - b);
};

export const generateId = (prefix: string = ''): string => {
  return `${prefix}${Date.now().toString(36).slice(-4)}${Math.random().toString(36).slice(-4)}`.toUpperCase();
};

export const checkWinners = (participants: Participant[], drawnBalls: number[], existingWinners: Winner[]): Winner[] => {
  const newWinners: Winner[] = [];
  
  // La bolilla ganadora es la última que se añadió a la lista
  const winningBall = drawnBalls[drawnBalls.length - 1];
  
  participants.forEach(p => {
    p.cards.forEach(c => {
      // Check if card has all numbers in drawnBalls
      const hasAll = c.numbers.every(n => drawnBalls.includes(n));
      
      if (hasAll) {
        // Check if already recorded as winner
        const isAlreadyWinner = existingWinners.some(w => w.cardId === c.id);
        
        if (!isAlreadyWinner) {
          newWinners.push({
            participantId: p.id,
            participantName: `${p.name} ${p.surname}`,
            cardId: c.id,
            timestamp: Date.now(),
            winningNumber: winningBall
          });
        }
      }
    });
  });
  
  return newWinners;
};