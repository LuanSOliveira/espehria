'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useEmptySheetTrainingSlotMutation,
  useFillSheetTrainingSlotMutation,
  useGetEntityById,
  usePostEntity,
  useRemoveSheetCharacteristicExtraMutation,
  useRemoveSheetTalentExtraMutation,
  useRemoveSheetTrainingExtraMutation,
} from '@/hooks/Queries';
import {
  ISheet,
  ISheetAbilitiesMutationResult,
  ISheetAbilitiesSummary,
} from '@/shared/interfaces';
import { showToast } from '@/shared/util';
import { SHEET_EMPTY_ABILITIES_SUMMARY } from '../../data';

export interface UseSheetAbilitiesParams {
  sheetId: string;
  /**
   * Aplica os 5 snapshots derivados comuns a toda mutação de habilidade
   * (`melhorias`, `defeitos`, `proficiencias`, `proficienciasAjustadas`,
   * `saberes`) a partir do `ISheet` recalculado devolvido pela API — definida
   * em `page.tsx`, que é quem possui os setters de estado. Evita repetir os
   * mesmos 5 `setX(data.x)` em cada uma das 8 mutações abaixo.
   */
  applySheetSnapshots: (sheet: ISheet) => void;
}

/**
 * Estado e mutações da aba Habilidades da ficha (Características, Treinamentos,
 * Talentos) — ver `.claude/tasks/ficha-habilidades/`.
 *
 * Desvio confirmado contra o backend real: `GET /sheets/:id` (`SheetResponseDto`)
 * **não** inclui um campo `abilities` — a listagem consolidada é exposta por um
 * endpoint próprio (`GET /sheets/:id/abilities`) e devolvida, já recalculada,
 * por cada uma das 8 mutações de habilidade (`ISheetAbilitiesMutationResult`).
 * Por isso `abilities` aqui não é um `useState` hidratado uma única vez como os
 * demais snapshots da ficha: é o dado do próprio `useGetEntityById`, atualizado
 * via `queryClient.setQueryData` a cada mutação bem-sucedida (evita um round-trip
 * de refetch, já que a resposta da mutação já traz o valor novo) e invalidado
 * (refetch) após uma alteração de level, que não retorna `abilities` inline.
 */
export const useSheetAbilities = ({
  sheetId,
  applySheetSnapshots,
}: UseSheetAbilitiesParams) => {
  const queryClient = useQueryClient();
  const abilitiesUrl = `/sheets/${sheetId}/abilities`;
  const sheetInvalidateKeys = [['/sheets'], [`/sheets/${sheetId}`]];

  const {
    data: abilitiesData,
    isLoading: isLoadingAbilities,
    isError: isAbilitiesError,
    error: abilitiesError,
  } = useGetEntityById<ISheetAbilitiesSummary>({ url: abilitiesUrl });

  useEffect(() => {
    if (!isAbilitiesError) {
      return;
    }

    showToast({
      message:
        abilitiesError?.response?.data?.message ??
        'Não foi possível carregar as habilidades da ficha.',
      type: 'error',
    });
  }, [isAbilitiesError, abilitiesError]);

  const abilities = abilitiesData ?? SHEET_EMPTY_ABILITIES_SUMMARY;

  const applyMutationResult = (data: ISheetAbilitiesMutationResult) => {
    applySheetSnapshots(data.sheet);
    queryClient.setQueryData([abilitiesUrl], data.abilities);
  };

  const refetchAbilitiesAfterLevelChange = () => {
    queryClient.invalidateQueries({ queryKey: [abilitiesUrl] });
  };

  const addCharacteristicExtraMutation = usePostEntity<
    ISheetAbilitiesMutationResult,
    { characteristicId: string }
  >({
    url: `/sheets/${sheetId}/characteristics/extras`,
    invalidateQueryKeys: sheetInvalidateKeys,
    onSuccess: (data) => {
      applyMutationResult(data);
      showToast({
        message: 'Característica adicionada à ficha com sucesso.',
        type: 'success',
      });
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível adicionar a característica.',
        type: 'error',
      });
    },
  });

  const removeCharacteristicExtraMutation =
    useRemoveSheetCharacteristicExtraMutation({
      sheetId,
      invalidateQueryKeys: sheetInvalidateKeys,
      onSuccess: (data) => {
        applyMutationResult(data);
        showToast({
          message: 'Característica removida da ficha com sucesso.',
          type: 'success',
        });
      },
      onError: (error) => {
        showToast({
          message:
            error.response?.data?.message ??
            'Não foi possível remover a característica.',
          type: 'error',
        });
      },
    });

  const addTalentExtraMutation = usePostEntity<
    ISheetAbilitiesMutationResult,
    { talentId: string }
  >({
    url: `/sheets/${sheetId}/talents/extras`,
    invalidateQueryKeys: sheetInvalidateKeys,
    onSuccess: (data) => {
      applyMutationResult(data);
      showToast({
        message: 'Talento adicionado à ficha com sucesso.',
        type: 'success',
      });
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível adicionar o talento.',
        type: 'error',
      });
    },
  });

  const removeTalentExtraMutation = useRemoveSheetTalentExtraMutation({
    sheetId,
    invalidateQueryKeys: sheetInvalidateKeys,
    onSuccess: (data) => {
      applyMutationResult(data);
      showToast({
        message: 'Talento removido da ficha com sucesso.',
        type: 'success',
      });
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível remover o talento.',
        type: 'error',
      });
    },
  });

  const addTrainingExtraMutation = usePostEntity<
    ISheetAbilitiesMutationResult,
    { trainingId: string }
  >({
    url: `/sheets/${sheetId}/trainings/extras`,
    invalidateQueryKeys: sheetInvalidateKeys,
    onSuccess: (data) => {
      applyMutationResult(data);
      showToast({
        message: 'Treinamento adicionado à ficha com sucesso.',
        type: 'success',
      });
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível adicionar o treinamento.',
        type: 'error',
      });
    },
  });

  const removeTrainingExtraMutation = useRemoveSheetTrainingExtraMutation({
    sheetId,
    invalidateQueryKeys: sheetInvalidateKeys,
    onSuccess: (data) => {
      applyMutationResult(data);
      showToast({
        message: 'Treinamento removido da ficha com sucesso.',
        type: 'success',
      });
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível remover o treinamento.',
        type: 'error',
      });
    },
  });

  const fillTrainingSlotMutation = useFillSheetTrainingSlotMutation({
    sheetId,
    invalidateQueryKeys: sheetInvalidateKeys,
    onSuccess: (data) => {
      applyMutationResult(data);
      showToast({
        message: 'Slot de treinamento preenchido com sucesso.',
        type: 'success',
      });
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível preencher o slot de treinamento.',
        type: 'error',
      });
    },
  });

  const emptyTrainingSlotMutation = useEmptySheetTrainingSlotMutation({
    sheetId,
    invalidateQueryKeys: sheetInvalidateKeys,
    onSuccess: (data) => {
      applyMutationResult(data);
      showToast({
        message: 'Slot de treinamento esvaziado com sucesso.',
        type: 'success',
      });
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível esvaziar o slot de treinamento.',
        type: 'error',
      });
    },
  });

  return {
    abilities,
    isLoadingAbilities,
    refetchAbilitiesAfterLevelChange,
    addCharacteristicExtraMutation,
    removeCharacteristicExtraMutation,
    addTalentExtraMutation,
    removeTalentExtraMutation,
    addTrainingExtraMutation,
    removeTrainingExtraMutation,
    fillTrainingSlotMutation,
    emptyTrainingSlotMutation,
  };
};
