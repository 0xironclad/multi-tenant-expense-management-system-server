// MUST be imported first in index.ts. OpenTelemetry auto-instrumentation works
// by monkey-patching Node core (http), Express, and pg — it only patches modules
// loaded AFTER this runs, so any earlier import escapes tracing.
import 'dotenv/config';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

const sdk = new NodeSDK({
  serviceName: process.env.SERVICE_NAME ?? 'unknown-service',
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

// Flush buffered spans on shutdown so the last requests aren't lost.
const shutdown = () => {
  sdk.shutdown().finally(() => process.exit(0));
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
