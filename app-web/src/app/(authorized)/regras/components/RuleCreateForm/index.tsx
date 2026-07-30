'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { CircularProgress } from '@mui/material';
import { FormRichTextInput, FormTextInput } from '@/shared/components/Inputs';
import { PrimaryButton } from '@/shared/components/Buttons';
import { DefaultText } from '@/shared/components/Texts';
import { useGetEntityById, usePostEntity, usePutEntity } from '@/hooks/Queries';
import {
  RuleFormData,
  ruleFormDefaultValues,
  ruleFormResolver,
} from '@/shared/formSchemas';
import { IRule } from '@/shared/interfaces';
import { showToast } from '@/shared/util';
import { useSelectedRuleStore } from '@/store';
import { RuleSectionsField } from '../RuleSectionsField';

export interface RuleCreateFormProps {
  onSaved: () => void;
}

interface RuleSectionPayload {
  label: string;
  description?: string;
}

interface RulePayload extends Omit<RuleFormData, 'sections'> {
  sections: RuleSectionPayload[];
}

export const RuleCreateForm = ({ onSaved }: RuleCreateFormProps) => {
  const selectedRule = useSelectedRuleStore((state) => state.selectedRule);
  const isEditMode = !!selectedRule;

  const {
    data: ruleDetail,
    isLoading: isRuleDetailLoading,
    isError: isRuleDetailError,
    error: ruleDetailError,
  } = useGetEntityById<IRule>({
    url: `/rules/${selectedRule?.id}`,
    enabled: isEditMode,
  });

  const { control, handleSubmit, reset } = useForm<RuleFormData>({
    resolver: ruleFormResolver,
    defaultValues: ruleFormDefaultValues,
  });

  useEffect(() => {
    if (!isEditMode) {
      reset(ruleFormDefaultValues);
      return;
    }

    if (!ruleDetail) {
      return;
    }

    reset({
      name: ruleDetail.name,
      description: ruleDetail.description ?? '',
      sections:
        ruleDetail.sections?.map((section) => ({
          label: section.label,
          description: section.description ?? '',
        })) ?? [],
    });
  }, [isEditMode, ruleDetail, reset]);

  useEffect(() => {
    if (!isRuleDetailError) {
      return;
    }

    showToast({
      message:
        ruleDetailError?.response?.data?.message ??
        'Não foi possível carregar os dados da regra.',
      type: 'error',
    });
  }, [isRuleDetailError, ruleDetailError]);

  const buildPayload = (data: RuleFormData): RulePayload => ({
    ...data,
    sections: data.sections.map((section) => ({
      label: section.label,
      description: section.description || undefined,
    })),
  });

  const createRuleMutation = usePostEntity<IRule, RulePayload>({
    url: '/rules',
    invalidateQueryKeys: [['/rules']],
    onSuccess: () => {
      showToast({
        message: 'Regra cadastrada com sucesso.',
        type: 'success',
      });
      reset(ruleFormDefaultValues);
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível cadastrar a regra.',
        type: 'error',
      });
    },
  });

  const updateRuleMutation = usePutEntity<IRule, RulePayload>({
    url: `/rules/${selectedRule?.id}`,
    invalidateQueryKeys: [['/rules']],
    onSuccess: () => {
      showToast({
        message: 'Regra atualizada com sucesso.',
        type: 'success',
      });
      onSaved();
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível atualizar a regra.',
        type: 'error',
      });
    },
  });

  const onSubmit = (data: RuleFormData) => {
    const payload = buildPayload(data);

    if (isEditMode) {
      updateRuleMutation.mutate(payload);
      return;
    }

    createRuleMutation.mutate(payload);
  };

  const isPending =
    createRuleMutation.isPending || updateRuleMutation.isPending;

  if (isEditMode && isRuleDetailLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CircularProgress size={28} />
        <DefaultText>Carregando dados da regra...</DefaultText>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormTextInput
          id="rule-form-name"
          name="name"
          control={control}
          label="Nome"
          placeholder="Digite o nome"
        />
      </div>

      <FormRichTextInput
        id="rule-form-description"
        name="description"
        control={control}
        label="Descrição"
        placeholder="Descreva a regra"
      />

      <RuleSectionsField control={control} />

      <PrimaryButton
        type="submit"
        isLoading={isPending}
        sx={{ marginTop: '8px' }}
      >
        {isEditMode ? 'Salvar' : 'Cadastrar'}
      </PrimaryButton>
    </form>
  );
};
