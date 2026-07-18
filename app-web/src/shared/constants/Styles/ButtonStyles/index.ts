import { SystemStyleObject, Theme } from '@mui/system';
import { APP_COLORS } from '../../Colors';

export const APP_BUTTON_BASE_FONT_SIZE = {
  primary: 14,
  secondary: 13,
  icon: 18,
} as const;

export const APP_BUTTON_STYLES: Record<string, SystemStyleObject<Theme>> = {
  primary: {
    width: '100%',
    padding: '13px',
    letterSpacing: '3px',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: APP_COLORS.buttonText,
    backgroundImage: `linear-gradient(180deg, ${APP_COLORS.buttonBg} 0%, ${APP_COLORS.buttonBgDark} 100%)`,
    border: `1px solid ${APP_COLORS.gold}`,
    borderRadius: '3px',
    boxShadow: 'none',
    '&:hover': {
      filter: 'brightness(1.25)',
      backgroundImage: `linear-gradient(180deg, ${APP_COLORS.buttonBg} 0%, ${APP_COLORS.buttonBgDark} 100%)`,
      boxShadow: 'none',
    },
    '&.Mui-disabled': {
      opacity: 0.6,
      color: APP_COLORS.buttonText,
    },
  },
  secondary: {
    width: '100%',
    padding: '11px',
    letterSpacing: '1px',
    textTransform: 'none',
    fontWeight: 400,
    color: APP_COLORS.textBrownDark,
    backgroundColor: APP_COLORS.parchmentLight,
    border: `1px solid ${APP_COLORS.gold}`,
    borderRadius: '3px',
    boxShadow: 'none',
    '&:hover': {
      backgroundColor: APP_COLORS.parchmentDark,
      boxShadow: 'none',
    },
  },
  iconButton: {
    color: APP_COLORS.gold,
    border: `1px solid ${APP_COLORS.goldDark}`,
    backgroundColor: APP_COLORS.wood,
    borderRadius: '4px',
    '&:hover': {
      backgroundColor: APP_COLORS.woodLight,
    },
  },
};
