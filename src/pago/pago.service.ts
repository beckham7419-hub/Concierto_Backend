import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, MoreThan, Repository } from 'typeorm';
import { adjuntar, buscarActivo } from '../common/ayudas.js';
import { manejarError } from '../common/manejar-error.js';
import { Concierto } from '../concierto/entities/concierto.entity.js';
import { ESTADO_CONCIERTO, ESTADO_TICKET } from '../constantes.js';
import { MetodoPago } from '../metodo-pago/entities/metodo-pago.entity.js';
import { Ticket } from '../ticket/entities/ticket.entity.js';
import { TicketService } from '../ticket/ticket.service.js';
import { Usuario } from '../usuario/entities/usuario.entity.js';
import { CreatePagoDto } from './dto/create-pago.dto.js';
import { Pago } from './entities/pago.entity.js';

@Injectable()
export class PagoService {
    constructor(
        @InjectRepository(Pago) private readonly pagos: Repository<Pago>,
        @InjectRepository(Ticket) private readonly tickets: Repository<Ticket>,
        @InjectRepository(MetodoPago) private readonly metodosPago: Repository<MetodoPago>,
        private readonly ticketService: TicketService,
        private readonly dataSource: DataSource,
    ) {}

    private transaccion<T>(trabajo: (manager: EntityManager) => Promise<T>) {
        return this.dataSource.transaction('READ COMMITTED', trabajo);
    }

    private async bloquearConcierto(manager: EntityManager, id: number) {
        const concierto = await manager.findOne(Concierto, { where: { id }, lock: { mode: 'pessimistic_read' } });
        if (!concierto) throw new NotFoundException('Concierto no encontrado');
        if (concierto.estado !== ESTADO_CONCIERTO.PROGRAMADO) {
            throw new ConflictException('El concierto ya no esta disponible');
        }
    }

    private validarPendiente(ticket: Ticket) {
        if (ticket.estado !== ESTADO_TICKET.PENDIENTE) {
            throw new ConflictException(`El ticket esta ${ticket.estado}`);
        }
    }

    private calcularCambio(total: string, montoRecibido: number) {
        const centavosTotal = Math.round(Number(total) * 100);
        const centavosRecibidos = Math.round(montoRecibido * 100);
        if (centavosRecibidos < centavosTotal) {
            throw new BadRequestException('El monto recibido es menor al total del ticket');
        }
        return ((centavosRecibidos - centavosTotal) / 100).toFixed(2);
    }

    private async guardarPago(manager: EntityManager, datos: Partial<Pago>) {
        try {
            return await manager.save(manager.create(Pago, datos));
        }
        catch (error: any) {
            if (error?.code === 'ER_DUP_ENTRY') throw new ConflictException('El ticket ya esta pagado');
            throw error;
        }
    }

    async create(usuario: Usuario, dto: CreatePagoDto) {
        try {
            await this.ticketService.vencerPendientes();
            const ticket = await this.tickets.findOneBy({ clave: dto.clave });
            if (!ticket) throw new NotFoundException('Ticket no encontrado');
            this.validarPendiente(ticket);
            await buscarActivo(this.metodosPago, dto.metodoPagoId, 'Metodo de pago');
            const cambio = this.calcularCambio(ticket.total, dto.montoRecibido);

            const id = await this.transaccion(async (manager) => {
                await this.bloquearConcierto(manager, ticket.conciertoId);
                const cambioEstado = await manager.update(
                    Ticket,
                    { id: ticket.id, estado: ESTADO_TICKET.PENDIENTE, fechaLimite: MoreThan(new Date()) },
                    { estado: ESTADO_TICKET.PAGADO },
                );
                if (cambioEstado.affected !== 1) throw new ConflictException('El ticket ya no esta pendiente');
                const pago = await this.guardarPago(manager, {
                    ticketId: ticket.id,
                    metodoPagoId: dto.metodoPagoId,
                    monto: ticket.total,
                    montoRecibido: dto.montoRecibido.toFixed(2),
                    cambio,
                    cobradoPorId: usuario.id,
                });
                return pago.id;
            });

            const pago = await buscarActivo(this.pagos, id, 'Pago', false);
            await adjuntar([pago], 'metodoPagoId', this.metodosPago, 'metodoPago');
            pago.ticket = await this.ticketService.buscarPorClave(ticket.clave);
            return pago;
        }
        catch (error) {
            manejarError(error, 'Error al cobrar el ticket');
        }
    }
}
