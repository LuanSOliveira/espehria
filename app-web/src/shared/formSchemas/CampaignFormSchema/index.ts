import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const campaignFormSchema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  referenceImageUrl: z
    .string()
    .refine(
      (value) => value === '' || z.string().url().safeParse(value).success,
      'Informe uma URL de imagem válida',
    ),
  description: z.string(),
  tagIds: z.array(z.string()).optional(),
  sections: z.array(
    z.object({
      label: z.string().min(1, 'Informe o label'),
      description: z.string().optional(),
    }),
  ),
});

export type CampaignFormData = z.infer<typeof campaignFormSchema>;

export const campaignFormResolver = zodResolver(campaignFormSchema);

export const campaignFormDefaultValues: CampaignFormData = {
  name: '',
  referenceImageUrl: '',
  description: '',
  tagIds: [],
  sections: [],
};
