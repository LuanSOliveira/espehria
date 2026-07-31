import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const characteristicFormSchema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  description: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
  level: z
    .string()
    .min(1, 'Informe o level')
    .refine((value) => /^\d+$/.test(value), 'Informe um número inteiro')
    .refine((value) => Number(value) >= 1, 'O level deve ser no mínimo 1'),
});

export type CharacteristicFormData = z.infer<typeof characteristicFormSchema>;

export const characteristicFormResolver = zodResolver(characteristicFormSchema);

export const characteristicFormDefaultValues: CharacteristicFormData = {
  name: '',
  description: '',
  tagIds: [],
  level: '',
};
