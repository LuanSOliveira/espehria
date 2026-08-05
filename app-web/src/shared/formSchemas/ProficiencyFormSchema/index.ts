import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const proficiencyFormSchema = z.object({
  propertyId: z.string().min(1, 'Selecione a propriedade'),
  gradationId: z.string().min(1, 'Selecione a graduação'),
});

export type ProficiencyFormData = z.infer<typeof proficiencyFormSchema>;

export const proficiencyFormResolver = zodResolver(proficiencyFormSchema);

export const proficiencyFormDefaultValues: ProficiencyFormData = {
  propertyId: '',
  gradationId: '',
};
