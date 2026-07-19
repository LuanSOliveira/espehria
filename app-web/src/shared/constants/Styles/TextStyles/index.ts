import { SystemStyleObject, Theme } from '@mui/system';
import { APP_COLORS } from '../../Colors';

export const APP_TEXT_BASE_FONT_SIZE = {
  title: 26,
  label: 12,
  default: 14,
} as const;

export const APP_TEXT_STYLES: Record<string, SystemStyleObject<Theme>> = {
  title: {
    display: 'block',
    textAlign: 'center',
    textTransform: 'uppercase',
    fontWeight: 700,
    letterSpacing: '4px',
    margin: 0,
    backgroundImage: `linear-gradient(180deg, ${APP_COLORS.goldDeep} 0%, ${APP_COLORS.goldDark} 55%, ${APP_COLORS.textBrownDark} 100%)`,
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    color: 'transparent',
    WebkitTextFillColor: 'transparent',
    filter: 'drop-shadow(0 1px 0 rgba(0,0,0,0.2))',
  },
  label: {
    display: 'block',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    fontWeight: 400,
    color: APP_COLORS.textBrown,
    marginBottom: '6px',
  },
  default: {
    display: 'block',
    fontWeight: 400,
    color: APP_COLORS.textBrown,
  },
};
