'use client';

import { WorkspaceProvider, useWorkspace } from '@/lib/workspace-context';
import { LeftPanel } from '@/components/LeftPanel';
import { MiddleCanvas } from '@/components/MiddleCanvas';
import { RightChat } from '@/components/RightChat';

function MainContent() {
  const { isDarkMode } = useWorkspace();
  return (
    <div className={`flex h-screen w-screen overflow-hidden font-sans transition-colors ${isDarkMode ? 'dark text-slate-100 bg-slate-900' : 'text-slate-900 bg-slate-100'}`}>
      <LeftPanel />
      <MiddleCanvas />
      <RightChat />
    </div>
  );
}

export default function Home() {
  return (
    <WorkspaceProvider>
      <MainContent />
    </WorkspaceProvider>
  );
}
