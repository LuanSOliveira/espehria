'use client';

import { Control, useFieldArray } from 'react-hook-form';
import { IconButton, Tooltip } from '@mui/material';
import { FiTrash2 } from 'react-icons/fi';
import { FormRichTextInput, FormTextInput } from '@/shared/components/Inputs';
import { SecondaryButton } from '@/shared/components/Buttons';
import { ConditionFormData } from '@/shared/formSchemas';
import { APP_COLORS } from '@/shared/constants';

export interface ConditionSectionsFieldProps {
  control: Control<ConditionFormData>;
}

export const ConditionSectionsField = ({
  control,
}: ConditionSectionsFieldProps) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'sections',
  });

  return (
    <div className="flex flex-col gap-4">
      {fields.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex flex-col gap-3">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <FormTextInput
                    id={`condition-section-label-${index}`}
                    name={`sections.${index}.label`}
                    control={control}
                    label="Label"
                    placeholder="Digite o label da seção"
                  />
                </div>

                <Tooltip title="Remover seção">
                  <IconButton
                    aria-label={`Remover seção ${index + 1}`}
                    onClick={() => remove(index)}
                    sx={{ color: APP_COLORS.textBrownDark, marginBottom: '4px' }}
                  >
                    <FiTrash2 />
                  </IconButton>
                </Tooltip>
              </div>

              <FormRichTextInput
                id={`condition-section-description-${index}`}
                name={`sections.${index}.description`}
                control={control}
                label="Descrição"
                placeholder="Descreva a seção"
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <SecondaryButton
          type="button"
          onClick={() => append({ label: '', description: '' })}
        >
          Adicionar Seção
        </SecondaryButton>
      </div>
    </div>
  );
};
