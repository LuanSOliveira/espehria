'use client';

import { useMemo, useState } from 'react';
import { Checkbox, Chip, IconButton, Tooltip } from '@mui/material';
import { FiEdit2, FiEye } from 'react-icons/fi';
import { FormModal, ViewModal } from '@/shared/components/Modals';
import { DefaultText, Label } from '@/shared/components/Texts';
import { DefaultAutocompleteInput, DefaultTextInput } from '@/shared/components/Inputs';
import { PrimaryButton, SecondaryButton } from '@/shared/components/Buttons';
import { ImageAvatarPreview } from '@/shared/components/ImageAvatarPreview';
import { ImprovementDefectCard } from '@/shared/components/ImprovementDefectCard';
import { BiographyView } from '@/app/(authorized)/biografias/components/BiographyView';
import {
  useGetEntityById,
  useGetEntityList,
  useImprovementDefectPropertiesQuery,
  useImprovementDefectTypesQuery,
} from '@/hooks/Queries';
import {
  IBiography,
  IBiographyListFilters,
  IBiographyListItem,
  IImprovementDefectItem,
} from '@/shared/interfaces';
import { getContrastTextColor, showToast } from '@/shared/util';
import { APP_COLORS, APP_CONTAINER_STYLES, APP_INPUT_STYLES } from '@/shared/constants';

const ATTRIBUTE_TYPE_NAME = 'Atributo';
const FREE_IMPROVEMENT_VALUE = 2;

export interface SheetBiographyAssignInitialValue {
  biography: IBiographyListItem;
  selectedImprovementId: string;
  freeImprovementPropertyId: string;
}

export interface SheetBiographyAssignPayload {
  biographyId: string;
  selectedImprovementId: string;
  freeImprovementPropertyId: string;
}

export interface SheetBiographyAssignModalProps {
  open: boolean;
  onClose: () => void;
  initialValue?: SheetBiographyAssignInitialValue | null;
  onConfirm: (payload: SheetBiographyAssignPayload) => void;
  isSaving?: boolean;
}

const getImprovementKey = (item: IImprovementDefectItem) =>
  `${item.type.id}-${item.property.id}`;

export const SheetBiographyAssignModal = ({
  open,
  onClose,
  initialValue,
  onConfirm,
  isSaving = false,
}: SheetBiographyAssignModalProps) => {
  const [search, setSearch] = useState('');
  const [biography, setBiography] = useState<IBiographyListItem | null>(null);
  const [isSelectingBiography, setIsSelectingBiography] = useState(true);
  const [isBiographyViewOpen, setIsBiographyViewOpen] = useState(false);
  const [selectedImprovementKey, setSelectedImprovementKey] = useState<
    string | null
  >(null);
  const [freePropertyId, setFreePropertyId] = useState('');
  const [wasOpen, setWasOpen] = useState(open);
  const [syncedBiographyId, setSyncedBiographyId] = useState<string | null>(
    null,
  );

  if (open !== wasOpen) {
    setWasOpen(open);

    if (open) {
      setSearch('');
      setSyncedBiographyId(null);

      if (initialValue) {
        setBiography(initialValue.biography);
        setIsSelectingBiography(false);
        setSelectedImprovementKey(null);
        setFreePropertyId(initialValue.freeImprovementPropertyId);
      } else {
        setBiography(null);
        setIsSelectingBiography(true);
        setSelectedImprovementKey(null);
        setFreePropertyId('');
      }
    }
  }

  const { data: biographyOptionsData } = useGetEntityList<
    IBiographyListItem,
    IBiographyListFilters
  >({
    url: '/biographies',
    filters: { name: search || undefined, perPage: 20 },
    enabled: open && isSelectingBiography,
  });
  const biographyOptions = biographyOptionsData?.data ?? [];

  const { data: biographyDetail } = useGetEntityById<IBiography>({
    url: `/biographies/${biography?.id}`,
    enabled: open && !!biography,
  });

  if (
    initialValue &&
    biographyDetail &&
    syncedBiographyId !== biographyDetail.id
  ) {
    setSyncedBiographyId(biographyDetail.id);

    const match = biographyDetail.improvements.find(
      (item) => item.id === initialValue.selectedImprovementId,
    );

    if (match) {
      setSelectedImprovementKey(getImprovementKey(match));
    }
  }

  const { data: types } = useImprovementDefectTypesQuery();
  const attributeType = types?.find((type) => type.name === ATTRIBUTE_TYPE_NAME);

  const { data: properties } = useImprovementDefectPropertiesQuery();
  const attributePropertyOptions = useMemo(
    () =>
      (properties ?? []).filter(
        (property) =>
          !attributeType || property.typeIds.includes(attributeType.id),
      ),
    [properties, attributeType],
  );
  const selectedFreeProperty =
    attributePropertyOptions.find((property) => property.id === freePropertyId) ??
    null;

  const attributeImprovements = (biographyDetail?.improvements ?? []).filter(
    (item) => item.type.name === ATTRIBUTE_TYPE_NAME,
  );
  const otherImprovements = (biographyDetail?.improvements ?? []).filter(
    (item) => item.type.name !== ATTRIBUTE_TYPE_NAME,
  );
  const selectedImprovement = attributeImprovements.find(
    (item) => getImprovementKey(item) === selectedImprovementKey,
  );

  const showSelectionSteps = !!biography && !isSelectingBiography;
  const isConfirmEnabled =
    !!biography && !!selectedImprovement && !!freePropertyId;

  const handleSelectBiography = (newValue: IBiographyListItem | null) => {
    setBiography(newValue);
    setSelectedImprovementKey(null);

    if (newValue) {
      setIsSelectingBiography(false);
    }
  };

  const handleConfirm = () => {
    if (!biography || !selectedImprovement || !freePropertyId) {
      return;
    }

    if (selectedImprovement.property.id === freePropertyId) {
      showToast({
        message:
          'A propriedade escolhida na melhoria da biografia não pode ser igual à propriedade da melhoria de atributo livre. Selecione propriedades diferentes.',
        type: 'error',
      });
      return;
    }

    onConfirm({
      biographyId: biography.id,
      selectedImprovementId: selectedImprovement.id,
      freeImprovementPropertyId: freePropertyId,
    });
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={initialValue ? 'Editar biografia' : 'Vincular biografia'}
      size="wide"
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          {isSelectingBiography ? (
            <DefaultAutocompleteInput<IBiographyListItem>
              id="sheet-biography-assign-search"
              label="Biografia"
              options={biographyOptions}
              getOptionLabel={(option) => option.name}
              value={biography}
              onChange={handleSelectBiography}
              inputValue={search}
              onInputChange={setSearch}
              placeholder="Buscar biografia por nome"
            />
          ) : (
            biography && (
              <>
                <Label component="span" sx={{ margin: 0 }}>
                  Biografia
                </Label>

                <div
                  className="flex items-center gap-3 px-3 py-2"
                  style={APP_CONTAINER_STYLES.detailInfoField}
                >
                  <ImageAvatarPreview
                    imageUrl={biography.imageReference}
                    alt={biography.name}
                  />

                  <div className="flex flex-1 flex-col gap-1">
                    <DefaultText>{biography.name}</DefaultText>
                    {biography.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {biography.tags.map((tag) => (
                          <Chip
                            key={tag.id}
                            label={tag.name}
                            size="small"
                            sx={{
                              backgroundColor: tag.color,
                              color: getContrastTextColor(tag.color),
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <Tooltip title="Visualizar">
                    <IconButton
                      aria-label={`Visualizar ${biography.name}`}
                      onClick={() => setIsBiographyViewOpen(true)}
                      sx={{ color: APP_COLORS.textBrownDark }}
                    >
                      <FiEye />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Editar">
                    <IconButton
                      aria-label={`Editar ${biography.name}`}
                      onClick={() => setIsSelectingBiography(true)}
                      sx={{ color: APP_COLORS.textBrownDark }}
                    >
                      <FiEdit2 />
                    </IconButton>
                  </Tooltip>
                </div>
              </>
            )
          )}
        </div>

        {showSelectionSteps && otherImprovements.length > 0 && (
          <div className="flex flex-col gap-2">
            <DefaultText>Demais melhorias da biografia</DefaultText>

            <div className="flex flex-col gap-2">
              {otherImprovements.map((item) => (
                <ImprovementDefectCard key={getImprovementKey(item)} item={item} />
              ))}
            </div>
          </div>
        )}

        {showSelectionSteps && (
          <div className="flex flex-col gap-2">
            <DefaultText>
              Escolha uma das melhorias de atributos da biografia
            </DefaultText>

            {attributeImprovements.length === 0 && (
              <DefaultText>
                Esta biografia não possui melhorias de atributo cadastradas.
              </DefaultText>
            )}

            <div className="flex flex-col gap-2">
              {attributeImprovements.map((item) => {
                const key = getImprovementKey(item);

                return (
                  <div key={key} className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedImprovementKey === key}
                      onChange={() => setSelectedImprovementKey(key)}
                      sx={APP_INPUT_STYLES.checkbox}
                      slotProps={{
                        input: {
                          'aria-label': `Selecionar melhoria ${item.property.name}`,
                        },
                      }}
                    />
                    <div className="flex-1">
                      <ImprovementDefectCard item={item} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {showSelectionSteps && (
          <div className="flex flex-col gap-2">
            <DefaultText>Escolha uma melhoria de atributo livre</DefaultText>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <DefaultTextInput
                id="sheet-biography-assign-free-type"
                label="Tipo"
                value={ATTRIBUTE_TYPE_NAME}
                disabled
              />

              <DefaultTextInput
                id="sheet-biography-assign-free-value"
                label="Valor"
                value={FREE_IMPROVEMENT_VALUE}
                disabled
              />

              <DefaultAutocompleteInput
                id="sheet-biography-assign-free-property"
                label="Propriedade"
                options={attributePropertyOptions}
                getOptionLabel={(property) => property.name}
                value={selectedFreeProperty}
                onChange={(property) => setFreePropertyId(property?.id ?? '')}
                placeholder="Selecione a propriedade"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <SecondaryButton
            type="button"
            onClick={onClose}
            sx={{ width: 'auto', padding: '10px 20px' }}
          >
            Cancelar
          </SecondaryButton>
          <PrimaryButton
            type="button"
            onClick={handleConfirm}
            disabled={!isConfirmEnabled}
            isLoading={isSaving}
            sx={{ width: 'auto', padding: '10px 20px' }}
          >
            Adicionar Biografia
          </PrimaryButton>
        </div>
      </div>

      <ViewModal
        open={isBiographyViewOpen}
        onClose={() => setIsBiographyViewOpen(false)}
        title="Detalhes da Biografia"
        size="wide"
      >
        {biography && <BiographyView biographyId={biography.id} />}
      </ViewModal>
    </FormModal>
  );
};
