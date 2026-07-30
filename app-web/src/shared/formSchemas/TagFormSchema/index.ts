import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const tagFormSchema = z.object({
  name: z.string().min(1, 'Informe o nome').min(2, 'Nome muito curto'),
  color: z
    .string()
    .min(1, 'Informe a cor')
    .regex(/^#([0-9A-Fa-f]{6})$/, 'Informe uma cor válida'),
  type: z.string().max(100, 'Tipo deve ter no máximo 100 caracteres').optional(),
});

export type TagFormData = z.infer<typeof tagFormSchema>;

export const tagFormResolver = zodResolver(tagFormSchema);

export const tagFormDefaultValues: TagFormData = {
  name: '',
  color: '#000000',
  type: '',
};
