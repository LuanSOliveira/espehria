import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const armorFormSchema = z
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
    armorCategoryId: z.string(),
    armorClassBonus: z
      .string()
      .refine(
        (v) => v === '' || /^\d+$/.test(v),
        'Informe um bônus de CA inteiro válido',
      ),
    dexterityModifierLimit: z
      .string()
      .refine(
        (v) => v === '' || (/^\d+$/.test(v) && Number(v) >= 1),
        'Informe um valor inteiro válido (mínimo 1)',
      ),
    strength: z
      .string()
      .refine(
        (v) => v === '' || /^\d+$/.test(v),
        'Informe um valor de força inteiro válido',
      ),
    checkPenalty: z
      .string()
      .refine(
        (v) => v === '' || (/^\d+$/.test(v) && Number(v) >= 1),
        'Informe um valor inteiro válido (mínimo 1)',
      ),
    speedPenaltyMeters: z
      .string()
      .refine(
        (v) => v === '' || /^\d+(\.\d)?$/.test(v),
        'Informe uma penalidade de velocidade válida (no máximo 1 casa decimal)',
      ),
    tagIds: z.array(z.string()).optional(),
    description: z.string(),
    privateInformation: z.string(),
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

export type ArmorFormData = z.infer<typeof armorFormSchema>;

export const armorFormResolver = zodResolver(armorFormSchema);

export const armorFormDefaultValues: ArmorFormData = {
  name: '',
  nickname: '',
  referenceImage: '',
  price: '',
  currencyId: '',
  volume: '',
  armorCategoryId: '',
  armorClassBonus: '',
  dexterityModifierLimit: '',
  strength: '',
  checkPenalty: '',
  speedPenaltyMeters: '',
  tagIds: [],
  description: '',
  privateInformation: '',
};
