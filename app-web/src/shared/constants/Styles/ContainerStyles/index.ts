import { CSSProperties } from 'react';
import { APP_COLORS } from '../../Colors';

export const APP_CONTAINER_STYLES: Record<string, CSSProperties> = {
  page: {
    backgroundImage: `linear-gradient(160deg, ${APP_COLORS.parchmentLight} 0%, ${APP_COLORS.parchmentMid} 60%, ${APP_COLORS.parchmentDark} 100%)`,
  },
  card: {
    backgroundImage: `radial-gradient(circle at 15% 20%, rgba(120,90,50,0.25) 0, transparent 35%),
      radial-gradient(circle at 85% 75%, rgba(120,90,50,0.2) 0, transparent 40%),
      radial-gradient(circle at 50% 100%, rgba(90,65,35,0.3) 0, transparent 50%),
      linear-gradient(160deg, ${APP_COLORS.parchmentLight} 0%, ${APP_COLORS.parchmentMid} 60%, ${APP_COLORS.parchmentDark} 100%)`,
    boxShadow: `0 0 0 1px ${APP_COLORS.goldDark}, 0 0 0 4px ${APP_COLORS.parchment}, 0 0 0 5px ${APP_COLORS.gold}, 0 15px 40px rgba(0,0,0,0.6)`,
  },
};
