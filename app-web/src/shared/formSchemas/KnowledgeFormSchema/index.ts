import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const knowledgeFormSchema = z.object({
  title: z.string().trim().min(1, 'Informe o título'),
  gradationId: z.string().min(1, 'Selecione a graduação'),
  editable: z.boolean(),
});

export type KnowledgeFormData = z.infer<typeof knowledgeFormSchema>;

export const knowledgeFormResolver = zodResolver(knowledgeFormSchema);

export const knowledgeFormDefaultValues: KnowledgeFormData = {
  title: '',
  gradationId: '',
  editable: false,
};
