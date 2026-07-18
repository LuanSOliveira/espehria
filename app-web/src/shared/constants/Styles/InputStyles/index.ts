import { SystemStyleObject, Theme } from '@mui/system';
import { APP_COLORS } from '../../Colors';

export const APP_INPUT_BASE_FONT_SIZE = {
  text: 14,
  icon: 18,
} as const;

export const APP_INPUT_STYLES: Record<string, SystemStyleObject<Theme>> = {
  textField: {
    '& .MuiOutlinedInput-root': {
      backgroundImage: `linear-gradient(180deg, ${APP_COLORS.inputBg} 0%, ${APP_COLORS.inputBgDark} 100%)`,
      borderRadius: '3px',
      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
      '& fieldset': {
        borderColor: APP_COLORS.goldDark,
      },
      '&:hover fieldset': {
        borderColor: APP_COLORS.gold,
      },
      '&.Mui-focused fieldset': {
        borderColor: APP_COLORS.goldLight,
        borderWidth: '1px',
      },
    },
    '& .MuiOutlinedInput-input': {
      color: APP_COLORS.inputText,
      padding: '12px 14px',
    },
    '& .MuiOutlinedInput-input::placeholder': {
      color: APP_COLORS.inputPlaceholder,
      opacity: 1,
    },
    '& .MuiFormHelperText-root': {
      marginLeft: 0,
      color: APP_COLORS.goldDeep,
    },
  },
  startIcon: {
    color: APP_COLORS.gold,
    opacity: 0.85,
    display: 'flex',
  },
  visibilityToggle: {
    color: APP_COLORS.gold,
    '&:hover': {
      color: APP_COLORS.goldLight,
    },
  },
};
