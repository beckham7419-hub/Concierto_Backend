import { RUTA_FRONT_PAGO_EXITO, RUTA_FRONT_TICKETS, STRIPE_LLAVE_PRUEBA, STRIPE_MINUTOS_HOLGURA, STRIPE_MINUTOS_MINIMOS, STRIPE_MINUTOS_SESION } from '../constantes.js';

const MINUTO = 60 * 1000;

export function aCentavos(total: string | number) {
    return Math.round(Number(total) * 100);
}

export function esLlaveDePrueba(llave: string | undefined) {
    const limpia = llave?.trim() ?? '';
    return limpia.startsWith(STRIPE_LLAVE_PRUEBA) && limpia.length > STRIPE_LLAVE_PRUEBA.length;
}

export function urlsDeRetorno(frontUrl: string | undefined) {
    const base = frontUrl?.trim().replace(/\/+$/, '');
    if (!base) return null;
    return {
        exito: `${base}${RUTA_FRONT_PAGO_EXITO}?session_id={CHECKOUT_SESSION_ID}`,
        cancelado: `${base}${RUTA_FRONT_TICKETS}`,
    };
}

export function expiraLaSesion(ahora: number, fechaLimite: number) {
    if (fechaLimite - ahora < STRIPE_MINUTOS_MINIMOS * MINUTO) return null;
    const hasta = Math.min(ahora + STRIPE_MINUTOS_SESION * MINUTO, fechaLimite - STRIPE_MINUTOS_HOLGURA * MINUTO);
    return Math.floor(hasta / 1000);
}
