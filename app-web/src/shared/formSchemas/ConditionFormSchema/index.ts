import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const conditionFormSchema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  description: z.string(),
  tagIds: z.array(z.string()).optional(),
  sections: z.array(
    z.object({
      label: z.string().min(1, 'Informe o label'),
      description: z.string().optional(),
    }),
  ),
});

export type ConditionFormData = z.infer<typeof conditionFormSchema>;

export const conditionFormResolver = zodResolver(conditionFormSchema);

export const conditionFormDefaultValues: ConditionFormData = {
  name: '',
  description: '',
  tagIds: [],
  sections: [],
};
