'use client';

import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { Box } from '@mui/material';
import { FiLock, FiMail } from 'react-icons/fi';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';

import { Card } from '@/shared/components/Containers';
import { FormPasswordInput, FormTextInput } from '@/shared/components/Inputs';
import { PrimaryButton } from '@/shared/components/Buttons';
import { DefaultText, Label } from '@/shared/components/Texts';
import { FontAccessibilityControls } from '@/shared/components/FontAccessibilityControls';
import {
  LoginFormData,
  loginFormDefaultValues,
  loginFormResolver,
} from '@/shared/formSchemas';
import { APP_COLORS } from '@/shared/constants';
import { useGoogleLoginMutation, useLoginMutation } from '@/hooks/Auth';
import { showToast } from '@/shared/util';

export default function LoginPage() {
  const { control, handleSubmit } = useForm<LoginFormData>({
    resolver: loginFormResolver,
    defaultValues: loginFormDefaultValues,
  });

  const loginMutation = useLoginMutation();
  const googleLoginMutation = useGoogleLoginMutation();

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const handleGoogleSuccess = (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      showToast({
        message: 'Não foi possível entrar com o Google.',
        type: 'error',
      });
      return;
    }

    googleLoginMutation.mutate({ idToken: credentialResponse.credential });
  };

  const handleGoogleError = () => {
    showToast({
      message: 'Não foi possível entrar com o Google.',
      type: 'error',
    });
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
      <Box sx={{ position: 'fixed', top: 16, right: 16, zIndex: 50 }}>
        <FontAccessibilityControls />
      </Box>

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

        <Label htmlFor="email">E-mail</Label>
        <FormTextInput
          id="email"
          name="email"
          type="email"
          control={control}
          placeholder="Digite seu e-mail"
          icon={<FiMail />}
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
          <PrimaryButton type="submit" isLoading={loginMutation.isPending}>
            Entrar
          </PrimaryButton>
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

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            theme="filled_black"
            shape="rectangular"
            text="continue_with"
            width="356"
          />
        </Box>
      </Card>
    </Box>
  );
}
