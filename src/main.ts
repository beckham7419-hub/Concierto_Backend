import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { configurarApp } from './configurar-app.js';
import { explicarErrorDeArranque, revisarEnvAlArrancar } from './common/arranque.js';

async function bootstrap() {
  if (!revisarEnvAlArrancar()) return;
  let app: INestApplication | undefined;
  try {
    app = await NestFactory.create(AppModule, { abortOnError: false });
    configurarApp(app);
    await app.listen(process.env.PORT || 3000);
  } catch (error) {
    await explicarErrorDeArranque(error, app);
  }
}
await bootstrap();
