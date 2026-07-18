'use client';

import { ReactQueryProvider } from './react-query-provider';
import { MuiThemeProvider } from './mui-theme-provider';
import { AppGoogleOAuthProvider } from './google-oauth-provider';

interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers = ({ children }: ProvidersProps) => {
  return (
    <MuiThemeProvider>
      <AppGoogleOAuthProvider>
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </AppGoogleOAuthProvider>
    </MuiThemeProvider>
  );
};
