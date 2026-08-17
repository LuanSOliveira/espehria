'use client';

import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ApiFactory } from '@/services/api';
import { getAuthToken } from '@/services/jwt';
import { IAxioDataError, IEnchantment, IEnhancement } from '@/shared/interfaces';

export interface UseWeaponEmbeddedEffectDetailMutationParams {
  entityUrl: '/enchantments' | '/enhancements';
  onSuccess?: (data: IEnchantment | IEnhancement) => void;
  onError?: (error: AxiosError<IAxioDataError>) => void;
}

/**
 * Busca o detalhe de um encantamento/aprimoramento existente sob demanda, ao
 * ser selecionado no WeaponEmbeddedEffectPickerModal, para copiar seu
 * `name`/`effect` para o formulário de arma. É uma ação pontual disparada
 * pelo clique de seleção (não uma leitura reativa), por isso usa
 * `useMutation` em vez de `useGetEntityById` — assim `onSuccess`/`onError`
 * ficam disponíveis sem depender de `useEffect`.
 */
export const useWeaponEmbeddedEffectDetailMutation = ({
  entityUrl,
  onSuccess,
  onError,
}: UseWeaponEmbeddedEffectDetailMutationParams) => {
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
