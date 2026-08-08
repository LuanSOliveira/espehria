import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const weaponFormSchema = z
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

export type WeaponFormData = z.infer<typeof weaponFormSchema>;

export const weaponFormResolver = zodResolver(weaponFormSchema);

export const weaponFormDefaultValues: WeaponFormData = {
  name: '',
  referenceImage: '',
  price: '',
  currencyId: '',
  tagIds: [],
  description: '',
  privateInformation: '',
};
