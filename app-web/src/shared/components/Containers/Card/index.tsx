import { Box, BoxProps } from '@mui/material';
import { APP_CONTAINER_STYLES } from '@/shared/constants';

export interface CardProps extends BoxProps {
  showCorners?: boolean;
}

export const Card = ({
  children,
  sx,
  showCorners = true,
  ...rest
}: CardProps) => {
  return (
    <Box
      sx={[APP_CONTAINER_STYLES.card, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
      {...rest}
    >
      {showCorners && (
        <>
          <Box
            sx={[
              APP_CONTAINER_STYLES.cardCorner,
              APP_CONTAINER_STYLES.cardCornerTopLeft,
            ]}
          />
          <Box
            sx={[
              APP_CONTAINER_STYLES.cardCorner,
              APP_CONTAINER_STYLES.cardCornerTopRight,
            ]}
          />
          <Box
            sx={[
              APP_CONTAINER_STYLES.cardCorner,
              APP_CONTAINER_STYLES.cardCornerBottomLeft,
            ]}
          />
          <Box
            sx={[
              APP_CONTAINER_STYLES.cardCorner,
              APP_CONTAINER_STYLES.cardCornerBottomRight,
            ]}
          />
        </>
      )}
      {children}
    </Box>
  );
};
