import { Global, Module, OnApplicationShutdown } from '@nestjs/common';
import { shutdownOpenTelemetry } from './tracing';

/**
 * Module OTel yang menyediakan lifecycle hook shutdown.
 *
 * Inisialisasi SDK dilakukan di `main.ts` SEBELUM `NestFactory.create()`
 * agar auto-instrumentation bisa menangkap module load (http, fastify, nestjs-core).
 *
 * @see main.ts
 */
@Global()
@Module({
  providers: [],
  exports: [],
})
export class OpenTelemetryModule implements OnApplicationShutdown {
  async onApplicationShutdown(): Promise<void> {
    await shutdownOpenTelemetry();
  }
}
