import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { isRichTextEmpty } from '@/shared/util';

export const creatureFormSchema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  referenceImageUrl: z
    .string()
    .refine(
      (value) => value === '' || z.string().url().safeParse(value).success,
      'Informe uma URL de imagem válida',
    ),
  otherNames: z.string(),
  categoryId: z.string().min(1, 'Selecione a categoria'),
  threatLevel: z.string(),
  averageLifeExpectancy: z.string(),
  physicalCharacteristics: z
    .string()
    .refine(
      (value) => !isRichTextEmpty(value),
      'Informe as características físicas',
    ),
  habitat: z.string(),
  behavior: z.string(),
  diet: z.string(),
  lifeCycle: z.string(),
  lifeStageInfant: z.string(),
  lifeStageYoung: z.string(),
  lifeStageAdult: z.string(),
  lifeStageElder: z.string(),
  abilitiesAndPowers: z.string(),
  resistances: z.string(),
  weaknesses: z.string(),
  combat: z.string(),
  attackMethods: z.string(),
  strategy: z.string(),
  dangerDegree: z.string(),
  obtainedResources: z.string(),
  commercialValue: z.string(),
  relationWithCivilizations: z.string(),
  mythologyAndFolklore: z.string(),
  encounterRecord: z.string(),
  scholarsCuriosity: z.string(),
  tagIds: z.array(z.string()).optional(),
});

export type CreatureFormData = z.infer<typeof creatureFormSchema>;

export const creatureFormResolver = zodResolver(creatureFormSchema);

export const creatureFormDefaultValues: CreatureFormData = {
  name: '',
  referenceImageUrl: '',
  otherNames: '',
  categoryId: '',
  threatLevel: '',
  averageLifeExpectancy: '',
  physicalCharacteristics: '',
  habitat: '',
  behavior: '',
  diet: '',
  lifeCycle: '',
  lifeStageInfant: '',
  lifeStageYoung: '',
  lifeStageAdult: '',
  lifeStageElder: '',
  abilitiesAndPowers: '',
  resistances: '',
  weaknesses: '',
  combat: '',
  attackMethods: '',
  strategy: '',
  dangerDegree: '',
  obtainedResources: '',
  commercialValue: '',
  relationWithCivilizations: '',
  mythologyAndFolklore: '',
  encounterRecord: '',
  scholarsCuriosity: '',
  tagIds: [],
};
