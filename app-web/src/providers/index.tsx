'use client';

import { ReactQueryProvider } from './react-query-provider';
import { MuiThemeProvider } from './mui-theme-provider';

interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers = ({ children }: ProvidersProps) => {
  return (
    <MuiThemeProvider>
      <ReactQueryProvider>{children}</ReactQueryProvider>
    </MuiThemeProvider>
  );
};
