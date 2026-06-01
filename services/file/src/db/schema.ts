import { pgTable, uuid, text, varchar, integer, timestamp } from 'drizzle-orm/pg-core';

export const files = pgTable('files', {
  id: uuid('id').primaryKey().defaultRandom(),
  s3Key: text('s3_key').notNull().unique(),
  uploadedBy: uuid('uploaded_by').notNull(),
  orgId: uuid('org_id').notNull(),
  mimeType: varchar('mime_type', { length: 100 }),
  sizeBytes: integer('size_bytes'),
  createdAt: timestamp('created_at').defaultNow(),
});
