'use client';

import { useState } from 'react';
import { Box } from '@mui/material';
import { Header } from '../Header';
import { Sidebar } from '../Sidebar';

interface AuthorizedShellProps {
  children: React.ReactNode;
}

export const AuthorizedShell = ({ children }: AuthorizedShellProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <Box
      sx={{
        position: 'relative',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Header onToggleSidebar={() => setIsSidebarOpen((current) => !current)} />

      <Box sx={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <Sidebar isOpen={isSidebarOpen} />

        <Box
          component="main"
          sx={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            position: 'relative',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};
