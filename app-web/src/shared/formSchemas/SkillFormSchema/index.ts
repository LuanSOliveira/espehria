import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const skillFormSchema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  description: z.string(),
  keyAttributeId: z.string().min(1, 'Selecione o atributo chave'),
  tagIds: z.array(z.string()).optional(),
  sections: z.array(
    z.object({
      label: z.string().min(1, 'Informe o label'),
      description: z.string().optional(),
    }),
  ),
});

export type SkillFormData = z.infer<typeof skillFormSchema>;

export const skillFormResolver = zodResolver(skillFormSchema);

export const skillFormDefaultValues: SkillFormData = {
  name: '',
  description: '',
  keyAttributeId: '',
  tagIds: [],
  sections: [],
};
