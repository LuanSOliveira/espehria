'use client';

import { SubmitEvent, useState } from 'react';

import { PageContainer } from '@/shared/components/Containers';
import { ConfirmationModal, FormModal, ViewModal } from '@/shared/components/Modals';
import { Title } from '@/shared/components/Texts';
import { PrimaryButton } from '@/shared/components/Buttons';
import { useIsGoogleUser } from '@/hooks/Auth';
import { useDeleteEntity, useGetEntityList } from '@/hooks/Queries';
import { IRuleListFilters, IRuleListItem } from '@/shared/interfaces';
import { APP_DEFAULT_PAGE_SIZE } from '@/shared/constants';
import { showToast } from '@/shared/util';
import { useSelectedRuleStore } from '@/store';
import { RulesList } from './components/RulesList';
import { RuleCreateForm } from './components/RuleCreateForm';
import { RulesFilterSection } from './components/RulesFilterSection';
import { RuleView } from './components/RuleView';

export default function RulesPage() {
  const isGoogleUser = useIsGoogleUser();
  const [nameInput, setNameInput] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [rulePendingDelete, setRulePendingDelete] =
    useState<IRuleListItem | null>(null);
  const [rulePendingView, setRulePendingView] = useState<IRuleListItem | null>(
    null,
  );
  const [filters, setFilters] = useState<IRuleListFilters>({
    page: 1,
    perPage: APP_DEFAULT_PAGE_SIZE,
  });

  const { selectedRule, resetSelectedRule, setSelectedRule } =
    useSelectedRuleStore();

  const { data, isLoading } = useGetEntityList<IRuleListItem, IRuleListFilters>({
    url: '/rules',
    filters,
  });

  const deleteRuleMutation = useDeleteEntity({
    url: `/rules/${rulePendingDelete?.id}`,
    invalidateQueryKeys: [['/rules']],
    onSuccess: () => {
      showToast({
        message: 'Regra excluída com sucesso.',
        type: 'success',
      });
      setRulePendingDelete(null);
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ??
          'Não foi possível excluir a regra.',
        type: 'error',
      });
    },
  });

  const handleSearch = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters((current) => ({
      ...current,
      name: nameInput.trim() || undefined,
      page: 1,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((current) => ({ ...current, page: newPage }));
  };

  const handleOpenCreateModal = () => {
    resetSelectedRule();
    setIsFormModalOpen(true);
  };

  const handleEdit = (rule: IRuleListItem) => {
    setSelectedRule(rule);
    setIsFormModalOpen(true);
  };

  const handleView = (rule: IRuleListItem) => {
    setRulePendingView(rule);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    resetSelectedRule();
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-4">
        <Title component="h1" sx={{ textAlign: 'left' }}>
          Regras
        </Title>
        {!isGoogleUser && (
          <PrimaryButton
            type="button"
            onClick={handleOpenCreateModal}
            sx={{ width: 'auto', padding: '10px 20px' }}
          >
            Novo
          </PrimaryButton>
        )}
      </div>

      <RulesFilterSection
        nameValue={nameInput}
        onNameChange={setNameInput}
        onSubmit={handleSearch}
      />

      <RulesList
        rules={data?.data ?? []}
        total={data?.total ?? 0}
        page={filters.page ?? 1}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={setRulePendingDelete}
      />

      <FormModal
        open={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={selectedRule ? 'Editar regra' : 'Nova regra'}
        size="wide"
      >
        <RuleCreateForm onSaved={handleCloseFormModal} />
      </FormModal>

      <ViewModal
        open={!!rulePendingView}
        onClose={() => setRulePendingView(null)}
        title="Detalhes da Regra"
        size="wide"
      >
        {rulePendingView && <RuleView ruleId={rulePendingView.id} />}
      </ViewModal>

      <ConfirmationModal
        open={!!rulePendingDelete}
        title="Excluir regra"
        message={`Tem certeza que deseja excluir a regra "${rulePendingDelete?.name}"?`}
        confirmLabel="Excluir"
        isLoading={deleteRuleMutation.isPending}
        onConfirm={() => deleteRuleMutation.mutate()}
        onCancel={() => setRulePendingDelete(null)}
      />
    </PageContainer>
  );
}
