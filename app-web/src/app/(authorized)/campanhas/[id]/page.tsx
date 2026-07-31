'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Chip, CircularProgress } from '@mui/material';
import { FiAlertTriangle, FiFileText } from 'react-icons/fi';

import { PageContainer } from '@/shared/components/Containers';
import { DefaultText, Label, Title } from '@/shared/components/Texts';
import { ImageAvatarPreview } from '@/shared/components/ImageAvatarPreview';
import { RichTextViewer } from '@/shared/components/RichTextViewer';
import { SecondaryButton } from '@/shared/components/Buttons';
import { useGetEntityById } from '@/hooks/Queries';
import { ICampaign } from '@/shared/interfaces';
import { getContrastTextColor, showToast } from '@/shared/util';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';
import { APP_ROUTES } from '@/shared/routes';
import { CampaignSectionCard } from '../components/CampaignSectionCard';
import { PlannedSessionsSection } from './components/PlannedSessionsSection';

interface CampaignDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default function CampaignDetailsPage({
  params,
}: CampaignDetailsPageProps) {
  const { id: campaignId } = use(params);
  const router = useRouter();

  const {
    data: campaign,
    isLoading,
    isError,
    error,
  } = useGetEntityById<ICampaign>({ url: `/campaigns/${campaignId}` });

  const isNotFound = error?.response?.status === 404;

  useEffect(() => {
    if (!isError) {
      return;
    }

    showToast({
      message:
        error?.response?.data?.message ??
        'Não foi possível carregar os dados da campanha.',
      type: 'error',
    });

    if (isNotFound) {
      router.push(APP_ROUTES.private.campaigns);
    }
  }, [isError, isNotFound, error, router]);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center gap-3 py-6">
          <CircularProgress size={28} />
          <DefaultText>Carregando dados da campanha...</DefaultText>
        </div>
      </PageContainer>
    );
  }

  if (isError && !isNotFound) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center gap-3 py-10">
          <FiAlertTriangle
            style={{ fontSize: 40, color: APP_COLORS.goldSoft }}
          />
          <DefaultText sx={{ textAlign: 'center' }}>
            Não foi possível carregar os dados da campanha.
          </DefaultText>
          <SecondaryButton
            onClick={() => router.push(APP_ROUTES.private.campaigns)}
          >
            Voltar para Campanhas
          </SecondaryButton>
        </div>
      </PageContainer>
    );
  }

  if (!campaign) {
    return null;
  }

  return (
    <PageContainer>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <ImageAvatarPreview
          imageUrl={campaign.referenceImageUrl}
          alt={campaign.name}
          size={100}
        />

        <div className="flex flex-col gap-2">
          <Title component="h1" sx={{ textAlign: 'left' }}>
            {campaign.name}
          </Title>

          {campaign.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {campaign.tags.map((tag) => (
                <Chip
                  key={tag.id}
                  label={tag.name}
                  size="small"
                  sx={{
                    backgroundColor: tag.color,
                    color: getContrastTextColor(tag.color),
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        <div style={APP_CONTAINER_STYLES.detailSectionBox}>
          <div
            className="flex items-center gap-2 px-3 py-2"
            style={APP_CONTAINER_STYLES.detailSectionBoxHeader}
          >
            <FiFileText style={{ fontSize: 16, color: APP_COLORS.goldSoft }} />
            <Label component="span" sx={{ margin: 0, color: APP_COLORS.goldSoft }}>
              Descrição
            </Label>
          </div>
          <div className="px-3 py-3">
            <RichTextViewer value={campaign.description} />
          </div>
        </div>

        {campaign.sections.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {campaign.sections.map((section) => (
              <CampaignSectionCard key={section.id} section={section} />
            ))}
          </div>
        )}
      </div>

      <PlannedSessionsSection campaignId={campaignId} />
    </PageContainer>
  );
}
