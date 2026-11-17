import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { adjuntar } from '../common/ayudas.js';
import { manejarError } from '../common/manejar-error.js';
import { ESTADO_CONCIERTO, ESTADO_TICKET, METODO_PAGO_TARJETA, STRIPE_MONEDA, STRIPE_MONTO_MINIMO } from '../constantes.js';
import { MetodoPago } from '../metodo-pago/entities/metodo-pago.entity.js';
import { Pago } from '../pago/entities/pago.entity.js';
import { PagoService } from '../pago/pago.service.js';
import { Ticket } from '../ticket/entities/ticket.entity.js';
import { TicketService } from '../ticket/ticket.service.js';
import { Usuario } from '../usuario/entities/usuario.entity.js';
import { ConfirmarPagoDto } from './dto/confirmar-pago.dto.js';
import { CrearCheckoutDto } from './dto/crear-checkout.dto.js';
import { aCentavos, expiraLaSesion, urlsDeRetorno } from './stripe.ayudas.js';
import { StripeService } from './stripe.service.js';

@Injectable()
export class PagoEnLineaService {
    private readonly logger = new Logger(PagoEnLineaService.name);

    constructor(
        @InjectRepository(Pago) private readonly pagos: Repository<Pago>,
        @InjectRepository(Ticket) private readonly tickets: Repository<Ticket>,
        @InjectRepository(MetodoPago) private readonly metodosPago: Repository<MetodoPago>,
        private readonly ticketService: TicketService,
        private readonly pagoService: PagoService,
        private readonly stripe: StripeService,
    ) {}

    private tarjetaDesactivada() {
        return this.metodosPago.existsBy({ nombre: METODO_PAGO_TARJETA, activo: false });
    }

    private async metodoTarjeta() {
        let metodo = await this.metodosPago.findOneBy({ nombre: METODO_PAGO_TARJETA });
        if (!metodo) {
            try {
                metodo = await this.metodosPago.save(this.metodosPago.create({ nombre: METODO_PAGO_TARJETA }));
                this.logger.log(`Metodo de pago creado: ${METODO_PAGO_TARJETA}`);
            }
            catch (error: any) {
                if (error?.code !== 'ER_DUP_ENTRY') throw error;
                metodo = await this.metodosPago.findOneByOrFail({ nombre: METODO_PAGO_TARJETA });
            }
        }
        if (!metodo.activo) throw new ServiceUnavailableException('El pago con tarjeta no esta disponible');
        return metodo;
    }

    private exigirStripe() {
        if (!this.stripe.disponible) throw new ServiceUnavailableException('El pago con tarjeta no esta disponible');
    }

    private async ticketDelCliente(usuario: Usuario, clave: string) {
        const ticket = await this.ticketService.buscarPorClave(clave);
        if (ticket.usuarioId !== usuario.id) throw new NotFoundException('Ticket no encontrado');
        return ticket;
    }

    private describir(ticket: Ticket) {
        const asientos = (ticket.asientos ?? []).map((a) => `${a.zona} fila ${a.fila} asiento ${a.numero}`);
        return {
            nombre: ticket.concierto?.nombre ?? 'Boletos de concierto',
            descripcion: [`Ticket ${ticket.clave}`, ...asientos].join(' - '),
        };
    }

    private async pagoEnLinea(usuario: Usuario, ticket: Ticket) {
        const pago = await this.pagos.findOneBy({ ticketId: ticket.id, cobradoPorId: usuario.id });
        if (!pago) return null;
        await adjuntar([pago], 'metodoPagoId', this.metodosPago, 'metodoPago');
        pago.ticket = await this.ticketService.buscarPorClave(ticket.clave);
        return pago;
    }

    private conReferencia(pago: Pago, referencia: string) {
        return Object.assign(pago, { referencia });
    }

    async estado() {
        try {
            return { disponible: this.stripe.disponible && !(await this.tarjetaDesactivada()) };
        }
        catch (error) {
            manejarError(error, 'Error al revisar el pago con tarjeta');
        }
    }

    async probar() {
        try {
            await this.stripe.probar();
            return { ok: true, modo: 'prueba' };
        }
        catch (error) {
            manejarError(error, 'Error al probar la conexion con Stripe');
        }
    }

    async crearCheckout(usuario: Usuario, dto: CrearCheckoutDto) {
        try {
            this.exigirStripe();
            const urls = urlsDeRetorno(process.env.FRONT_URL);
            if (!urls) throw new ServiceUnavailableException('Falta FRONT_URL en el .env');

            const ticket = await this.ticketDelCliente(usuario, dto.clave);
            if (ticket.estado !== ESTADO_TICKET.PENDIENTE) throw new ConflictException(`El ticket esta ${ticket.estado}`);
            if (ticket.concierto?.estado !== ESTADO_CONCIERTO.PROGRAMADO) {
                throw new ConflictException('El concierto ya no esta disponible');
            }
            if (await this.tarjetaDesactivada()) throw new ServiceUnavailableException('El pago con tarjeta no esta disponible');

            const centavos = aCentavos(ticket.total);
            if (centavos < STRIPE_MONTO_MINIMO * 100) {
                throw new BadRequestException(`El pago con tarjeta pide un total minimo de $${STRIPE_MONTO_MINIMO} MXN`);
            }
            const expiraEn = expiraLaSesion(Date.now(), ticket.fechaLimite.getTime());
            if (expiraEn === null) {
                throw new ConflictException('Al ticket le queda muy poco tiempo para pagar con tarjeta: pagalo en taquilla');
            }

            const sesion = await this.stripe.crearSesion({
                clave: ticket.clave,
                usuarioId: usuario.id,
                centavos,
                ...this.describir(ticket),
                expiraEn,
                exitoUrl: urls.exito,
                cancelUrl: urls.cancelado,
            });
            this.logger.log(`Pago con tarjeta iniciado: ticket ${ticket.clave}, usuario ${usuario.id}, sesion ${sesion.id}`);
            return { sessionId: sesion.id, url: sesion.url };
        }
        catch (error) {
            manejarError(error, 'Error al iniciar el pago con tarjeta');
        }
    }

    async confirmar(usuario: Usuario, dto: ConfirmarPagoDto) {
        try {
            this.exigirStripe();
            const sesion = await this.stripe.obtenerSesion(dto.sessionId);
            if (!sesion.clave || sesion.usuarioId !== usuario.id) throw new NotFoundException('Pago no encontrado');
            if (!sesion.pagada) {
                throw new ConflictException(
                    sesion.expirada ? 'La pagina de pago expiro, vuelve a intentarlo' : 'El pago con tarjeta no se completo',
                );
            }
            if (sesion.moneda !== STRIPE_MONEDA) throw new ConflictException('La moneda del pago no coincide con el ticket');

            await this.ticketService.vencerPendientes();
            const ticket = await this.tickets.findOneBy({ clave: sesion.clave });
            if (!ticket || ticket.usuarioId !== usuario.id) throw new NotFoundException('Pago no encontrado');
            if (sesion.centavos !== aCentavos(ticket.total)) {
                throw new ConflictException('El monto pagado no coincide con el total del ticket');
            }

            const yaRegistrado = await this.pagoEnLinea(usuario, ticket);
            if (yaRegistrado) return this.conReferencia(yaRegistrado, sesion.referencia);

            const tarjeta = await this.metodoTarjeta();
            try {
                const pago = await this.pagoService.create(usuario, {
                    clave: ticket.clave,
                    metodoPagoId: tarjeta.id,
                    montoRecibido: Number(ticket.total),
                });
                this.logger.log(`Pago con tarjeta registrado: ticket ${ticket.clave}, usuario ${usuario.id}, ${sesion.referencia}`);
                return this.conReferencia(pago, sesion.referencia);
            }
            catch (error) {
                if (!(error instanceof ConflictException)) throw error;
                const mismoMomento = await this.pagoEnLinea(usuario, ticket);
                if (mismoMomento) return this.conReferencia(mismoMomento, sesion.referencia);
                this.logger.warn(`Pago cobrado sin ticket: ${ticket.clave}, ${sesion.referencia}, ${error.message}`);
                throw new ConflictException(
                    `${error.message}. Tu cobro en Stripe ya se hizo (referencia ${sesion.referencia}): pide el reembolso en taquilla`,
                );
            }
        }
        catch (error) {
            manejarError(error, 'Error al confirmar el pago con tarjeta');
        }
    }
}
