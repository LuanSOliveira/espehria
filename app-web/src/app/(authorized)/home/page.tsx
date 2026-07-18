import { PageContainer } from '@/shared/components/Containers';
import { Title, DefaultText } from '@/shared/components/Texts';

export default function HomePage() {
  return (
    <PageContainer>
      <Title component="h1" sx={{ textAlign: 'left' }}>
        Bem vindo a Espehria!
      </Title>
      <DefaultText sx={{ marginTop: '12px' }}>
        Esta aplicação será utilizada para gerenciar o mundo de Espehria.
      </DefaultText>
    </PageContainer>
  );
}
