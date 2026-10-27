import { z } from 'zod';
import { CHANNELS, STAGES } from '@/types/crm';
const iso = z.union([z.literal(''), z.string().datetime()]);
const activity = z.object({
  id: z.string(),
  authorId: z.string(),
  text: z.string(),
  createdAt: z.string().datetime(),
  kind: z.enum(['comment', 'contact', 'change', 'assignment']),
});
const lead = z.object({
  id: z.string(),
  name: z.string(),
  company: z.string(),
  phone: z.string(),
  email: z.string(),
  city: z.string(),
  estimatedLoads: z.number().nonnegative(),
  channel: z.enum(CHANNELS),
  campaign: z.string(),
  utmSource: z.string(),
  utmMedium: z.string(),
  utmCampaign: z.string(),
  utmTerm: z.string(),
  utmContent: z.string(),
  enteredAt: z.string().datetime(),
  ownerId: z.string(),
  stage: z.enum(STAGES),
  lastContactResult: z.string(),
  lossReason: z.string(),
  nextFollowUp: iso,
  firstContactAt: iso,
  reentries: z.number().int().nonnegative(),
  hasPaid: z.boolean(),
  hasPublished: z.boolean(),
  paidAt: iso,
  collectedAmount: z.number().nonnegative(),
  activeCustomer: z.boolean(),
  renewalDueAt: iso,
  renewedAt: iso,
  reached: z.array(z.enum(STAGES)),
  activities: z.array(activity),
});
export const stateSchema = z
  .object({
    version: z.literal(1),
    currentUserId: z.string(),
    users: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          role: z.enum(['admin', 'advisor', 'director']),
          active: z.boolean(),
        }),
      )
      .min(1),
    leads: z.array(lead),
    rules: z.object({
      alertMinutes: z.number().int().min(1).max(480),
      rotationIds: z.array(z.string()),
      rotationCursor: z.number().int().nonnegative(),
    }),
  })
  .refine(
    (s) =>
      s.users.some((u) => u.id === s.currentUserId && u.active) &&
      s.leads.every((l) => s.users.some((u) => u.id === l.ownerId)),
  );
