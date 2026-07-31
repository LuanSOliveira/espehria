import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const talentFormSchema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  description: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
});

export type TalentFormData = z.infer<typeof talentFormSchema>;

export const talentFormResolver = zodResolver(talentFormSchema);

export const talentFormDefaultValues: TalentFormData = {
  name: '',
  description: '',
  tagIds: [],
};
