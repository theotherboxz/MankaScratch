import { createContext, useContext, useState, ReactNode } from 'react';

export type NoteCategory = 'Character' | 'Plot' | 'Location' | 'Other';

export interface StrokePoint {
  x: number;
  y: number;
}

export interface Stroke {
  id: string;
  points: StrokePoint[];
  tool: 'pen' | 'eraser' | 'marker' | 'dashed';
  color: string;
  size: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  category: NoteCategory;
  updatedAt: Date;
}

export interface CanvasItem {
  id: string;
  type: 'panel' | 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  pageIndex?: number;
  strokes?: Stroke[];
  zIndex?: number;
}

interface WorkspaceContextType {
  notes: Note[];
  canvasItems: CanvasItem[];
  addNote: (note: Omit<Note, 'id' | 'updatedAt'>) => string;
  updateNote: (id: string, note: Partial<Omit<Note, 'id' | 'updatedAt'>>) => void;
  deleteNote: (id: string) => void;
  addCanvasItem: (item: Omit<CanvasItem, 'id'>) => void;
  updateCanvasItem: (id: string, updates: Partial<Omit<CanvasItem, 'id'>>) => void;
  deleteCanvasItem: (id: string) => void;
  saveWorkspace: () => void;
  clearWorkspace: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('story_bible_notes');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('story_bible_canvas');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('story_bible_dark_mode') === 'true';
    } catch { return false; }
  });

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      try { localStorage.setItem('story_bible_dark_mode', String(next)); } catch {}
      return next;
    });
  };

  const saveWorkspace = () => {
    localStorage.setItem('story_bible_notes', JSON.stringify(notes));
    localStorage.setItem('story_bible_canvas', JSON.stringify(canvasItems));
  };

  const clearWorkspace = () => {
    setNotes([]);
    setCanvasItems([]);
    localStorage.removeItem('story_bible_notes');
    localStorage.removeItem('story_bible_canvas');
  };

  const addNote = (note: Omit<Note, 'id' | 'updatedAt'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotes(prev => [...prev, { ...note, id, updatedAt: new Date() }]);
    return id;
  };

  const updateNote = (id: string, noteUpdates: Partial<Omit<Note, 'id' | 'updatedAt'>>) => {
    setNotes(prev => prev.map(note => 
      note.id === id ? { ...note, ...noteUpdates, updatedAt: new Date() } : note
    ));
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  };

  const addCanvasItem = (item: Omit<CanvasItem, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setCanvasItems(prev => [...prev, { ...item, id }]);
  };

  const updateCanvasItem = (id: string, updates: Partial<Omit<CanvasItem, 'id'>>) => {
    setCanvasItems(prev => prev.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const deleteCanvasItem = (id: string) => {
    setCanvasItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <WorkspaceContext.Provider value={{
      notes, canvasItems, addNote, updateNote, deleteNote,
      addCanvasItem, updateCanvasItem, deleteCanvasItem,
      saveWorkspace, clearWorkspace,
      isDarkMode, toggleDarkMode,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
  } 
