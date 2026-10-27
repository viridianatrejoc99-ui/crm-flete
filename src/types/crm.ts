export const STAGES = [
  'Nuevo',
  'Contactado',
  'Interesado',
  'Suscrito',
  'Publicó cargas',
  'Ganado',
  'Perdido',
] as const;
export type Stage = (typeof STAGES)[number];
export const CHANNELS = [
  'Meta',
  'Google',
  'LinkedIn',
  'Orgánico',
  'Referido',
  'Otro',
] as const;
export type Channel = (typeof CHANNELS)[number];
export type Role = 'admin' | 'advisor' | 'director';
export interface User {
  id: string;
  name: string;
  role: Role;
  active: boolean;
}
export interface Activity {
  id: string;
  authorId: string;
  text: string;
  createdAt: string;
  kind: 'comment' | 'contact' | 'change' | 'assignment';
}
export interface Lead {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  city: string;
  estimatedLoads: number;
  channel: Channel;
  campaign: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  utmContent: string;
  enteredAt: string;
  ownerId: string;
  stage: Stage;
  lastContactResult: string;
  lossReason: string;
  nextFollowUp: string;
  firstContactAt: string;
  reentries: number;
  hasPaid: boolean;
  hasPublished: boolean;
  paidAt: string;
  collectedAmount: number;
  activeCustomer: boolean;
  renewalDueAt: string;
  renewedAt: string;
  reached: Stage[];
  activities: Activity[];
}
export interface CommercialRules {
  alertMinutes: number;
  rotationIds: string[];
  rotationCursor: number;
}
export interface CRMState {
  version: 1;
  users: User[];
  leads: Lead[];
  rules: CommercialRules;
  currentUserId: string;
}
export interface LeadFilters {
  query: string;
  channel: string;
  stage: string;
  owner: string;
  from: string;
  to: string;
  pending: boolean;
}
