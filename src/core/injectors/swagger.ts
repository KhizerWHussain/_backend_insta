import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export default function InjectSwagger(app: INestApplication) {
  const v1Options = new DocumentBuilder()
    .setTitle('Backend Instagram API')
    .setDescription('Insta backend on nestjs')
    .setVersion('1.0')
    .addSecurity('authorization', {
      type: 'apiKey',
      description: 'API Authorization',
      name: 'authorization',
      in: 'header',
    })
    .addTag('API')
    .build();

  const v1Document = SwaggerModule.createDocument(app, v1Options);
  SwaggerModule.setup('/swagger-ui', app, v1Document);
}
