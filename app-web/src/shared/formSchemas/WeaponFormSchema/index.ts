import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const weaponDamageItemSchema = z.object({
  damageValue: z
    .string()
    .refine(
      (v) => v === '' || /^\d+$/.test(v),
      'Informe um valor de dano inteiro válido',
    ),
  damageDie: z.string(),
  damageTypeId: z.string(),
  magicalDamage: z.boolean(),
  distanceMeters: z
    .string()
    .refine(
      (v) => v === '' || /^\d+(\.\d)?$/.test(v),
      'Informe uma distância válida (no máximo 1 casa decimal)',
    ),
  usesAmmunition: z.boolean(),
  reloadActions: z
    .string()
    .refine(
      (v) => v === '' || /^\d+$/.test(v),
      'Informe um valor de ações de recarga inteiro válido',
    ),
});

export type WeaponDamageItemFormData = z.infer<typeof weaponDamageItemSchema>;

export const weaponDamageItemDefaultValues: WeaponDamageItemFormData = {
  damageValue: '',
  damageDie: '',
  damageTypeId: '',
  magicalDamage: false,
  distanceMeters: '',
  usesAmmunition: false,
  reloadActions: '',
};

export const weaponEmbeddedEffectItemSchema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  effect: z.string(),
});

export type WeaponEmbeddedEffectItemFormData = z.infer<
  typeof weaponEmbeddedEffectItemSchema
>;

export const weaponEmbeddedEffectItemDefaultValues: WeaponEmbeddedEffectItemFormData =
  {
    name: '',
    effect: '',
  };

export const weaponFormSchema = z
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
    sizeGradeId: z.string(),
    hands: z.string(),
    weaponStyle: z.string(),
    damageValue: z
      .string()
      .refine(
        (v) => v === '' || /^\d+$/.test(v),
        'Informe um valor de dano inteiro válido',
      ),
    damageDie: z.string(),
    damageTypeId: z.string(),
    magicalDamage: z.boolean(),
    distanceMeters: z
      .string()
      .refine(
        (v) => v === '' || /^\d+(\.\d)?$/.test(v),
        'Informe uma distância válida (no máximo 1 casa decimal)',
      ),
    usesAmmunition: z.boolean(),
    reloadActions: z
      .string()
      .refine(
        (v) => v === '' || /^\d+$/.test(v),
        'Informe um valor de ações de recarga inteiro válido',
      ),
    tagIds: z.array(z.string()).optional(),
    description: z.string(),
    privateInformation: z.string(),
    alternativeDamages: z.array(weaponDamageItemSchema),
    extraDamages: z.array(weaponDamageItemSchema),
    enchantments: z.array(weaponEmbeddedEffectItemSchema),
    enhancements: z.array(weaponEmbeddedEffectItemSchema),
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
  nickname: '',
  referenceImage: '',
  price: '',
  currencyId: '',
  volume: '',
  sizeGradeId: '',
  hands: '',
  weaponStyle: '',
  damageValue: '',
  damageDie: '',
  damageTypeId: '',
  magicalDamage: false,
  distanceMeters: '',
  usesAmmunition: false,
  reloadActions: '',
  tagIds: [],
  description: '',
  privateInformation: '',
  alternativeDamages: [],
  extraDamages: [],
  enchantments: [],
  enhancements: [],
};
