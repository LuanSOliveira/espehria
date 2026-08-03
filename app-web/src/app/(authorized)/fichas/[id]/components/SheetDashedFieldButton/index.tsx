'use client';

import { FiPlus } from 'react-icons/fi';
import { APP_COLORS } from '@/shared/constants';

export interface SheetDashedFieldButtonProps {
  label: string;
  onClick: () => void;
}

export const SheetDashedFieldButton = ({
  label,
  onClick,
}: SheetDashedFieldButtonProps) => {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex w-full cursor-pointer items-center justify-center rounded-md py-4 transition-colors duration-150 ease-in-out hover:bg-gold/10"
      style={{ border: `2px dashed ${APP_COLORS.goldDark}` }}
    >
      <FiPlus style={{ fontSize: 24, color: APP_COLORS.gold }} />
    </button>
  );
};
