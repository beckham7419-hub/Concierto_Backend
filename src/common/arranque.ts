import { Logger } from '@nestjs/common';

const logger = new Logger('Arranque');

export interface ResultadoEnv {
    errores: string[];
    avisos: string[];
}

const esPuerto = (texto: string) => /^\d+$/.test(texto) && Number(texto) >= 1 && Number(texto) <= 65535;

const zonaValida = (zona: string) => {
    try {
        new Intl.DateTimeFormat('es-MX', { timeZone: zona });
        return true;
    } catch {
        return false;
    }
};

export function revisarEnv(env: NodeJS.ProcessEnv = process.env): ResultadoEnv {
    const errores: string[] = [];
    const avisos: string[] = [];
    const valor = (nombre: string) => env[nombre]?.trim() ?? '';

    if (valor('DB_HOST') === '') errores.push('Falta DB_HOST (donde esta MySQL, por ejemplo localhost)');
    if (valor('DB_PORT') === '') errores.push('Falta DB_PORT (el puerto de MySQL, normalmente 3306)');
    else if (!esPuerto(valor('DB_PORT'))) errores.push(`DB_PORT debe ser un puerto entre 1 y 65535 (ahora vale "${valor('DB_PORT')}")`);
    if (valor('DB_USERNAME') === '') errores.push('Falta DB_USERNAME (el usuario de MySQL)');
    if (valor('DB_DATABASE') === '') errores.push('Falta DB_DATABASE (el nombre de la base de datos)');

    if (valor('JWT_SECRET') === '') {
        errores.push('Falta JWT_SECRET (un texto largo y secreto con el que se firman las sesiones)');
    } else if (valor('JWT_SECRET').length < 32 || valor('JWT_SECRET').startsWith('pon-aqui')) {
        avisos.push('JWT_SECRET es corto o es el de ejemplo: en un servidor real usa un texto al azar de 32 caracteres o mas');
    }
    if (valor('JWT_TTL') === '') {
        errores.push('Falta JWT_TTL (cuantos segundos dura una sesion, por ejemplo 28800 = 8 horas)');
    } else if (!/^\d+$/.test(valor('JWT_TTL')) || Number(valor('JWT_TTL')) < 1) {
        errores.push(`JWT_TTL debe ser un numero entero de segundos mayor que 0 (ahora vale "${valor('JWT_TTL')}")`);
    }

    if (valor('PORT') !== '' && !esPuerto(valor('PORT'))) {
        errores.push(`PORT debe ser un puerto entre 1 y 65535 (ahora vale "${valor('PORT')}"); si lo quitas se usa el 3000`);
    }

    if (valor('DB_SYNC') !== '' && !['true', 'false'].includes(valor('DB_SYNC'))) {
        avisos.push(`DB_SYNC vale "${valor('DB_SYNC')}": solo "true" crea las tablas solo, cualquier otra cosa cuenta como false`);
    }
    if (valor('FRONT_URL') === '') {
        avisos.push('Falta FRONT_URL: cualquier pagina web podra llamar al back y el pago con tarjeta no sabra a donde regresar');
    }
    if (valor('TZ') !== '' && !zonaValida(valor('TZ'))) {
        avisos.push(`TZ vale "${valor('TZ')}" y no es una zona horaria valida: las fechas pueden salir corridas`);
    }

    return { errores, avisos };
}

export function revisarEnvAlArrancar() {
    const { errores, avisos } = revisarEnv();
    for (const aviso of avisos) logger.warn(aviso);
    if (errores.length === 0) return true;
    logger.error(
        `El .env tiene problemas y el back no puede arrancar:\n${errores.map((e) => `  - ${e}`).join('\n')}\n` +
            'Revisa tu .env (el modelo esta en .env.example) y vuelve a arrancar.',
    );
    process.exitCode = 1;
    return false;
}

function codigosDe(error: unknown, nivel = 0): string[] {
    if (typeof error !== 'object' || error === null || nivel > 3) return [];
    const { code, cause, errors } = error as { code?: unknown; cause?: unknown; errors?: unknown };
    return [
        ...(typeof code === 'string' ? [code] : []),
        ...codigosDe(cause, nivel + 1),
        ...(Array.isArray(errors) ? errors : []).flatMap((hijo) => codigosDe(hijo, nivel + 1)),
    ];
}

const SIN_REINTENTO = ['ER_ACCESS_DENIED_ERROR', 'ER_DBACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR', 'ENOTFOUND'];

export function valeReintentar(error: unknown) {
    const codigos = codigosDe(error);
    return !SIN_REINTENTO.some((codigo) => codigos.includes(codigo));
}

export function mensajeDeArranque(error: unknown, env: NodeJS.ProcessEnv = process.env) {
    const codigos = codigosDe(error);
    const es = (...lista: string[]) => lista.some((codigo) => codigos.includes(codigo));
    const mysql = `${env.DB_HOST}:${env.DB_PORT}`;

    if (es('ER_ACCESS_DENIED_ERROR')) {
        return `MySQL no acepto el usuario o la contrasena (DB_USERNAME=${env.DB_USERNAME}): revisa DB_USERNAME y DB_PASSWORD en el .env`;
    }
    if (es('ER_BAD_DB_ERROR')) {
        return `La base de datos "${env.DB_DATABASE}" no existe en ${mysql}: crea la con CREATE DATABASE ${env.DB_DATABASE}; o corrige DB_DATABASE en el .env`;
    }
    if (es('ER_DBACCESS_DENIED_ERROR')) {
        return `El usuario "${env.DB_USERNAME}" no tiene permiso para usar la base "${env.DB_DATABASE}": dale permiso en MySQL o usa otro usuario en DB_USERNAME`;
    }
    if (es('ENOTFOUND')) {
        return `No se encontro el servidor "${env.DB_HOST}": revisa DB_HOST en el .env`;
    }
    if (es('ECONNREFUSED', 'ETIMEDOUT', 'EHOSTUNREACH', 'ENETUNREACH', 'ECONNRESET', 'EAI_AGAIN', 'PROTOCOL_CONNECTION_LOST')) {
        return `No se pudo conectar a MySQL en ${mysql}: revisa que MySQL este encendido y que DB_HOST y DB_PORT del .env sean correctos`;
    }
    if (es('ER_NO_SUCH_TABLE')) {
        return 'Faltan tablas en la base de datos: pon DB_SYNC=true en el .env para que se creen al arrancar';
    }
    if (es('EADDRINUSE')) {
        return `El puerto ${env.PORT || 3000} ya esta ocupado (tal vez tienes otra copia del back abierta): cierrala o cambia PORT en el .env`;
    }
    return `No se pudo arrancar el back: ${error instanceof Error ? error.message : String(error)}`;
}

export async function explicarErrorDeArranque(error: unknown, app?: { close(): Promise<void> }) {
    logger.error(mensajeDeArranque(error));
    process.exitCode = 1;
    setTimeout(() => process.exit(1), 3000).unref();
    try {
        await app?.close();
    } catch {
        logger.warn('Tambien hubo un problema al cerrar lo que ya se habia abierto');
    }
}
