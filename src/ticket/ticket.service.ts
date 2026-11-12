import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomInt } from 'crypto';
import { DataSource, EntityManager, In, LessThan, Repository } from 'typeorm';
import { Asiento } from '../asiento/entities/asiento.entity.js';
import { Ciudad } from '../ciudad/entities/ciudad.entity.js';
import { adjuntar, buscarActivo } from '../common/ayudas.js';
import { manejarError } from '../common/manejar-error.js';
import { ConciertoZona } from '../concierto-zona/entities/concierto-zona.entity.js';
import { Concierto } from '../concierto/entities/concierto.entity.js';
import { ALFABETO_CLAVE, ESTADO_CONCIERTO, ESTADO_TICKET, HORAS_LIMITE_PAGO, LARGO_CLAVE, MAX_TICKETS_PENDIENTES, OCUPADO, ROL } from '../constantes.js';
import { DetalleTicket } from '../detalle-ticket/entities/detalle-ticket.entity.js';
import { Recinto } from '../recinto/entities/recinto.entity.js';
import { Usuario } from '../usuario/entities/usuario.entity.js';
import { Zona } from '../zona/entities/zona.entity.js';
import { CreateTicketDto } from './dto/create-ticket.dto.js';
import { Ticket } from './entities/ticket.entity.js';

@Injectable()
export class TicketService {
    constructor(
        @InjectRepository(Ticket) private readonly tickets: Repository<Ticket>,
        @InjectRepository(DetalleTicket) private readonly detalles: Repository<DetalleTicket>,
        @InjectRepository(Concierto) private readonly conciertos: Repository<Concierto>,
        @InjectRepository(Recinto) private readonly recintos: Repository<Recinto>,
        @InjectRepository(Ciudad) private readonly ciudades: Repository<Ciudad>,
        @InjectRepository(Asiento) private readonly asientos: Repository<Asiento>,
        @InjectRepository(Zona) private readonly zonas: Repository<Zona>,
        @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>,
        private readonly dataSource: DataSource,
    ) {}

    private transaccion<T>(trabajo: (manager: EntityManager) => Promise<T>) {
        return this.dataSource.transaction('READ COMMITTED', trabajo);
    }

    private async bloquearCliente(manager: EntityManager, id: number) {
        await manager.findOne(Usuario, { where: { id }, lock: { mode: 'pessimistic_write' } });
    }

    private async bloquearConcierto(manager: EntityManager, id: number) {
        const concierto = await manager.findOne(Concierto, { where: { id }, lock: { mode: 'pessimistic_read' } });
        if (!concierto) throw new NotFoundException('Concierto no encontrado');
        if (concierto.estado !== ESTADO_CONCIERTO.PROGRAMADO || concierto.fecha.getTime() <= Date.now()) {
            throw new ConflictException('El concierto ya no esta disponible');
        }
        return concierto;
    }

    private async validarCupo(manager: EntityManager, usuarioId: number) {
        const pendientes = await manager.countBy(Ticket, { usuarioId, estado: ESTADO_TICKET.PENDIENTE });
        if (pendientes >= MAX_TICKETS_PENDIENTES) {
            throw new ConflictException('Ya tienes el maximo de tickets pendientes');
        }
    }

    private async validarAsientos(manager: EntityManager, conciertoId: number, asientoIds: number[]) {
        const asientos = await manager.find(Asiento, { where: { id: In(asientoIds) }, order: { id: 'ASC' } });
        if (asientos.length !== asientoIds.length) throw new NotFoundException('Asiento no encontrado');

        const zonaIds = [...new Set(asientos.map((a) => a.zonaId))];
        const precios = await manager.findBy(ConciertoZona, { conciertoId, zonaId: In(zonaIds) });
        const precioPorZona = new Map(precios.map((p) => [p.zonaId, p.precio]));
        const elegidos = asientos.map((asiento) => {
            const precio = precioPorZona.get(asiento.zonaId);
            if (precio === undefined) throw new BadRequestException('Algun asiento no es de este concierto');
            return { asientoId: asiento.id, precio };
        });

        if (await manager.existsBy(DetalleTicket, { conciertoId, asientoId: In(asientoIds), ocupado: OCUPADO })) {
            throw new ConflictException('Algun asiento ya esta ocupado');
        }
        return elegidos;
    }

    private calcularTotal(elegidos: { precio: string }[]) {
      const centavos = elegidos.reduce((suma, e) => suma + Math.round(Number(e.precio) * 100), 0);
        return (centavos / 100).toFixed(2);
    }

    private calcularLimite(concierto: Concierto) {
      const limite = new Date(Date.now() + HORAS_LIMITE_PAGO * 60 * 60 * 1000);
        limite.setMilliseconds(0);
        return limite.getTime() < concierto.fecha.getTime() ? limite : concierto.fecha;
    }

    private async claveNueva(manager: EntityManager) {
        for (let intento = 0; intento < 10; intento++) {
            let clave = '';
            for (let i = 0; i < LARGO_CLAVE; i++) clave += ALFABETO_CLAVE[randomInt(ALFABETO_CLAVE.length)];
            if (!(await manager.existsBy(Ticket, { clave }))) return clave;
        }
        throw new ConflictException('No se pudo generar la clave del ticket, intenta de nuevo');
    }

    private async guardarDetalles(manager: EntityManager, ticket: Ticket, elegidos: { asientoId: number; precio: string }[]) {
        try {
            await manager.insert(
                DetalleTicket,
                elegidos.map((e) => ({
                    ticketId: ticket.id,
                    conciertoId: ticket.conciertoId,
                    asientoId: e.asientoId,
                    precio: e.precio,
                    ocupado: OCUPADO,
                })),
            );
        }
        catch (error: any) {
            if (error?.code === 'ER_DUP_ENTRY') throw new ConflictException('Algun asiento ya esta ocupado');
            throw error;
        }
    }

    private async buscarDeUsuario(usuario: Usuario, id: number) {
        const ticket = await buscarActivo(this.tickets, id, 'Ticket', false);
        const esAdmin = usuario.rol?.nombre === ROL.ADMIN;
        if (!esAdmin && ticket.usuarioId !== usuario.id) throw new NotFoundException('Ticket no encontrado');
        return ticket;
    }

    private async armar(lista: Ticket[]) {
        if (lista.length === 0) return lista;

        const detalles = await this.detalles.find({ where: { ticketId: In(lista.map((t) => t.id)) }, order: { id: 'ASC' } });
        const asientos = detalles.length
            ? await this.asientos.findBy({ id: In(detalles.map((d) => d.asientoId)) })
            : [];
        const asientoPorId = new Map(asientos.map((a) => [a.id, a]));
        const zonas = asientos.length
            ? await this.zonas.findBy({ id: In([...new Set(asientos.map((a) => a.zonaId))]) })
            : [];
        const zonaPorId = new Map(zonas.map((z) => [z.id, z]));

        for (const ticket of lista) {
            ticket.asientos = [];
            for (const detalle of detalles) {
                const asiento = asientoPorId.get(detalle.asientoId);
                if (detalle.ticketId === ticket.id && asiento) {
                    ticket.asientos.push({
                        asientoId: asiento.id,
                        zonaId: asiento.zonaId,
                        zona: zonaPorId.get(asiento.zonaId)?.nombre ?? '',
                        fila: asiento.fila,
                        numero: asiento.numero,
                        precio: detalle.precio,
                    });
                }
            }
        }

        await adjuntar(lista, 'conciertoId', this.conciertos, 'concierto');
        const conciertos = lista.map((t) => t.concierto).filter((c) => c != null);
        await adjuntar(conciertos, 'recintoId', this.recintos, 'recinto');
        const recintos = conciertos.map((c) => c.recinto).filter((r) => r != null);
        await adjuntar(recintos, 'ciudadId', this.ciudades, 'ciudad');
        return lista;
    }

    async vencerPendientes() {
        const vencidos = await this.tickets.find({
            select: { id: true },
            where: { estado: ESTADO_TICKET.PENDIENTE, fechaLimite: LessThan(new Date()) },
            order: { id: 'ASC' },
        });
        if (vencidos.length === 0) return;

        await this.transaccion(async (manager) => {
            const ahora = new Date();
            const bloqueados = await manager.find(Ticket, {
                where: { id: In(vencidos.map((t) => t.id)), estado: ESTADO_TICKET.PENDIENTE, fechaLimite: LessThan(ahora) },
                order: { id: 'ASC' },
                lock: { mode: 'pessimistic_write' },
            });
            if (bloqueados.length === 0) return;

            const ids = bloqueados.map((t) => t.id);
            await manager.update(Ticket, { id: In(ids) }, { estado: ESTADO_TICKET.VENCIDO });
            await manager.update(DetalleTicket, { ticketId: In(ids) }, { ocupado: null });
        });
    }

    async create(usuario: Usuario, dto: CreateTicketDto) {
        try {
            await this.vencerPendientes();
            const id = await this.transaccion(async (manager) => {
                await this.bloquearCliente(manager, usuario.id);
                const concierto = await this.bloquearConcierto(manager, dto.conciertoId);
                await this.validarCupo(manager, usuario.id);
                const elegidos = await this.validarAsientos(manager, concierto.id, dto.asientoIds);
                
                const ticket = await manager.save(
                    manager.create(Ticket, {
                        clave: await this.claveNueva(manager),
                        usuarioId: usuario.id,
                        conciertoId: concierto.id,
                        total: this.calcularTotal(elegidos),
                        fechaLimite: this.calcularLimite(concierto),
                    }),
                );
                await this.guardarDetalles(manager, ticket, elegidos);
                return ticket.id;
            });
            const ticket = await buscarActivo(this.tickets, id, 'Ticket', false);
            return (await this.armar([ticket]))[0];
        }
        catch (error) {
            manejarError(error, 'Error al apartar los asientos');
        }
    }

    async misTickets(usuario: Usuario) {
        try {
            await this.vencerPendientes();
            const lista = await this.tickets.find({ where: { usuarioId: usuario.id }, order: { id: 'DESC' } });
            return await this.armar(lista);
        }
        catch (error) {
            manejarError(error, 'Error al obtener tus tickets');
        }
    }

    async buscarPorClave(clave: string) {
        try {
            await this.vencerPendientes();
            const ticket = await this.tickets.findOneBy({ clave: clave.trim().toUpperCase() });
            if (!ticket) throw new NotFoundException('Ticket no encontrado');
            await this.armar([ticket]);
            const cliente = await this.usuarios.findOneBy({ id: ticket.usuarioId });
            ticket.usuario = cliente ? { id: cliente.id, nombre: cliente.nombre, apellido: cliente.apellido } : undefined;
            return ticket;
        }
        catch (error) {
            manejarError(error, 'Error al buscar el ticket');
        }
    }

    async cancelar(usuario: Usuario, id: number) {
        try {
            await this.vencerPendientes();
            const ticket = await this.buscarDeUsuario(usuario, id);
            await this.transaccion(async (manager) => {
                const cambio = await manager.update(
                    Ticket,
                    { id: ticket.id, estado: ESTADO_TICKET.PENDIENTE },
                    { estado: ESTADO_TICKET.CANCELADO },
                );
                if (cambio.affected !== 1) throw new ConflictException('Solo se pueden cancelar tickets pendientes');
                await manager.update(DetalleTicket, { ticketId: ticket.id }, { ocupado: null });
            });
            return { ok: true };
        }
        catch (error) {
            manejarError(error, 'Error al cancelar el ticket');
        }
    }
}
