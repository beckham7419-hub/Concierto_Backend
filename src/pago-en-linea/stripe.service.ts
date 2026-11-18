import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import Stripe from 'stripe';
import { STRIPE_MONEDA, STRIPE_REINTENTOS, STRIPE_REVISION_TIMEOUT_MS, STRIPE_SESIONES_REVISADAS, STRIPE_TIMEOUT_MS } from '../constantes.js';
import { esLlaveDePrueba } from './stripe.ayudas.js';

export interface DatosCheckout {
    clave: string;
    usuarioId: number;
    centavos: number;
    nombre: string;
    descripcion: string;
    expiraEn: number;
    exitoUrl: string;
    cancelUrl: string;
}

const REVISION = { timeout: STRIPE_REVISION_TIMEOUT_MS, maxNetworkRetries: 0 };

export interface SesionDeTicket {
    id: string;
    abierta: boolean;
    pagada: boolean;
    centavos: number | null;
    moneda: string | null;
    usuarioId: number | null;
    url: string | null;
    expiraEn: number;
}

@Injectable()
export class StripeService {
    private readonly logger = new Logger(StripeService.name);
    private readonly stripe: Stripe | null;
    private readonly motivoApagado: string;

    constructor() {
        const llave = process.env.STRIPE_SECRET_KEY?.trim() ?? '';
        if (esLlaveDePrueba(llave)) {
            this.stripe = new Stripe(llave, { timeout: STRIPE_TIMEOUT_MS, maxNetworkRetries: STRIPE_REINTENTOS });
            this.motivoApagado = '';
            this.logger.log('Pago con tarjeta encendido (Stripe, modo prueba)');
        }
        else {
            this.stripe = null;
            this.motivoApagado = llave
                ? 'STRIPE_SECRET_KEY no es de prueba (debe empezar con sk_test_)'
                : 'Falta STRIPE_SECRET_KEY en el .env';
            this.logger.warn(`${this.motivoApagado}: el pago con tarjeta queda apagado`);
        }
    }

    get disponible() {
        return this.stripe !== null;
    }

    private cliente() {
        if (!this.stripe) throw new ServiceUnavailableException('El pago con tarjeta no esta disponible');
        return this.stripe;
    }

    private traducir(error: unknown, detalle = false): never {
        if (!(error instanceof Stripe.errors.StripeError)) throw error;
        if (error.code === 'resource_missing') throw new NotFoundException('Pago no encontrado');
        console.error('STRIPE:', error.type, error.code, error.statusCode, error.message);
        if (detalle && error instanceof Stripe.errors.StripeAuthenticationError) {
            throw new ServiceUnavailableException('Stripe rechazo la llave: revisa STRIPE_SECRET_KEY en el .env');
        }
        if (detalle && error instanceof Stripe.errors.StripeConnectionError) {
            throw new ServiceUnavailableException('No hay conexion con Stripe: revisa el internet');
        }
        throw new ServiceUnavailableException('No se pudo hablar con Stripe, intenta de nuevo o paga en taquilla');
    }

    async crearSesion(datos: DatosCheckout) {
        const cliente = this.cliente();
        try {
            const sesion = await cliente.checkout.sessions.create({
                mode: 'payment',
                allowed_payment_method_types: ['card'],
                line_items: [
                    {
                        quantity: 1,
                        price_data: {
                            currency: STRIPE_MONEDA,
                            unit_amount: datos.centavos,
                            product_data: {
                                name: datos.nombre.slice(0, 200),
                                ...(datos.descripcion ? { description: datos.descripcion.slice(0, 1000) } : {}),
                            },
                        },
                    },
                ],
                client_reference_id: datos.clave,
                metadata: { clave: datos.clave, usuarioId: String(datos.usuarioId) },
                payment_intent_data: { description: `Ticket ${datos.clave}`, metadata: { clave: datos.clave } },
                locale: 'es-419',
                expires_at: datos.expiraEn,
                success_url: datos.exitoUrl,
                cancel_url: datos.cancelUrl,
            });
            if (!sesion.url) throw new ServiceUnavailableException('Stripe no devolvio la direccion de pago');
            return { id: sesion.id, url: sesion.url };
        }
        catch (error) {
            this.traducir(error);
        }
    }

    async obtenerSesion(id: string) {
        const cliente = this.cliente();
        try {
            const sesion = await cliente.checkout.sessions.retrieve(id);
            const intento = sesion.payment_intent;
            return {
                id: sesion.id,
                pagada: sesion.payment_status === 'paid',
                expirada: sesion.status === 'expired',
                clave: sesion.client_reference_id,
                usuarioId: Number(sesion.metadata?.usuarioId) || null,
                centavos: sesion.amount_total,
                moneda: sesion.currency,
                referencia: typeof intento === 'string' ? intento : (intento?.id ?? sesion.id),
            };
        }
        catch (error) {
            this.traducir(error);
        }
    }

    async sesionesDeTicket(clave: string, desdeMs: number): Promise<SesionDeTicket[]> {
        const cliente = this.cliente();
        try {
            const sesiones = await cliente.checkout.sessions
                .list({ created: { gte: Math.floor(desdeMs / 1000) }, limit: 100 }, REVISION)
                .autoPagingToArray({ limit: STRIPE_SESIONES_REVISADAS });
            return sesiones
                .filter((sesion) => sesion.client_reference_id === clave)
                .map((sesion) => ({
                    id: sesion.id,
                    abierta: sesion.status === 'open',
                    pagada: sesion.payment_status === 'paid',
                    centavos: sesion.amount_total,
                    moneda: sesion.currency,
                    usuarioId: Number(sesion.metadata?.usuarioId) || null,
                    url: sesion.url,
                    expiraEn: sesion.expires_at * 1000,
                }));
        }
        catch (error) {
            this.traducir(error);
        }
    }

    async expirar(id: string) {
        const cliente = this.cliente();
        try {
            await cliente.checkout.sessions.expire(id, {}, REVISION);
        }
        catch (error) {
            this.traducir(error);
        }
    }

    async probar() {
        if (!this.stripe) throw new ServiceUnavailableException(this.motivoApagado);
        const cliente = this.stripe;
        try {
            await cliente.balance.retrieve();
        }
        catch (error) {
            this.traducir(error, true);
        }
    }
}
