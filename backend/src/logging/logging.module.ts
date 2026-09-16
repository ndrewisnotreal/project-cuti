import { Global, Module, OnApplicationShutdown } from '@nestjs/common';
import { LoggingService } from './logging.service';
import { shutdownOpenTelemetry } from './otel/tracing';

@Global()
@Module({
  providers: [LoggingService],
  exports: [LoggingService],
})
export class LoggingModule implements OnApplicationShutdown {
  async onApplicationShutdown(): Promise<void> {
    // Flush OTel pending logs/spans sebelum exit
    await shutdownOpenTelemetry();
  }
}
