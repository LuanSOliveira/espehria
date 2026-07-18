import { Box, BoxProps } from '@mui/material';
import { APP_CONTAINER_STYLES } from '@/shared/constants';

export type PageContainerProps = BoxProps;

export const PageContainer = ({ children, sx, ...rest }: PageContainerProps) => {
  return (
    <Box
      sx={[APP_CONTAINER_STYLES.page, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
      {...rest}
    >
      {children}
    </Box>
  );
};
