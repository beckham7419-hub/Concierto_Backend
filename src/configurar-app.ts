import { ClassSerializerInterceptor, INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BdFilter } from './common/bd.filter.js';
import { SoloObjetoPipe } from './common/solo-objeto.pipe.js';
import { ValidacionPipe } from './common/validacion.pipe.js';

export function configurarApp(app: INestApplication) {
    app.useGlobalPipes(
        new SoloObjetoPipe(),
        new ValidacionPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new BdFilter());
    app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
    const origenes = (process.env.FRONT_URL ?? '')
        .split(',')
        .map((origen) => origen.trim().replace(/\/+$/, ''))
        .filter(Boolean);
    app.enableCors({ origin: origenes.length > 0 ? origenes : undefined });
}
