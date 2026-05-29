import { pgTable, uuid, varchar, text, numeric, timestamp, jsonb, integer, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const expenses = pgTable('expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull(),
  submittedBy: uuid('submitted_by').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  status: varchar('status', { length: 50 }).default('DRAFT').notNull(),
  receiptS3Key: text('receipt_s3_key'),
  submittedAt: timestamp('submitted_at'),
  reviewedBy: uuid('reviewed_by'),
  reviewedAt: timestamp('reviewed_at'),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  orgStatusCreatedIdx: index('expenses_org_status_created_idx').on(table.orgId, table.status, table.createdAt),
  submittedByCreatedIdx: index('expenses_submitted_by_created_idx').on(table.submittedBy, table.createdAt),
}));

export const outbox = pgTable('outbox', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  payload: jsonb('payload').notNull(),
  publishedAt: timestamp('published_at'),
  attemptCount: integer('attempt_count').default(0).notNull(),
  lastAttemptAt: timestamp('last_attempt_at'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  unpublishedIdx: index('outbox_unpublished_idx').on(table.publishedAt).where(sql`${table.publishedAt} IS NULL`),
}));