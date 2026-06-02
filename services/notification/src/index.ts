import 'dotenv/config';
import amqplib from 'amqplib';
import type { AppEvent } from '@app/types';
import { handleEvent } from './handlers';
import { isProcessed, markProcessed } from './lib/processedEvents';

const EXCHANGE = 'expense.events';
const QUEUE = 'notification-jobs';

const start = async (): Promise<void> => {
  const conn = await amqplib.connect(
    process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672',
  );
  const channel = await conn.createChannel();

  await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
  await channel.assertQueue(QUEUE, { durable: true });
  await channel.bindQueue(QUEUE, EXCHANGE, '#');
  channel.prefetch(5); // hold at most 5 unacked messages at once

  console.log(`Notification service consuming from "${QUEUE}"...`);

  channel.consume(QUEUE, async (msg) => {
    if (!msg) return;

    try {
      const event = JSON.parse(msg.content.toString()) as AppEvent;

      if (await isProcessed(event.eventId)) {
        console.log(`[skip] already processed ${event.eventId}`);
        channel.ack(msg);
        return;
      }

      await handleEvent(event);
      await markProcessed(event.eventId, event.type);
      channel.ack(msg);
    } catch (err) {
      console.error('Event processing failed:', err);
      // Don't requeue — route to DLQ in prod (dropped in MVP). Retrying inline
      // would hot-loop on a poison message; redelivery happens via the queue.
      channel.nack(msg, false, false);
    }
  });

  const shutdown = async () => {
    console.log('Notification service shutting down...');
    await channel.close();
    await conn.close();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

start().catch((err) => {
  console.error('Failed to start notification service:', err);
  process.exit(1);
});
