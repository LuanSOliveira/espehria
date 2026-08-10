import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const trainingFormSchema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  description: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
  level: z
    .string()
    .min(1, 'Informe o level')
    .refine((value) => /^\d+$/.test(value), 'Informe um número inteiro')
    .refine((value) => Number(value) >= 1, 'O level deve ser no mínimo 1'),
});

export type TrainingFormData = z.infer<typeof trainingFormSchema>;

export const trainingFormResolver = zodResolver(trainingFormSchema);

export const trainingFormDefaultValues: TrainingFormData = {
  name: '',
  description: '',
  tagIds: [],
  level: '',
};
