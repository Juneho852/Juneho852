import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // required for Stripe webhook signature verification
  });

  const config = app.get(ConfigService);

  app.use(helmet());

  app.enableCors({
    origin: [
      config.get('FRONTEND_URL', 'http://localhost:3000'),
      /\.vercel\.app$/,
    ],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || config.get<number>('API_PORT', 3001);
  await app.listen(port);
  console.log(`MatchAI API running on port ${port}`);
}

bootstrap();
