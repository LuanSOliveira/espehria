'use client';

import { useEffect, useRef } from 'react';

const DEFAULT_AUTOSAVE_DELAY_MS = 2500;

export interface UseFieldAutosaveParams<TValue> {
  value: TValue;
  onSave: (value: TValue) => void;
  /**
   * Só passa a agendar o autosave quando `true`. Deve ficar `false` até o
   * valor local do campo ter sido hidratado a partir dos dados carregados via
   * `GET /sheets/:id` — evita um PUT desnecessário disparado pela própria
   * sincronização inicial, e não pela interação do usuário.
   */
  enabled?: boolean;
  delay?: number;
}

/**
 * Debounce de autosave isolado por instância: cada campo da ficha chama sua
 * própria instância deste hook, cada uma com seu próprio `useRef` de timer —
 * alterar um campo nunca cancela ou reinicia o timer de outro campo com
 * alteração pendente, pois cada instância só enxerga seu próprio valor/ref.
 */
export const useFieldAutosave = <TValue>({
  value,
  onSave,
  enabled = true,
  delay = DEFAULT_AUTOSAVE_DELAY_MS,
}: UseFieldAutosaveParams<TValue>) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRunRef = useRef(true);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (isFirstRunRef.current) {
      isFirstRunRef.current = false;
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      onSaveRef.current(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onSave é lido via ref para não recriar o timer a cada render do componente pai
  }, [value, enabled, delay]);
};
