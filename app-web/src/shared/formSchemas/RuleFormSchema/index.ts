import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const ruleFormSchema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  description: z.string(),
  sections: z.array(
    z.object({
      label: z.string().min(1, 'Informe o label'),
      description: z.string().optional(),
    }),
  ),
});

export type RuleFormData = z.infer<typeof ruleFormSchema>;

export const ruleFormResolver = zodResolver(ruleFormSchema);

export const ruleFormDefaultValues: RuleFormData = {
  name: '',
  description: '',
  sections: [],
};
