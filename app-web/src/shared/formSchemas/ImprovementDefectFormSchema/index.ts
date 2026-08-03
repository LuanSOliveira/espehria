import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const improvementDefectFormSchema = z.object({
  value: z
    .string()
    .min(1, 'Informe o valor')
    .refine((value) => /^\d+$/.test(value), 'Informe um número inteiro')
    .refine((value) => Number(value) >= 1, 'O valor deve ser no mínimo 1'),
  typeId: z.string().min(1, 'Selecione o tipo'),
  propertyId: z.string().min(1, 'Selecione a propriedade'),
});

export type ImprovementDefectFormData = z.infer<
  typeof improvementDefectFormSchema
>;

export const improvementDefectFormResolver = zodResolver(
  improvementDefectFormSchema,
);

export const improvementDefectFormDefaultValues: ImprovementDefectFormData = {
  value: '',
  typeId: '',
  propertyId: '',
};
