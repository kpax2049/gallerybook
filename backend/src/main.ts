import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const corsOptions = {
    origin: 'http://localhost:5173', // Match your frontend's address
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], // Specify the allowed HTTP methods
  };
  const app = await NestFactory.create(AppModule);
  app.enableCors(corsOptions);
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3333);
}
bootstrap();
