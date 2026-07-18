'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';
import { NEXT_PUBLIC_GOOGLE_CLIENT_ID } from '@/shared/constants';

interface AppGoogleOAuthProviderProps {
  children: React.ReactNode;
}

export const AppGoogleOAuthProvider = ({
  children,
}: AppGoogleOAuthProviderProps) => {
  return (
    <GoogleOAuthProvider clientId={NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ''}>
      {children}
    </GoogleOAuthProvider>
  );
};
