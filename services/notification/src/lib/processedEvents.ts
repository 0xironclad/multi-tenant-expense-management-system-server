import { eq } from 'drizzle-orm';
import { db, processedEvents } from '../db';

export const isProcessed = async (eventId: string): Promise<boolean> => {
  const [row] = await db
    .select({ eventId: processedEvents.eventId })
    .from(processedEvents)
    .where(eq(processedEvents.eventId, eventId));
  return !!row;
};

export const markProcessed = async (eventId: string, eventType: string): Promise<void> => {
  // onConflictDoNothing guards the race where the same event is handled twice
  await db
    .insert(processedEvents)
    .values({ eventId, eventType })
    .onConflictDoNothing();
};
