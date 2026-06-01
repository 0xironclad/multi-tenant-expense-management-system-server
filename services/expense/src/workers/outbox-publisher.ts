import 'dotenv/config';
import { sql, eq, asc, isNull } from 'drizzle-orm';
import type { AppEvent } from '@app/types';
import { db, outbox } from '../db';
import { publishEvent } from '../lib/queue';

const POLL_INTERVAL_MS = 2000;
const BATCH_SIZE = 10;

let shuttingDown = false;

const processBatch = async (): Promise<number> => {
  return db.transaction(async (tx) => {
    const rows = await tx
      .select({ id: outbox.id, payload: outbox.payload })
      .from(outbox)
      .where(isNull(outbox.publishedAt))
      .orderBy(asc(outbox.createdAt))
      .limit(BATCH_SIZE)
      .for('update', { skipLocked: true });

    for (const row of rows) {
      const event = row.payload as AppEvent;

      try {
        await publishEvent(event);
        await tx
          .update(outbox)
          .set({ publishedAt: new Date() })
          .where(eq(outbox.id, row.id));
      } catch (err) {
        console.error(`Failed to publish outbox row ${row.id}:`, err);
        await tx
          .update(outbox)
          .set({
            attemptCount: sql`${outbox.attemptCount} + 1`,
            lastAttemptAt: new Date(),
          })
          .where(eq(outbox.id, row.id));
      }
    }

    return rows.length;
  });
};

const loop = async (): Promise<void> => {
  while (!shuttingDown) {
    try {
      await processBatch();
    } catch (err) {
      console.error('Outbox poll error:', err);
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
};

const shutdown = () => {
  console.log('Outbox publisher shutting down...');
  shuttingDown = true;
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

console.log('Outbox publisher started.');
loop();
