import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const plannedSessionFormSchema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  introduction: z.string(),
  tagIds: z.array(z.string()).optional(),
  sections: z.array(
    z.object({
      label: z.string().min(1, 'Informe o label'),
      description: z.string().optional(),
    }),
  ),
});

export type PlannedSessionFormData = z.infer<typeof plannedSessionFormSchema>;

export const plannedSessionFormResolver = zodResolver(
  plannedSessionFormSchema,
);

export const plannedSessionFormDefaultValues: PlannedSessionFormData = {
  name: '',
  introduction: '',
  tagIds: [],
  sections: [],
};
