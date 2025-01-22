import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const corsOptions = {
    origin: 'http://localhost:5173', // Match your frontend's address
    methods: ['GET', 'POST'], // Specify the allowed HTTP methods
  };
  const app = await NestFactory.create(AppModule);
  app.enableCors(corsOptions);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3333);
}
bootstrap();
