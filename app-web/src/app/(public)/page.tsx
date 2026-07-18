'use client';

import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { Box } from '@mui/material';
import { FiLock, FiUser } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';

import { Card } from '@/shared/components/Containers';
import { FormPasswordInput, FormTextInput } from '@/shared/components/Inputs';
import { PrimaryButton, SecondaryButton } from '@/shared/components/Buttons';
import { DefaultText, Label } from '@/shared/components/Texts';
import { FontAccessibilityControls } from '@/shared/components/FontAccessibilityControls';
import {
  LoginFormData,
  loginFormDefaultValues,
  loginFormResolver,
} from '@/shared/formSchemas';
import { APP_COLORS } from '@/shared/constants';

export default function LoginPage() {
  const { control, handleSubmit } = useForm<LoginFormData>({
    resolver: loginFormResolver,
    defaultValues: loginFormDefaultValues,
  });

  const onSubmit = (data: LoginFormData) => {
    console.log(data);
  };

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 16px',
        backgroundImage: 'url(/app-bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <FontAccessibilityControls />

      <Card component="form" onSubmit={handleSubmit(onSubmit)}>
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            maxWidth: 220,
            aspectRatio: '3 / 2',
            margin: '0 auto',
          }}
        >
          <Image
            src="/app-logo.png"
            alt="Espehria"
            fill
            style={{ objectFit: 'contain' }}
            priority
          />
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            margin: '24px 0 20px',
          }}
        >
          <DefaultText component="span" baseFontSize={10} sx={{ color: APP_COLORS.gold }}>
            ◆
          </DefaultText>
          <DefaultText
            component="span"
            sx={{
              letterSpacing: '3px',
              textTransform: 'uppercase',
              color: APP_COLORS.textBrown,
            }}
          >
            Acesse sua conta
          </DefaultText>
          <DefaultText component="span" baseFontSize={10} sx={{ color: APP_COLORS.gold }}>
            ◆
          </DefaultText>
        </Box>

        <Label htmlFor="username">Usuário</Label>
        <FormTextInput
          id="username"
          name="username"
          control={control}
          placeholder="Digite seu usuário"
          icon={<FiUser />}
        />

        <Box sx={{ marginTop: '16px' }}>
          <Label htmlFor="password">Senha</Label>
          <FormPasswordInput
            id="password"
            name="password"
            control={control}
            placeholder="Digite sua senha"
            icon={<FiLock />}
          />
        </Box>

        <Box sx={{ marginTop: '22px' }}>
          <PrimaryButton type="submit">Entrar</PrimaryButton>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '18px 0' }}>
          <Box
            sx={{
              flex: 1,
              height: '1px',
              backgroundImage: `linear-gradient(90deg, transparent, ${APP_COLORS.gold}, transparent)`,
            }}
          />
          <DefaultText
            component="span"
            baseFontSize={11}
            sx={{ letterSpacing: '2px', color: APP_COLORS.textBrownLight }}
          >
            OU
          </DefaultText>
          <Box
            sx={{
              flex: 1,
              height: '1px',
              backgroundImage: `linear-gradient(90deg, transparent, ${APP_COLORS.gold}, transparent)`,
            }}
          />
        </Box>

        <SecondaryButton type="button" icon={<FcGoogle />}>
          Continuar com Google
        </SecondaryButton>
      </Card>
    </Box>
  );
}
