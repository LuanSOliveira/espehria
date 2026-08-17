import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const enhancementFormSchema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  type: z.string(),
  effect: z.string(),
});

export type EnhancementFormData = z.infer<typeof enhancementFormSchema>;

export const enhancementFormResolver = zodResolver(enhancementFormSchema);

export const enhancementFormDefaultValues: EnhancementFormData = {
  name: '',
  type: '',
  effect: '',
};
