import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('Eventful API Engine')
    .setDescription(
      'Backend documentation for the Eventful ticketing platform.',
    )
    .setVersion('1.0')
    .addBearerAuth() // Allows you to pass JWT tokens safely in the Swagger UI later
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
  console.log(` Eventful server is running on: http://localhost:3000`);
  console.log(
    `Swagger Documentation available at: http://localhost:3000/api/docs`,
  );
}
bootstrap();
