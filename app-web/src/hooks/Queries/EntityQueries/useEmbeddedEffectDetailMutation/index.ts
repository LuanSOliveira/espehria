'use client';

import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ApiFactory } from '@/services/api';
import { getAuthToken } from '@/services/jwt';
import { IAxioDataError, IEnchantment, IEnhancement } from '@/shared/interfaces';

export interface UseEmbeddedEffectDetailMutationParams {
  entityUrl: '/enchantments' | '/enhancements';
  onSuccess?: (data: IEnchantment | IEnhancement) => void;
  onError?: (error: AxiosError<IAxioDataError>) => void;
}

/**
 * Busca o detalhe de um encantamento/aprimoramento existente sob demanda, ao
 * ser selecionado no EmbeddedEffectPickerModal, para copiar seu
 * `name`/`effect` para o formulário do equipamento (arma, armadura, escudo
 * ou acessório). É uma ação pontual disparada pelo clique de seleção (não
 * uma leitura reativa), por isso usa `useMutation` em vez de
 * `useGetEntityById` — assim `onSuccess`/`onError` ficam disponíveis sem
 * depender de `useEffect`.
 */
export const useEmbeddedEffectDetailMutation = ({
  entityUrl,
  onSuccess,
  onError,
}: UseEmbeddedEffectDetailMutationParams) => {
  return useMutation<
    IEnchantment | IEnhancement,
    AxiosError<IAxioDataError>,
    string
  >({
    mutationFn: async (id) => {
      const api = ApiFactory(getAuthToken());
      const { data } = await api.get<IEnchantment | IEnhancement>(
        `${entityUrl}/${id}`,
      );
      return data;
    },
    onSuccess,
    onError,
  });
};
