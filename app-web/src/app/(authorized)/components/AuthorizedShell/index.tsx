'use client';

import { useState } from 'react';
import { Header } from '../Header';
import { Sidebar } from '../Sidebar';

interface AuthorizedShellProps {
  children: React.ReactNode;
}

export const AuthorizedShell = ({ children }: AuthorizedShellProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden">
      <Header onToggleSidebar={() => setIsSidebarOpen((current) => !current)} />

      <div className="flex min-h-0 flex-1">
        <Sidebar isOpen={isSidebarOpen} />

        <main className="relative min-h-0 min-w-0 flex-1 p-8">{children}</main>
      </div>
    </div>
  );
};
