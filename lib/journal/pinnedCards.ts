/**
 * Pinned Cards Management
 * Handles saving/loading pinned benchmark cards to localStorage
 */

export type BenchmarkType = 'quarterly' | 'weekly' | 'alltime';

export interface PinnedCard {
  id: string;
  type: BenchmarkType;
  label: string;
  period: string; // e.g., "Q1", "Week 1", "2024"
  pinnedAt: string; // ISO timestamp
}

const STORAGE_KEY = 'trading_journal_pinned_cards';

export function loadPinnedCards(): PinnedCard[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load pinned cards:', error);
    return [];
  }
}

export function savePinnedCards(cards: PinnedCard[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  } catch (error) {
    console.error('Failed to save pinned cards:', error);
  }
}

export function pinCard(card: Omit<PinnedCard, 'pinnedAt'>): PinnedCard[] {
  const cards = loadPinnedCards();
  
  // Check if already pinned
  const existingIndex = cards.findIndex(c => c.id === card.id);
  if (existingIndex >= 0) {
    return cards; // Already pinned
  }
  
  const newCard: PinnedCard = {
    ...card,
    pinnedAt: new Date().toISOString(),
  };
  
  const updatedCards = [...cards, newCard];
  savePinnedCards(updatedCards);
  return updatedCards;
}

export function unpinCard(cardId: string): PinnedCard[] {
  const cards = loadPinnedCards();
  const updatedCards = cards.filter(c => c.id !== cardId);
  savePinnedCards(updatedCards);
  return updatedCards;
}

export function isCardPinned(cardId: string): boolean {
  const cards = loadPinnedCards();
  return cards.some(c => c.id === cardId);
}

export function togglePin(card: Omit<PinnedCard, 'pinnedAt'>): PinnedCard[] {
  if (isCardPinned(card.id)) {
    return unpinCard(card.id);
  } else {
    return pinCard(card);
  }
}
