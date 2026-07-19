'use client';

import { ReactNode } from 'react';
import { Dialog } from '@mui/material';
import { FiX } from 'react-icons/fi';
import { Card } from '@/shared/components/Containers';
import { Title } from '@/shared/components/Texts';

export interface FormModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /**
   * 'wide' para formulários com mais de 4 campos ou com FormRichTextInput,
   * onde os campos são organizados em grid (4 colunas para inputs padrão,
   * 2 colunas para FormRichTextInput). Default: 'default' (coluna única).
   */
  size?: 'default' | 'wide';
}

export const FormModal = ({
  open,
  onClose,
  title,
  children,
  size = 'default',
}: FormModalProps) => {
  return (
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
        <button
          type="button"
          aria-label="Fechar"
          onClick={onClose}
          className="absolute top-3 right-3 cursor-pointer text-gold-dark hover:text-gold"
          style={{ fontSize: 20, lineHeight: 0 }}
        >
          <FiX />
        </button>

        <Title component="h2" sx={{ marginBottom: '20px' }}>
          {title}
        </Title>

        {children}
      </Card>
    </Dialog>
  );
};
