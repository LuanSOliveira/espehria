'use client';

import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { FiLock, FiMail } from 'react-icons/fi';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';

import { Card } from '@/shared/components/Containers';
import { FormPasswordInput, FormTextInput } from '@/shared/components/Inputs';
import { PrimaryButton } from '@/shared/components/Buttons';
import { DefaultText } from '@/shared/components/Texts';
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
    <main className="flex min-h-screen items-center justify-center bg-[url(/app-bg.png)] bg-cover bg-center px-4 py-10">
      <div className="fixed top-4 right-4 z-50">
        <FontAccessibilityControls />
      </div>

      <Card component="form" onSubmit={handleSubmit(onSubmit)}>
        <div className="relative mx-auto aspect-3/2 w-full max-w-55">
          <Image
            src="/app-logo.png"
            alt="Espehria"
            fill
            style={{ objectFit: 'contain' }}
            priority
          />
        </div>

        <div className="mt-6 mb-5 flex items-center justify-center gap-2.5">
          <DefaultText
            component="span"
            baseFontSize={10}
            sx={{ color: APP_COLORS.gold }}
          >
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
          <DefaultText
            component="span"
            baseFontSize={10}
            sx={{ color: APP_COLORS.gold }}
          >
            ◆
          </DefaultText>
        </div>

        <FormTextInput
          id="email"
          name="email"
          type="email"
          control={control}
          label="E-mail"
          placeholder="Digite seu e-mail"
          icon={<FiMail />}
        />

        <div className="mt-4">
          <FormPasswordInput
            id="password"
            name="password"
            control={control}
            label="Senha"
            placeholder="Digite sua senha"
            icon={<FiLock />}
          />
        </div>

        <div className="mt-5.5">
          <PrimaryButton type="submit" isLoading={loginMutation.isPending}>
            Entrar
          </PrimaryButton>
        </div>

        <div className="my-4.5 flex items-center gap-2.5">
          <div
            className="h-px flex-1"
            style={{
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
          <div
            className="h-px flex-1"
            style={{
              backgroundImage: `linear-gradient(90deg, transparent, ${APP_COLORS.gold}, transparent)`,
            }}
          />
        </div>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            theme="filled_black"
            shape="rectangular"
            text="continue_with"
            width="356"
          />
        </div>
      </Card>
    </main>
  );
}
