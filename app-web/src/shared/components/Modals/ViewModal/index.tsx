'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Dialog, IconButton, Tooltip } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { CacheProvider, EmotionCache } from '@emotion/react';
import createCache from '@emotion/cache';
import { FiExternalLink, FiX } from 'react-icons/fi';
import { Card, PageContainer } from '@/shared/components/Containers';
import { Title } from '@/shared/components/Texts';
import { theme } from '@/providers/mui-theme-provider';
import { APP_COLORS } from '@/shared/constants';
import { showToast } from '@/shared/util';

export interface ViewModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /**
   * 'wide' para conteúdos extensos, onde o Card ocupa uma largura maior.
   * Default: 'default' (coluna única).
   */
  size?: 'default' | 'wide';
}

const POPUP_FEATURES = 'popup=yes,width=1200,height=860,resizable=yes,scrollbars=yes';
const POPUP_CLOSED_POLL_INTERVAL_MS = 500;

export const ViewModal = ({
  open,
  onClose,
  title,
  children,
  size = 'default',
}: ViewModalProps) => {
  const [isPoppedOut, setIsPoppedOut] = useState(false);
  const [popupContainer, setPopupContainer] = useState<HTMLDivElement | null>(
    null,
  );

  const popupWindowRef = useRef<Window | null>(null);
  const emotionCacheRef = useRef<EmotionCache | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const openRef = useRef(open);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const handlePopupClosed = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    popupWindowRef.current = null;
    emotionCacheRef.current = null;
    setPopupContainer(null);
    setIsPoppedOut(false);

    if (openRef.current) {
      onClose();
    }
  };

  const handlePopOut = () => {
    if (popupWindowRef.current && !popupWindowRef.current.closed) {
      popupWindowRef.current.focus();
      return;
    }

    const popupWindow = window.open('', '_blank', POPUP_FEATURES);

    if (!popupWindow) {
      showToast({
        type: 'error',
        message:
          'Não foi possível abrir a janela em destaque. Verifique se o navegador está bloqueando pop-ups.',
      });
      return;
    }

    popupWindow.document.title = title;
    popupWindow.document.documentElement.className =
      document.documentElement.className;

    document.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
      popupWindow.document.head.appendChild(node.cloneNode(true));
    });

    popupWindow.document.body.style.margin = '0';

    const container = popupWindow.document.createElement('div');
    container.style.height = '100vh';
    popupWindow.document.body.appendChild(container);

    emotionCacheRef.current = createCache({
      key: 'view-modal-popup',
      container: popupWindow.document.head,
    });

    popupWindowRef.current = popupWindow;
    setPopupContainer(container);
    setIsPoppedOut(true);

    popupWindow.addEventListener('beforeunload', handlePopupClosed);

    pollIntervalRef.current = setInterval(() => {
      if (popupWindow.closed) {
        handlePopupClosed();
      }
    }, POPUP_CLOSED_POLL_INTERVAL_MS);
  };

  useEffect(() => {
    if (!open && popupWindowRef.current && !popupWindowRef.current.closed) {
      popupWindowRef.current.close();
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }

      if (popupWindowRef.current && !popupWindowRef.current.closed) {
        popupWindowRef.current.close();
      }
    };
  }, []);

  const popupPortal =
    isPoppedOut && popupContainer && emotionCacheRef.current
      ? createPortal(
          <CacheProvider value={emotionCacheRef.current}>
            <ThemeProvider theme={theme}>
              <PageContainer className="!h-screen !w-screen !rounded-none !border-0">
                <Title component="h2" sx={{ textAlign: 'left', marginBottom: '20px' }}>
                  {title}
                </Title>
                {children}
              </PageContainer>
            </ThemeProvider>
          </CacheProvider>,
          popupContainer,
        )
      : null;

  return (
    <>
      {!isPoppedOut && (
        <Dialog
          open={open}
          onClose={onClose}
          maxWidth={false}
          slotProps={{
            paper: {
              className: 'bg-transparent shadow-none m-4',
            },
          }}
        >
          <Card sizeClassName={size === 'wide' ? 'w-[min(1152px,92vw)]' : undefined}>
            <div className="absolute top-3 right-3 flex items-center gap-1">
              <Tooltip title="Abrir em nova janela">
                <IconButton
                  aria-label="Abrir em nova janela"
                  onClick={handlePopOut}
                  size="small"
                  sx={{
                    padding: '2px',
                    color: APP_COLORS.goldDark,
                    '&:hover': { color: APP_COLORS.gold },
                  }}
                >
                  <FiExternalLink style={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>

              <button
                type="button"
                aria-label="Fechar"
                onClick={onClose}
                className="cursor-pointer text-gold-dark hover:text-gold"
                style={{ fontSize: 20, lineHeight: 0 }}
              >
                <FiX />
              </button>
            </div>

            <Title component="h2" sx={{ marginBottom: '20px' }}>
              {title}
            </Title>

            {children}
          </Card>
        </Dialog>
      )}

      {popupPortal}
    </>
  );
};
