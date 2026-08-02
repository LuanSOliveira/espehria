import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const sheetFormSchema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  campaignId: z.string().optional(),
  referenceImage: z
    .string()
    .refine(
      (value) => value === '' || z.string().url().safeParse(value).success,
      'Informe uma URL de imagem válida',
    ),
});

export type SheetFormData = z.infer<typeof sheetFormSchema>;

export const sheetFormResolver = zodResolver(sheetFormSchema);

export const sheetFormDefaultValues: SheetFormData = {
  name: '',
  campaignId: '',
  referenceImage: '',
};
