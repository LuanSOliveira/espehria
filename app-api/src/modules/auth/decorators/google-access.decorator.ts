import { SetMetadata } from '@nestjs/common';

export type GoogleAccessLevel = 'read-only' | 'blocked';

export const GOOGLE_ACCESS_KEY = 'googleAccess';

/**
 * Restringe o acesso de usuários autenticados via Google a um controller/rota.
 * - 'read-only': apenas métodos GET são permitidos.
 * - 'blocked': nenhum método é permitido.
 * Usuários com provider 'local' não são afetados.
 */
export const GoogleAccess = (level: GoogleAccessLevel) =>
  SetMetadata(GOOGLE_ACCESS_KEY, level);
