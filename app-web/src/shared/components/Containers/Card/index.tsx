import { CSSProperties, ElementType, HTMLAttributes, ReactNode } from 'react';
import { APP_CONTAINER_STYLES } from '@/shared/constants';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  showCorners?: boolean;
  component?: ElementType;
  style?: CSSProperties;
  /**
   * Classe(s) Tailwind que definem a largura do card, substituindo o default
   * por completo. Use uma largura explícita (ex.: `w-[min(1152px,92vw)]`), não
   * só um `max-w-*` — o Card fica dentro de um MUI Dialog cuja Paper encolhe
   * para caber no conteúdo (`width: auto`), então um `max-w-*` sozinho nunca é
   * alcançado se o conteúdo natural já for menor que o teto.
   */
  sizeClassName?: string;
}

const CORNER_BASE_CLASSNAME = 'absolute w-[22px] h-[22px] border-2 border-gold';

export const Card = ({
  children,
  showCorners = true,
  component = 'div',
  className,
  style,
  sizeClassName = 'w-full max-w-105',
  ...rest
}: CardProps) => {
  const Component = component;

  return (
    <Component
      className={`relative ${sizeClassName} pt-10 px-8 pb-8 rounded-md ${className ?? ''}`}
      style={{ ...APP_CONTAINER_STYLES.card, ...style }}
      {...rest}
    >
      {showCorners && (
        <>
          <div
            className={`${CORNER_BASE_CLASSNAME} top-1.5 left-1.5 border-r-0 border-b-0`}
          />
          <div
            className={`${CORNER_BASE_CLASSNAME} top-1.5 right-1.5 border-l-0 border-b-0`}
          />
          <div
            className={`${CORNER_BASE_CLASSNAME} bottom-1.5 left-1.5 border-r-0 border-t-0`}
          />
          <div
            className={`${CORNER_BASE_CLASSNAME} bottom-1.5 right-1.5 border-l-0 border-t-0`}
          />
        </>
      )}
      {children}
    </Component>
  );
};
