import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { SoloObjetoPipe } from './common/solo-objeto.pipe.js';
import { BdFilter } from './common/bd.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new SoloObjetoPipe(),
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new BdFilter());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  const origenes = (process.env.FRONT_URL ?? '')
    .split(',')
    .map((origen) => origen.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  app.enableCors({ origin: origenes.length > 0 ? origenes : undefined });
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();