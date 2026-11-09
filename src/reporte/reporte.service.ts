import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, In } from 'typeorm';
import { Asiento } from '../asiento/entities/asiento.entity.js';
import { adjuntar, buscarActivo, soloLoQueVino } from '../common/ayudas.js';
import { manejarError } from '../common/manejar-error.js';
import { ConciertoZona } from '../concierto-zona/entities/concierto-zona.entity.js';
import { Concierto } from '../concierto/entities/concierto.entity.js';
import { ESTADO_TICKET, OCUPADO } from '../constantes.js';
import { DetalleTicket } from '../detalle-ticket/entities/detalle-ticket.entity.js';
import { Pago } from '../pago/entities/pago.entity.js';
import { Recinto } from '../recinto/entities/recinto.entity.js';
import { Ticket } from '../ticket/entities/ticket.entity.js';
import { TicketService } from '../ticket/ticket.service.js';
import { Zona } from '../zona/entities/zona.entity.js';
import { FiltrosReporteDto } from './dto/filtros-reporte.dto.js';

interface Datos {
    tickets: Ticket[];
    pagos: Pago[];
    ocupados: DetalleTicket[];
    precios: ConciertoZona[];
    zonas: Zona[];
}

@Injectable()
export class ReporteService {
    constructor(
        private readonly dataSource: DataSource,
        private readonly ticketService: TicketService,
    ) {}

    private lectura<T>(trabajo: (manager: EntityManager) => Promise<T>) {
        return this.dataSource.transaction('REPEATABLE READ', trabajo);
    }

    private async cargar(manager: EntityManager, conciertos: Concierto[]): Promise<Datos> {
        if (conciertos.length === 0) return { tickets: [], pagos: [], ocupados: [], precios: [], zonas: [] };

        await adjuntar(conciertos, 'recintoId', manager.getRepository(Recinto), 'recinto');
        const ids = conciertos.map((c) => c.id);
        const tickets = await manager.find(Ticket, { where: { conciertoId: In(ids) } });
        const pagos = tickets.length ? await manager.find(Pago, { where: { ticketId: In(tickets.map((t) => t.id)) } }) : [];
        const ocupados = await manager.find(DetalleTicket, { where: { conciertoId: In(ids), ocupado: OCUPADO } });
        const precios = await manager.find(ConciertoZona, { where: { conciertoId: In(ids) }, order: { id: 'ASC' } });
        const zonas = precios.length ? await manager.findBy(Zona, { id: In(precios.map((p) => p.zonaId)) }) : [];
        return { tickets, pagos, ocupados, precios, zonas };
    }

    private contarTickets(tickets: Ticket[]) {
        const porEstado: Record<string, number> = {};
        for (const estado of Object.values(ESTADO_TICKET)) porEstado[estado] = 0;
        for (const ticket of tickets) porEstado[ticket.estado]++;
        return { total: tickets.length, porEstado };
    }

    private sumarIngresos(pagos: Pago[]) {
        const centavos = pagos.reduce((suma, pago) => suma + Math.round(Number(pago.monto) * 100), 0);
        return (centavos / 100).toFixed(2);
    }

    private capacidadDe(zona?: Zona) {
        return zona ? zona.filas * zona.asientosPorFila : 0;
    }

    private calcularOcupacion(ocupados: number, capacidad: number) {
        const porcentaje = capacidad > 0 ? Math.round((ocupados * 10000) / capacidad) / 100 : 0;
        return { ocupados, capacidad, disponibles: capacidad - ocupados, porcentaje };
    }

    private resumir(concierto: Concierto, datos: Datos) {
        const tickets = datos.tickets.filter((t) => t.conciertoId === concierto.id);
        const idsTickets = new Set(tickets.map((t) => t.id));
        const pagos = datos.pagos.filter((p) => idsTickets.has(p.ticketId));
        const ocupados = datos.ocupados.filter((d) => d.conciertoId === concierto.id).length;
        const capacidad = datos.precios
            .filter((p) => p.conciertoId === concierto.id)
            .reduce((suma, p) => suma + this.capacidadDe(datos.zonas.find((z) => z.id === p.zonaId)), 0);

        return {
            concierto,
            tickets: this.contarTickets(tickets),
            ingresos: this.sumarIngresos(pagos),
            ocupacion: this.calcularOcupacion(ocupados, capacidad),
        };
    }

    private async desglosarZonas(manager: EntityManager, datos: Datos) {
        const asientos = datos.ocupados.length
            ? await manager.findBy(Asiento, { id: In(datos.ocupados.map((d) => d.asientoId)) })
            : [];
        const zonaDelAsiento = new Map(asientos.map((a) => [a.id, a.zonaId]));

        return datos.precios.map((precio) => {
            const zona = datos.zonas.find((z) => z.id === precio.zonaId);
            const ocupados = datos.ocupados.filter((d) => zonaDelAsiento.get(d.asientoId) === precio.zonaId).length;
            return {
                zonaId: precio.zonaId,
                nombre: zona?.nombre ?? '',
                precio: precio.precio,
                ...this.calcularOcupacion(ocupados, this.capacidadDe(zona)),
            };
        });
    }

    async findAll(filtros: FiltrosReporteDto) {
        try {
            await this.ticketService.vencerPendientes();
            return await this.lectura(async (manager) => {
                const conciertos = await manager.find(Concierto, {
                    where: soloLoQueVino(filtros),
                    order: { fecha: 'ASC', id: 'ASC' },
                });
                const datos = await this.cargar(manager, conciertos);
                return conciertos.map((concierto) => this.resumir(concierto, datos));
            });
        }
        catch (error) {
            manejarError(error, 'Error al obtener el reporte de conciertos');
        }
    }

    async findOne(id: number) {
        try {
            await this.ticketService.vencerPendientes();
            return await this.lectura(async (manager) => {
                const concierto = await buscarActivo(manager.getRepository(Concierto), id, 'Concierto', false);
                const datos = await this.cargar(manager, [concierto]);
                return { ...this.resumir(concierto, datos), zonas: await this.desglosarZonas(manager, datos) };
            });
        }
        catch (error) {
            manejarError(error, 'Error al obtener el reporte del concierto');
        }
    }
}
