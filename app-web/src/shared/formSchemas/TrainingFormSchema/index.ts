import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const trainingFormSchema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  description: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
});

export type TrainingFormData = z.infer<typeof trainingFormSchema>;

export const trainingFormResolver = zodResolver(trainingFormSchema);

export const trainingFormDefaultValues: TrainingFormData = {
  name: '',
  description: '',
  tagIds: [],
};
