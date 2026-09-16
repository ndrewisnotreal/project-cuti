import { OpenTelemetryModule } from '../../src/logging/otel/opentelemetry.module';
import * as tracing from '../../src/logging/otel/tracing';

describe('OpenTelemetryModule', () => {
  it('shuts down OpenTelemetry on application shutdown', async () => {
    const spy = jest
      .spyOn(tracing, 'shutdownOpenTelemetry')
      .mockResolvedValue(undefined);

    const module = new OpenTelemetryModule();
    await module.onApplicationShutdown();

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
