'use client';

import { useState } from 'react';
import { Control, useFieldArray } from 'react-hook-form';
import { IconButton, Tooltip } from '@mui/material';
import { FiTrash2 } from 'react-icons/fi';
import { FormRichTextInput, FormTextInput } from '@/shared/components/Inputs';
import { SecondaryButton } from '@/shared/components/Buttons';
import { DefaultText } from '@/shared/components/Texts';
import {
  weaponEmbeddedEffectItemDefaultValues,
  WeaponFormData,
} from '@/shared/formSchemas';
import { APP_COLORS } from '@/shared/constants';
import { WeaponEmbeddedEffectChoiceModal } from './WeaponEmbeddedEffectChoiceModal';
import { WeaponEmbeddedEffectPickerModal } from './WeaponEmbeddedEffectPickerModal';

export interface WeaponEmbeddedEffectsTabPanelProps {
  control: Control<WeaponFormData>;
  active: boolean;
  fieldName: 'enchantments' | 'enhancements';
  entityLabel: string;
  entityUrl: '/enchantments' | '/enhancements';
  addButtonLabel: string;
}

export const WeaponEmbeddedEffectsTabPanel = ({
  control,
  active,
  fieldName,
  entityLabel,
  entityUrl,
  addButtonLabel,
}: WeaponEmbeddedEffectsTabPanelProps) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: fieldName,
  });

  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
  const [isPickerModalOpen, setIsPickerModalOpen] = useState(false);

  return (
    <div
      className="flex flex-col gap-4"
      style={active ? undefined : { display: 'none' }}
    >
      {fields.length > 0 && (
        <div className="flex flex-col gap-4">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-2">
              <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
                <FormTextInput
                  id={`weapon-form-${fieldName}-${index}-name`}
                  name={`${fieldName}.${index}.name`}
                  control={control}
                  label="Nome"
                  placeholder="Digite o nome"
                />

                <FormRichTextInput
                  id={`weapon-form-${fieldName}-${index}-effect`}
                  name={`${fieldName}.${index}.effect`}
                  control={control}
                  label="Efeito"
                  placeholder="Descreva o efeito"
                />
              </div>

              <Tooltip title="Remover item">
                <IconButton
                  aria-label={`Remover item ${index + 1} de ${entityLabel}`}
                  onClick={() => remove(index)}
                  sx={{ color: APP_COLORS.textBrownDark, marginTop: '20px' }}
                >
                  <FiTrash2 />
                </IconButton>
              </Tooltip>
            </div>
          ))}
        </div>
      )}

      {fields.length === 0 && (
        <DefaultText>Nenhum item adicionado.</DefaultText>
      )}

      <div className="flex justify-end">
        <SecondaryButton
          type="button"
          onClick={() => setIsChoiceModalOpen(true)}
        >
          {addButtonLabel}
        </SecondaryButton>
      </div>

      <WeaponEmbeddedEffectChoiceModal
        open={isChoiceModalOpen}
        onClose={() => setIsChoiceModalOpen(false)}
        entityLabel={entityLabel}
        onCreateBlank={() => append(weaponEmbeddedEffectItemDefaultValues)}
        onSelectExisting={() => setIsPickerModalOpen(true)}
      />

      <WeaponEmbeddedEffectPickerModal
        open={isPickerModalOpen}
        onClose={() => setIsPickerModalOpen(false)}
        entityLabel={entityLabel}
        entityUrl={entityUrl}
        onSelect={(item) =>
          append({ name: item.name, effect: item.effect ?? '' })
        }
      />
    </div>
  );
};
