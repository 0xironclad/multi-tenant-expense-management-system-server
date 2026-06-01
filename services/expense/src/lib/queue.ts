import amqp from 'amqplib';
import type { AppEvent } from '@app/types';

const EXCHANGE = 'expense.events';

let channel: amqp.Channel | null = null;

const getChannel = async (): Promise<amqp.Channel> => {
  if (channel) return channel;

  const conn = await amqp.connect(
    process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672',
  );
  channel = await conn.createChannel();
  await channel.assertExchange(EXCHANGE, 'topic', { durable: true });

  conn.on('close', () => {
    channel = null;
  });
  conn.on('error', () => {
    channel = null;
  });

  return channel;
};

export const publishEvent = async (event: AppEvent): Promise<void> => {
  const ch = await getChannel();
  ch.publish(EXCHANGE, event.type, Buffer.from(JSON.stringify(event)), {
    persistent: true,
  });
};
