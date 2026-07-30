'use client';

import { SubmitEvent, useState } from 'react';

import { PageContainer } from '@/shared/components/Containers';
import { ConfirmationModal, FormModal } from '@/shared/components/Modals';
import { Title } from '@/shared/components/Texts';
import { PrimaryButton } from '@/shared/components/Buttons';
import { useIsGoogleUser } from '@/hooks/Auth';
import { useDeleteEntity, useGetEntityList } from '@/hooks/Queries';
import { ITag, ITagListFilters } from '@/shared/interfaces';
import { APP_DEFAULT_PAGE_SIZE } from '@/shared/constants';
import { showToast } from '@/shared/util';
import { useSelectedTagStore } from '@/store';
import { TagsList } from './components/TagsList';
import { TagCreateForm } from './components/TagCreateForm';
import { TagsFilterSection } from './components/TagsFilterSection';

export default function TagsPage() {
  const isGoogleUser = useIsGoogleUser();
  const [nameInput, setNameInput] = useState('');
  const [typeInput, setTypeInput] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [tagPendingDelete, setTagPendingDelete] = useState<ITag | null>(null);
  const [filters, setFilters] = useState<ITagListFilters>({
    page: 1,
    perPage: APP_DEFAULT_PAGE_SIZE,
  });

  const { selectedTag, resetSelectedTag, setSelectedTag } =
    useSelectedTagStore();

  const { data, isLoading } = useGetEntityList<ITag, ITagListFilters>({
    url: '/tags',
    filters,
  });

  const deleteTagMutation = useDeleteEntity({
    url: `/tags/${tagPendingDelete?.id}`,
    invalidateQueryKeys: [['/tags']],
    onSuccess: () => {
      showToast({
        message: 'Tag excluída com sucesso.',
        type: 'success',
      });
      setTagPendingDelete(null);
    },
    onError: (error) => {
      showToast({
        message:
          error.response?.data?.message ?? 'Não foi possível excluir a tag.',
        type: 'error',
      });
    },
  });

  const handleSearch = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters((current) => ({
      ...current,
      name: nameInput.trim() || undefined,
      type: typeInput.trim() || undefined,
      page: 1,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((current) => ({ ...current, page: newPage }));
  };

  const handleOpenCreateModal = () => {
    resetSelectedTag();
    setIsFormModalOpen(true);
  };

  const handleEdit = (tag: ITag) => {
    setSelectedTag(tag);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    resetSelectedTag();
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-4">
        <Title component="h1" sx={{ textAlign: 'left' }}>
          Tags
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

      <TagsFilterSection
        nameValue={nameInput}
        onNameChange={setNameInput}
        typeValue={typeInput}
        onTypeChange={setTypeInput}
        onSubmit={handleSearch}
      />

      <TagsList
        tags={data?.data ?? []}
        total={data?.total ?? 0}
        page={filters.page ?? 1}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onEdit={handleEdit}
        onDelete={setTagPendingDelete}
      />

      <FormModal
        open={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={selectedTag ? 'Editar tag' : 'Nova tag'}
      >
        <TagCreateForm onSaved={handleCloseFormModal} />
      </FormModal>

      <ConfirmationModal
        open={!!tagPendingDelete}
        title="Excluir tag"
        message={`Tem certeza que deseja excluir a tag "${tagPendingDelete?.name}"?`}
        confirmLabel="Excluir"
        isLoading={deleteTagMutation.isPending}
        onConfirm={() => deleteTagMutation.mutate()}
        onCancel={() => setTagPendingDelete(null)}
      />
    </PageContainer>
  );
}
