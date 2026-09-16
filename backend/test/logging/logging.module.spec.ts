import { LoggingModule } from '../../src/logging/logging.module';
import * as tracing from '../../src/logging/otel/tracing';

describe('LoggingModule', () => {
  it('shuts down OpenTelemetry on application shutdown', async () => {
    const spy = jest
      .spyOn(tracing, 'shutdownOpenTelemetry')
      .mockResolvedValue(undefined);

    const module = new LoggingModule();
    await module.onApplicationShutdown();

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
