'use client';

import { Control, useFieldArray } from 'react-hook-form';
import { IconButton, Tooltip } from '@mui/material';
import { FiTrash2 } from 'react-icons/fi';
import {
  FormAutocompleteInput,
  FormCheckboxInput,
  FormTextInput,
} from '@/shared/components/Inputs';
import { SecondaryButton } from '@/shared/components/Buttons';
import { Label } from '@/shared/components/Texts';
import {
  weaponDamageItemDefaultValues,
  WeaponFormData,
} from '@/shared/formSchemas';
import { APP_COLORS, WEAPON_DAMAGE_DIE_OPTIONS } from '@/shared/constants';
import { IDamageType } from '@/shared/interfaces';

export interface WeaponDamagesFieldProps {
  control: Control<WeaponFormData>;
  name: 'alternativeDamages' | 'extraDamages';
  title: string;
  addButtonLabel: string;
  damageTypeOptions: IDamageType[];
}

export const WeaponDamagesField = ({
  control,
  name,
  title,
  addButtonLabel,
  damageTypeOptions,
}: WeaponDamagesFieldProps) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  return (
    <div className="flex flex-col gap-4">
      <Label component="span" sx={{ margin: 0 }}>
        {title}
      </Label>

      {fields.length > 0 && (
        <div className="flex flex-col gap-4">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-2">
              <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <FormTextInput
                  id={`weapon-form-${name}-${index}-damage-value`}
                  name={`${name}.${index}.damageValue`}
                  control={control}
                  label="Valor"
                  placeholder="Digite o valor de dano"
                  type="number"
                  slotProps={{
                    htmlInput: { min: 0, step: 1, inputMode: 'numeric' },
                  }}
                />

                <FormAutocompleteInput<
                  WeaponFormData,
                  (typeof WEAPON_DAMAGE_DIE_OPTIONS)[number]
                >
                  id={`weapon-form-${name}-${index}-damage-die`}
                  name={`${name}.${index}.damageDie`}
                  control={control}
                  label="Dado"
                  options={WEAPON_DAMAGE_DIE_OPTIONS}
                  getOptionLabel={(option) => option.label}
                  getOptionValue={(option) => option.value}
                  placeholder="Selecione o dado"
                />

                <FormAutocompleteInput<WeaponFormData, IDamageType>
                  id={`weapon-form-${name}-${index}-damage-type`}
                  name={`${name}.${index}.damageTypeId`}
                  control={control}
                  label="Tipo de dano"
                  options={damageTypeOptions}
                  getOptionLabel={(damageType) => damageType.name}
                  getOptionValue={(damageType) => damageType.id}
                  placeholder="Selecione o tipo de dano"
                />

                <FormCheckboxInput
                  id={`weapon-form-${name}-${index}-magical-damage`}
                  name={`${name}.${index}.magicalDamage`}
                  control={control}
                  label="Dano mágico"
                />

                <FormTextInput
                  id={`weapon-form-${name}-${index}-distance-meters`}
                  name={`${name}.${index}.distanceMeters`}
                  control={control}
                  label="Distância (Metros)"
                  placeholder="Digite a distância"
                  type="number"
                  slotProps={{
                    htmlInput: { min: 0, step: 0.1, inputMode: 'decimal' },
                  }}
                />

                <FormTextInput
                  id={`weapon-form-${name}-${index}-reload-actions`}
                  name={`${name}.${index}.reloadActions`}
                  control={control}
                  label="Ações de Recarga"
                  placeholder="Digite as ações de recarga"
                  type="number"
                  slotProps={{
                    htmlInput: { min: 0, step: 1, inputMode: 'numeric' },
                  }}
                />

                <FormCheckboxInput
                  id={`weapon-form-${name}-${index}-uses-ammunition`}
                  name={`${name}.${index}.usesAmmunition`}
                  control={control}
                  label="Usa Munição?"
                />
              </div>

              <Tooltip title="Remover item">
                <IconButton
                  aria-label={`Remover item ${index + 1} de ${title}`}
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

      <div className="flex justify-end">
        <SecondaryButton
          type="button"
          onClick={() => append(weaponDamageItemDefaultValues)}
        >
          {addButtonLabel}
        </SecondaryButton>
      </div>
    </div>
  );
};
