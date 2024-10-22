import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import AppConfig from './configs/app.config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { NestExpressApplication } from '@nestjs/platform-express';
import { VersioningType } from '@nestjs/common';
import { InjectInterceptors, InjectLogger, InjectPipes, InjectSwagger } from './core/injectors';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
    cors: true,
  });

  app.useWebSocketAdapter(new IoAdapter(app));
  app.enableVersioning({ type: VersioningType.URI });
  app.set('trust proxy', 1);
  
  InjectPipes(app);
  InjectInterceptors(app);
  InjectLogger(app);
  InjectSwagger(app);

  await app.listen(AppConfig.APP.PORT || 3000);

}
bootstrap();
