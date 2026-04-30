'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useWorkspace, NoteCategory } from '@/lib/workspace-context';
import { Plus, Trash2, Edit2, Check, X, FileText, UserSquare2, Map, LayoutTemplate, Download, Save, Settings2, Trash, MoreVertical, Moon, Sun } from 'lucide-react';

export function LeftPanel() {
  const { notes, canvasItems, addNote, updateNote, deleteNote, saveWorkspace, clearWorkspace, isDarkMode, toggleDarkMode } = useWorkspace();
  const [activeTab, setActiveTab] = useState<NoteCategory>('Character');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
        setDeleteConfirm(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSave = () => {
    saveWorkspace();
    setIsMenuOpen(false);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2500);
  };

  const handleDelete = () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      setTimeout(() => setDeleteConfirm(false), 3000);
      return;
    }
    clearWorkspace();
    setDeleteConfirm(false);
    setIsMenuOpen(false);
  };

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const filteredNotes = notes.filter(n => n.category === activeTab);

  const handleAdd = () => {
    if (title.trim()) {
      addNote({ title, content, category: activeTab });
      setIsAdding(false);
      setTitle('');
      setContent('');
    }
  };

  const handleUpdate = (id: string) => {
    if (title.trim()) {
      updateNote(id, { title, content });
      setEditingId(null);
      setTitle('');
      setContent('');
    }
  };

  const startEdit = (note: any) => {
    setEditingId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setIsAdding(false);
  };

  const cancelForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setTitle('');
    setContent('');
  };

  const exportScript = () => {
    let output = "# Story Reference\n\n";
    
    const categories: NoteCategory[] = ['Plot', 'Character', 'Location', 'Other'];
    categories.forEach(cat => {
      const catNotes = notes.filter(n => n.category === cat);
      if (catNotes.length > 0) {
        output += `## ${cat}\n\n`;
        catNotes.forEach(n => {
          output += `### ${n.title}\n${n.content}\n\n`;
        });
      }
    });

    output += "# Chapter / Panels\n\n";
    
    // Sort canvas items top-down, left-right
    const sortedPanels = [...canvasItems].sort((a, b) => {
      // Rough row grouping
      if (Math.abs(a.y - b.y) > 50) {
        return a.y - b.y;
      }
      return a.x - b.x;
    });

    sortedPanels.forEach((item, index) => {
      output += `**Panel ${index + 1} (${item.type})**\n${item.content || '(Empty)'}\n\n`;
    });

    const blob = new Blob([output], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'story_script.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsMenuOpen(false);
  };

  const Tabs: { val: NoteCategory; icon: React.ReactNode }[] = [
    { val: 'Character', icon: <UserSquare2 size={16} /> },
    { val: 'Plot', icon: <FileText size={16} /> },
    { val: 'Location', icon: <Map size={16} /> },
    { val: 'Other', icon: <LayoutTemplate size={16} /> },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 h-full relative">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Manga Studio Logo" className="w-6 h-6 object-contain rounded-sm" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Story Reference</h2>
        </div>
        
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => { setIsMenuOpen(!isMenuOpen); setDeleteConfirm(false); }}
            className={`p-1.5 rounded-md transition-colors ${isMenuOpen ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            title="Project Options"
          >
            <Settings2 size={16} />
          </button>
          
          {isMenuOpen && (
            <div className="absolute left-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden text-[12px] font-medium text-slate-700 dark:text-slate-300">
              <button 
                onClick={() => { toggleDarkMode(); setIsMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left"
              >
                {isDarkMode ? <Sun size={14} className="text-slate-400" /> : <Moon size={14} className="text-slate-400" />} {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </button>
              <button 
                onClick={handleSave}
                className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left"
              >
                <Save size={14} className="text-slate-400" /> Save project
              </button>
              <button 
                onClick={exportScript}
                className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left"
              >
                <Download size={14} className="text-slate-400" /> Export script
              </button>
              <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
              <button 
                onClick={handleDelete}
                className={`w-full flex items-center gap-2 px-3 py-2.5 transition-colors text-left ${deleteConfirm ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50' : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-red-500'}`}
              >
                <Trash size={14} className={deleteConfirm ? "text-red-500" : "text-red-400"} /> 
                {deleteConfirm ? 'Click again to confirm' : 'Clear project'}
              </button>
            </div>
          )}
        </div>
      </div>

      {showSavedToast && (
        <div className="absolute top-14 left-4 bg-indigo-600 border border-indigo-500 text-white px-4 py-2.5 rounded-lg shadow-lg text-xs font-bold tracking-wide z-50 pointer-events-none transition-all duration-300">
          Project saved locally!
        </div>
      )}

      <nav className="flex border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold overflow-x-auto">
        {Tabs.map(tab => (
          <button
            key={tab.val}
            onClick={() => setActiveTab(tab.val)}
            className={`flex-1 py-3 px-2 flex flex-col items-center justify-center gap-1 border-b-2 transition-colors ${
              activeTab === tab.val 
                ? 'border-indigo-500 bg-slate-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-400' 
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {tab.icon}
            <span>{tab.val}</span>
          </button>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {isAdding ? (
          <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
            <input
              type="text"
              placeholder="Title"
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-[11px] focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200"
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
            />
            <textarea
              placeholder="Content..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-[11px] h-24 resize-none focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200"
              value={content}
              onChange={e => setContent(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button onClick={cancelForm} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400"><X size={14} /></button>
              <button onClick={handleAdd} className="p-1.5 bg-indigo-600 hover:bg-indigo-700 rounded text-white"><Check size={14} /></button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => { setIsAdding(true); setEditingId(null); setTitle(''); setContent(''); }}
            className="w-full py-2 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 text-[11px] font-semibold"
          >
            <Plus size={14} /> New {activeTab}
          </button>
        )}

        <div className="space-y-3 mt-4">
          {filteredNotes.map(note => (
            <div key={note.id} className="group p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-md transition-shadow relative">
              {editingId === note.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-[11px] focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                  />
                  <textarea
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-[11px] h-24 resize-none focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={cancelForm} className="p-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"><X size={14} /></button>
                    <button onClick={() => handleUpdate(note.id)} className="p-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"><Check size={14} /></button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start pr-8">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 break-words">{note.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 whitespace-pre-wrap break-words leading-relaxed">{note.content}</p>
                  
                  <div className="absolute top-2 right-2 flex gap-1 transition-opacity bg-white/80 dark:bg-slate-800/80 rounded-sm">
                    <button onClick={() => startEdit(note)} className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded"><Edit2 size={12} /></button>
                    <button onClick={() => deleteNote(note.id)} className="p-1 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded"><Trash2 size={12} /></button>
                  </div>
                </>
              )}
            </div>
          ))}
          {filteredNotes.length === 0 && !isAdding && (
            <div className="text-center py-8 text-slate-400 text-[11px]">
              No {activeTab} notes.
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
