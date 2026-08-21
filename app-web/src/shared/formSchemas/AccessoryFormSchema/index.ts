import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { embeddedEffectItemSchema } from '../EmbeddedEffectFormSchema';

export const accessoryFormSchema = z
  .object({
    name: z.string().min(1, 'Informe o nome'),
    referenceImage: z
      .string()
      .refine(
        (value) => value === '' || z.string().url().safeParse(value).success,
        'Informe uma URL de imagem válida',
      ),
    price: z
      .string()
      .refine(
        (value) => value === '' || /^\d+$/.test(value),
        'Informe um preço inteiro válido',
      ),
    currencyId: z.string(),
    volume: z
      .string()
      .refine(
        (v) => v === '' || /^\d+(\.\d)?$/.test(v),
        'Informe um volume válido (no máximo 1 casa decimal)',
      ),
    tagIds: z.array(z.string()).optional(),
    description: z.string(),
    privateInformation: z.string(),
    enchantments: z.array(embeddedEffectItemSchema),
    enhancements: z.array(embeddedEffectItemSchema),
  })
  .superRefine((data, ctx) => {
    if (data.price !== '' && data.currencyId === '') {
      ctx.addIssue({
        code: 'custom',
        message: 'Selecione a moeda quando o preço for informado',
        path: ['currencyId'],
      });
    }
  });

export type AccessoryFormData = z.infer<typeof accessoryFormSchema>;

export const accessoryFormResolver = zodResolver(accessoryFormSchema);

export const accessoryFormDefaultValues: AccessoryFormData = {
  name: '',
  referenceImage: '',
  price: '',
  currencyId: '',
  volume: '',
  tagIds: [],
  description: '',
  privateInformation: '',
  enchantments: [],
  enhancements: [],
};
