import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { embeddedEffectItemSchema } from '../EmbeddedEffectFormSchema';

export const shieldFormSchema = z
  .object({
    name: z.string().min(1, 'Informe o nome'),
    nickname: z.string(),
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
    armorClassBonus: z
      .string()
      .refine(
        (v) => v === '' || /^\d+$/.test(v),
        'Informe um bônus de CA inteiro válido',
      ),
    speedPenaltyMeters: z
      .string()
      .refine(
        (v) => v === '' || /^\d+(\.\d)?$/.test(v),
        'Informe uma penalidade de velocidade válida (no máximo 1 casa decimal)',
      ),
    hardness: z
      .string()
      .refine(
        (v) => v === '' || /^\d+$/.test(v),
        'Informe um valor de dureza inteiro válido',
      ),
    hitPoints: z
      .string()
      .refine(
        (v) => v === '' || /^\d+$/.test(v),
        'Informe um valor de pontos de vida inteiro válido',
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

export type ShieldFormData = z.infer<typeof shieldFormSchema>;

export const shieldFormResolver = zodResolver(shieldFormSchema);

export const shieldFormDefaultValues: ShieldFormData = {
  name: '',
  nickname: '',
  referenceImage: '',
  price: '',
  currencyId: '',
  volume: '',
  armorClassBonus: '',
  speedPenaltyMeters: '',
  hardness: '',
  hitPoints: '',
  tagIds: [],
  description: '',
  privateInformation: '',
  enchantments: [],
  enhancements: [],
};
