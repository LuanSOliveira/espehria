'use client';

import { Avatar, Tooltip } from '@mui/material';
import { APP_COLORS } from '@/shared/constants';

export interface TagBadgeProps {
  name: string;
  color: string;
  size?: number;
}

const DEFAULT_SIZE = 24;

export const TagBadge = ({ name, color, size = DEFAULT_SIZE }: TagBadgeProps) => {
  return (
    <Tooltip title={name}>
      <Avatar
        sx={{
          width: size,
          height: size,
          backgroundColor: color,
          color: APP_COLORS.white,
          border: `1px solid ${APP_COLORS.goldDark}`,
          fontSize: size * 0.5,
        }}
      >
        {name.charAt(0).toUpperCase()}
      </Avatar>
    </Tooltip>
  );
};
