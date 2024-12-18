import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';

export default function InjectPipes(app: INestApplication) {
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      validationError: { target: true, value: true },
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => new BadRequestException(errors),
    }),
  );
}
