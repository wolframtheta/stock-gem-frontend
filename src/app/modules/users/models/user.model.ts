export type UserRole = 'admin' | 'botiga';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  fairId?: string | null;
  fairName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  botiga: 'Botiga',
};
