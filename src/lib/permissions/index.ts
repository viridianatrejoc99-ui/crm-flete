import type { Lead, User } from '@/types/crm';
export const canEditLead = (user: User, lead: Lead) =>
  user.active &&
  (user.role === 'admin' ||
    (user.role === 'advisor' && user.id === lead.ownerId));
export const canComment = (user: User) =>
  user.active && user.role !== 'director';
export const canAdminister = (user: User) =>
  user.active && user.role === 'admin';
