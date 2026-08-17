import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const enchantmentFormSchema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  type: z.string(),
  effect: z.string(),
});

export type EnchantmentFormData = z.infer<typeof enchantmentFormSchema>;

export const enchantmentFormResolver = zodResolver(enchantmentFormSchema);

export const enchantmentFormDefaultValues: EnchantmentFormData = {
  name: '',
  type: '',
  effect: '',
};
