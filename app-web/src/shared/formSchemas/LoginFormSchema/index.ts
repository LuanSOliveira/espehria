import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const loginFormSchema = z.object({
  username: z.string().min(1, 'Informe o usuário'),
  password: z.string().min(1, 'Informe a senha'),
});

export type LoginFormData = z.infer<typeof loginFormSchema>;

export const loginFormResolver = zodResolver(loginFormSchema);

export const loginFormDefaultValues: LoginFormData = {
  username: '',
  password: '',
};
