'use client';

import { ReactQueryProvider } from './react-query-provider';

interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers = ({ children }: ProvidersProps) => {
  return <ReactQueryProvider>{children}</ReactQueryProvider>;
};
