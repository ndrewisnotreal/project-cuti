import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { SystemModule } from './system/system.module';
import { MasterModule } from './master/master.module';
import { UserModule } from './user/user.module';
import { StorageModule } from './storage/storage.module';
import { MailModule } from './mail/mail.module';
import { LoggingModule } from './logging/logging.module';
import { SicutiModule } from './sicuti/sicuti.module';
import { OpenTelemetryModule } from './logging/otel/opentelemetry.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { ApiKeyGuard } from './common/guards/api-key.guard';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
    }),
    LoggingModule,
    OpenTelemetryModule,
    DatabaseModule,
    StorageModule,
    AuthModule,
    SystemModule,
    MasterModule,
    UserModule,
    MailModule,
    SicutiModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ApiKeyGuard },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
