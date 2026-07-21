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
      minHeight: '48px',
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
  autocompleteField: {
    // O MUI Autocomplete aplica padding próprio na raiz (9px) e no input
    // (7.5px 4px), somando uma altura maior que a do TextField comum (12px
    // 14px). !important garante a mesma altura mesmo com a especificidade
    // maior das regras internas do componente.
    '& .MuiOutlinedInput-root': {
      padding: '0 !important',
    },
    '& .MuiAutocomplete-input': {
      padding: '12px 14px !important',
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
  richTextField: {
    backgroundImage: `linear-gradient(180deg, ${APP_COLORS.inputBg} 0%, ${APP_COLORS.inputBgDark} 100%)`,
    borderRadius: '3px',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
    border: `1px solid ${APP_COLORS.goldDark}`,
    padding: '8px 12px',
    '&:hover': {
      borderColor: APP_COLORS.gold,
    },
    '&:focus-within': {
      borderColor: APP_COLORS.goldLight,
    },
  },
  richTextToolbar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    marginBottom: '8px',
    paddingBottom: '8px',
    borderBottom: `1px solid ${APP_COLORS.goldDark}`,
  },
  richTextToolbarButton: {
    color: APP_COLORS.gold,
    padding: '4px',
    borderRadius: '3px',
    '&:hover': {
      backgroundColor: APP_COLORS.woodLight,
    },
  },
  richTextToolbarButtonActive: {
    color: APP_COLORS.goldLight,
    backgroundColor: APP_COLORS.woodLight,
  },
  richTextContent: {
    color: APP_COLORS.inputText,
    minHeight: '120px',
    '& .ProseMirror': {
      outline: 'none',
    },
    '& .ProseMirror p': {
      margin: '0.25em 0',
    },
    '& .ProseMirror h1': {
      fontSize: '1.5em',
      fontWeight: 700,
      margin: '0.5em 0',
    },
    '& .ProseMirror h2': {
      fontSize: '1.25em',
      fontWeight: 700,
      margin: '0.5em 0',
    },
    '& .ProseMirror h3': {
      fontSize: '1.1em',
      fontWeight: 700,
      margin: '0.5em 0',
    },
    '& .ProseMirror ul': {
      paddingLeft: '1.5em',
      listStyleType: 'disc',
    },
    '& .ProseMirror ol': {
      paddingLeft: '1.5em',
      listStyleType: 'decimal',
    },
    '& [data-type="mention"]': {
      color: APP_COLORS.goldSoft,
      fontWeight: 600,
      borderRadius: '3px',
      padding: '0 2px',
    },
  },
  richTextContentLight: {
    color: APP_COLORS.textBrown,
    minHeight: 'unset',
    '& .ProseMirror': {
      outline: 'none',
    },
    '& .ProseMirror p': {
      margin: '0.25em 0',
    },
    '& .ProseMirror h1': {
      fontSize: '1.5em',
      fontWeight: 700,
      margin: '0.5em 0',
      color: APP_COLORS.textBrownDark,
    },
    '& .ProseMirror h2': {
      fontSize: '1.25em',
      fontWeight: 700,
      margin: '0.5em 0',
      color: APP_COLORS.textBrownDark,
    },
    '& .ProseMirror h3': {
      fontSize: '1.1em',
      fontWeight: 700,
      margin: '0.5em 0',
      color: APP_COLORS.textBrownDark,
    },
    '& .ProseMirror ul': {
      paddingLeft: '1.5em',
      listStyleType: 'disc',
    },
    '& .ProseMirror ol': {
      paddingLeft: '1.5em',
      listStyleType: 'decimal',
    },
    '& [data-type="mention"]': {
      color: APP_COLORS.goldDeep,
      fontWeight: 600,
      textDecoration: 'underline',
      textDecorationColor: APP_COLORS.gold,
      borderRadius: '3px',
      padding: '0 2px',
    },
    '& [data-type="mention"][data-clickable="true"]': {
      cursor: 'pointer',
    },
    '& [data-type="mention"][data-clickable="true"]:hover': {
      backgroundColor: APP_COLORS.parchmentMid,
    },
  },
  richTextViewFrame: {
    backgroundImage: `linear-gradient(180deg, ${APP_COLORS.inputBg} 0%, ${APP_COLORS.inputBgDark} 100%)`,
    borderRadius: '3px',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
    border: `1px solid ${APP_COLORS.goldDark}`,
    padding: '8px 12px',
  },
  richTextPlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    color: APP_COLORS.inputPlaceholder,
    pointerEvents: 'none',
  },
  richTextError: {
    marginTop: '4px',
    fontSize: '12px',
    color: APP_COLORS.goldDeep,
  },
  mentionSuggestionMenu: {
    backgroundImage: `linear-gradient(180deg, ${APP_COLORS.inputBg} 0%, ${APP_COLORS.inputBgDark} 100%)`,
    border: `1px solid ${APP_COLORS.goldDark}`,
    borderRadius: '3px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
    padding: '4px',
    minWidth: '220px',
    maxWidth: '320px',
  },
  mentionSuggestionItem: {
    padding: '6px 10px',
    borderRadius: '3px',
    cursor: 'pointer',
    color: APP_COLORS.inputText,
    '&:hover': {
      backgroundColor: APP_COLORS.woodLight,
    },
  },
  mentionSuggestionItemActive: {
    backgroundColor: APP_COLORS.woodLight,
    color: APP_COLORS.goldLight,
  },
};
