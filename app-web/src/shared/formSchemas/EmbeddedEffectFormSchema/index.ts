import { z } from 'zod';

export const embeddedEffectItemSchema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  effect: z.string(),
});

export type EmbeddedEffectItemFormData = z.infer<
  typeof embeddedEffectItemSchema
>;

export const embeddedEffectItemDefaultValues: EmbeddedEffectItemFormData = {
  name: '',
  effect: '',
};
