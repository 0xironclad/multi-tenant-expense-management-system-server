import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';

// Idempotency ledger. RabbitMQ/SQS deliver at-least-once, so the same event can arrive more than once — we record each handled eventId here and skip repeats to avoid sending duplicate emails.
export const processedEvents = pgTable('processed_events', {
  eventId: uuid('event_id').primaryKey(),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  processedAt: timestamp('processed_at').defaultNow(),
});
