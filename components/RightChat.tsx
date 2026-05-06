'use client';

import React from 'react';
import { Bot } from 'lucide-react';

export function RightChat() {
  return (
    <aside className="w-72 bg-slate-900 flex flex-col text-slate-300 shrink-0 h-full">
      <div className="p-4 border-b border-slate-800 flex items-center space-x-2 opacity-50">
        <div className="w-2 h-2 rounded-full bg-slate-500"></div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Assistant Editor</h2>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center opacity-50">
        <Bot size={48} className="mb-4 text-slate-600" />
        <h3 className="text-lg font-medium text-slate-400 mb-2">AI Assistant</h3>
        <p className="text-xs text-slate-500">
          The AI Assistant feature is coming soon.
        </p>
      </div>
    </aside>
  );
}
