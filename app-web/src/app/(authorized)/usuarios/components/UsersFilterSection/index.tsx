import { SubmitEvent } from 'react';
import { FiSearch } from 'react-icons/fi';

import { DefaultTextInput } from '@/shared/components/Inputs';
import { PrimaryButton } from '@/shared/components/Buttons';

export interface UsersFilterSectionProps {
  emailValue: string;
  onEmailChange: (value: string) => void;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
}

export const UsersFilterSection = ({
  emailValue,
  onEmailChange,
  onSubmit,
}: UsersFilterSectionProps) => {
  return (
    <form onSubmit={onSubmit} className="mt-6 flex max-w-90 items-end gap-3">
      <div className="flex-1">
        <DefaultTextInput
          id="users-email-filter"
          label="E-mail"
          placeholder="Buscar por e-mail"
          value={emailValue}
          onChange={(event) => onEmailChange(event.target.value)}
          icon={<FiSearch />}
        />
      </div>
      <PrimaryButton type="submit" sx={{ width: 'auto', padding: '12px 24px' }}>
        Filtrar
      </PrimaryButton>
    </form>
  );
};
