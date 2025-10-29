/**
 * Daily Notes / Scratchpad Management
 * Handles the persistent scratchpad notes that stay visible until marked complete
 */

export interface DailyNote {
  id: string;
  content: string;
  createdAt: string;
  completedAt?: string;
}

export interface ArchivedNote {
  id: string;
  content: string;
  createdAt: string;
  completedAt: string;
}

const CURRENT_NOTE_KEY = 'trading_journal_current_note';
const ARCHIVED_NOTES_KEY = 'trading_journal_archived_notes';

export function loadCurrentNote(): DailyNote | null {
  try {
    const stored = localStorage.getItem(CURRENT_NOTE_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load current note:', error);
    return null;
  }
}

export function saveCurrentNote(note: DailyNote): void {
  try {
    localStorage.setItem(CURRENT_NOTE_KEY, JSON.stringify(note));
  } catch (error) {
    console.error('Failed to save current note:', error);
  }
}

export function clearCurrentNote(): void {
  try {
    localStorage.removeItem(CURRENT_NOTE_KEY);
  } catch (error) {
    console.error('Failed to clear current note:', error);
  }
}

export function loadArchivedNotes(): ArchivedNote[] {
  try {
    const stored = localStorage.getItem(ARCHIVED_NOTES_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load archived notes:', error);
    return [];
  }
}

export function saveArchivedNotes(notes: ArchivedNote[]): void {
  try {
    localStorage.setItem(ARCHIVED_NOTES_KEY, JSON.stringify(notes));
  } catch (error) {
    console.error('Failed to save archived notes:', error);
  }
}

export function archiveCurrentNote(note: DailyNote): ArchivedNote[] {
  const archivedNote: ArchivedNote = {
    ...note,
    completedAt: new Date().toISOString(),
  };
  
  const archived = loadArchivedNotes();
  const updated = [archivedNote, ...archived];
  saveArchivedNotes(updated);
  clearCurrentNote();
  
  return updated;
}

export function createNewNote(content: string = ''): DailyNote {
  return {
    id: `note_${Date.now()}`,
    content,
    createdAt: new Date().toISOString(),
  };
}

export function updateNoteContent(note: DailyNote, content: string): DailyNote {
  return {
    ...note,
    content,
  };
}

export function deleteArchivedNote(noteId: string): ArchivedNote[] {
  const archived = loadArchivedNotes();
  const updated = archived.filter(n => n.id !== noteId);
  saveArchivedNotes(updated);
  return updated;
}
