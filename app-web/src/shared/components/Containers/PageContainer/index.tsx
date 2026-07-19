import { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { APP_CONTAINER_STYLES } from '@/shared/constants';

export interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  style?: CSSProperties;
}

export const PageContainer = ({
  children,
  className,
  style,
  ...rest
}: PageContainerProps) => {
  return (
    <div
      className={`w-full h-full p-8 overflow-y-auto overflow-x-hidden rounded-md border border-gold ${className ?? ''}`}
      style={{ ...APP_CONTAINER_STYLES.page, ...style }}
      {...rest}
    >
      {children}
    </div>
  );
};
