import { LazyModuleLoader, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from '@nestjs/common';
import { InjectPipes, InjectSwagger } from './core/injectors';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
    cors: true,
  });

  app.setGlobalPrefix('/api/v1');
  app.set('trust proxy', 1);
  InjectPipes(app);
  InjectSwagger(app);

  await app.listen(process.env.APP_PORT || 3000);
  Logger.log(
    `Server running on http://localhost:${process.env.APP_PORT}/api/v1`,
  );
}
bootstrap();
