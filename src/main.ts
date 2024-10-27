import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import AppConfig from './configs/app.config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { InjectPipes, InjectSwagger } from './core/injectors';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
    cors: true,
  });

  app.setGlobalPrefix('/api/v1');
  // app.enableVersioning({ type: VersioningType.URI });
  app.set('trust proxy', 1);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      //  exceptionFactory: (errors) => {
      //    const messages = errors.map(
      //      (error) =>
      //        `${error.property} has wrong value ${error.value}. ${Object.values(error.constraints).join(', ')}`,
      //    );
      //    return new BadRequestException(messages);
      //  },
    }),
  );

  InjectPipes(app);
  InjectSwagger(app);

  await app.listen(AppConfig.APP.PORT || 3000);
  Logger.log(`Server running on http://localhost:${AppConfig.APP.PORT}/api/v1`);
}
bootstrap();
