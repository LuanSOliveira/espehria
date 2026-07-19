import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const userBaseFields = {
  name: z.string().min(1, 'Informe o nome').min(2, 'Nome muito curto'),
  email: z.string().min(1, 'Informe o e-mail').email('Informe um e-mail válido'),
};

export const userFormSchema = z.object({
  ...userBaseFields,
  password: z
    .string()
    .min(1, 'Informe a senha')
    .min(8, 'A senha deve ter no mínimo 8 caracteres'),
});

export type UserFormData = z.infer<typeof userFormSchema>;

export const userFormResolver = zodResolver(userFormSchema);

export const userFormDefaultValues: UserFormData = {
  name: '',
  email: '',
  password: '',
};

export const userEditFormSchema = z.object({
  ...userBaseFields,
  password: z.union([
    z.literal(''),
    z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
  ]),
});

export const userEditFormResolver = zodResolver(userEditFormSchema);
