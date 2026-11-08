import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, MoreThan, Repository } from 'typeorm';
import { Artista } from '../artista/entities/artista.entity.js';
import { Asiento } from '../asiento/entities/asiento.entity.js';
import { Ciudad } from '../ciudad/entities/ciudad.entity.js';
import { adjuntar } from '../common/ayudas.js';
import { manejarError } from '../common/manejar-error.js';
import { ConciertoArtista } from '../concierto-artista/entities/concierto-artista.entity.js';
import { ConciertoZona } from '../concierto-zona/entities/concierto-zona.entity.js';
import { Concierto } from '../concierto/entities/concierto.entity.js';
import { ESTADO_CONCIERTO, OCUPADO } from '../constantes.js';
import { DetalleTicket } from '../detalle-ticket/entities/detalle-ticket.entity.js';
import { Recinto } from '../recinto/entities/recinto.entity.js';
import { TicketService } from '../ticket/ticket.service.js';
import { Zona } from '../zona/entities/zona.entity.js';
import { FiltrosCarteleraDto } from './dto/filtros-cartelera.dto.js';

@Injectable()
export class CarteleraService {
    constructor(
        @InjectRepository(Concierto) private readonly conciertos: Repository<Concierto>,
        @InjectRepository(ConciertoArtista) private readonly conciertoArtistas: Repository<ConciertoArtista>,
        @InjectRepository(ConciertoZona) private readonly conciertoZonas: Repository<ConciertoZona>,
        @InjectRepository(Recinto) private readonly recintos: Repository<Recinto>,
        @InjectRepository(Ciudad) private readonly ciudades: Repository<Ciudad>,
        @InjectRepository(Artista) private readonly artistas: Repository<Artista>,
        @InjectRepository(Zona) private readonly zonas: Repository<Zona>,
        @InjectRepository(Asiento) private readonly asientos: Repository<Asiento>,
        @InjectRepository(DetalleTicket) private readonly detalles: Repository<DetalleTicket>,
        private readonly ticketService: TicketService,
    ) {}

    private async buscarEnCartelera(id: number) {
        const concierto = await this.conciertos.findOneBy({
            id,
            estado: ESTADO_CONCIERTO.PROGRAMADO,
            fecha: MoreThan(new Date()),
        });
        if (!concierto) throw new NotFoundException('Concierto no encontrado');
        return concierto;
    }

    private async conciertosDe(artistaIds: number[]) {
        if (artistaIds.length === 0) return [];
        const asignados = await this.conciertoArtistas.findBy({ artistaId: In(artistaIds) });
        return [...new Set(asignados.map((a) => a.conciertoId))];
    }

    private async conRecinto(lista: Concierto[]) {
        await adjuntar(lista, 'recintoId', this.recintos, 'recinto');
        const recintos = lista.map((c) => c.recinto).filter((r) => r != null);
        await adjuntar(recintos, 'ciudadId', this.ciudades, 'ciudad');
    }

    private async conArtistas(lista: Concierto[]) {
        const asignados = lista.length
            ? await this.conciertoArtistas.find({ where: { conciertoId: In(lista.map((c) => c.id)) }, order: { id: 'ASC' } })
            : [];
        const artistas = asignados.length
            ? await this.artistas.findBy({ id: In([...new Set(asignados.map((a) => a.artistaId))]) })
            : [];
        const artistaPorId = new Map(artistas.map((a) => [a.id, a]));
        for (const concierto of lista) {
            concierto.artistas = [];
            for (const asignado of asignados) {
                const artista = artistaPorId.get(asignado.artistaId);
                if (asignado.conciertoId === concierto.id && artista) concierto.artistas.push(artista);
            }
        }
    }

    private async conZonas(concierto: Concierto) {
        const precios = await this.conciertoZonas.find({ where: { conciertoId: concierto.id }, order: { id: 'ASC' } });
        const zonas = precios.length ? await this.zonas.findBy({ id: In(precios.map((p) => p.zonaId)) }) : [];
        const zonaPorId = new Map(zonas.map((z) => [z.id, z]));
        concierto.zonas = precios.map((p) => ({
            zonaId: p.zonaId,
            nombre: zonaPorId.get(p.zonaId)?.nombre ?? '',
            precio: p.precio,
        }));
    }

    async findAll(filtros: FiltrosCarteleraDto) {
        try {
            const donde: FindOptionsWhere<Concierto> = {
                estado: ESTADO_CONCIERTO.PROGRAMADO,
                fecha: MoreThan(new Date()),
            };

            if (filtros.ciudadId !== undefined) {
                const recintos = await this.recintos.findBy({ ciudadId: filtros.ciudadId });
                if (recintos.length === 0) return [];
                donde.recintoId = In(recintos.map((r) => r.id));
            }

            let conciertoIds: number[] | undefined;
            if (filtros.artistaId !== undefined) {
                conciertoIds = await this.conciertosDe([filtros.artistaId]);
            }
            if (filtros.generoId !== undefined) {
                const artistas = await this.artistas.findBy({ generoId: filtros.generoId });
                const delGenero = await this.conciertosDe(artistas.map((a) => a.id));
                conciertoIds = conciertoIds ? conciertoIds.filter((id) => delGenero.includes(id)) : delGenero;
            }
            if (conciertoIds) {
                if (conciertoIds.length === 0) return [];
                donde.id = In(conciertoIds);
            }

            const lista = await this.conciertos.find({ where: donde, order: { fecha: 'ASC', id: 'ASC' } });
            await this.conRecinto(lista);
            await this.conArtistas(lista);
            return lista;
        }
        catch (error) {
            manejarError(error, 'Error al obtener la cartelera');
        }
    }

    async findOne(id: number) {
        try {
            const concierto = await this.buscarEnCartelera(id);
            await this.conRecinto([concierto]);
            await this.conArtistas([concierto]);
            await this.conZonas(concierto);
            return concierto;
        }
        catch (error) {
            manejarError(error, 'Error al obtener el concierto de la cartelera');
        }
    }

    async findAsientos(id: number, zonaId: number) {
        try {
            await this.ticketService.vencerPendientes();
            await this.buscarEnCartelera(id);
            if (!(await this.conciertoZonas.existsBy({ conciertoId: id, zonaId }))) {
                throw new NotFoundException('Zona no encontrado');
            }
            const lista = await this.asientos.find({ where: { zonaId }, order: { fila: 'ASC', numero: 'ASC' } });
            const tomados = await this.detalles.findBy({ conciertoId: id, ocupado: OCUPADO });
            const ocupados = new Set(tomados.map((detalle) => detalle.asientoId));
            return lista.map((asiento) => ({ ...asiento, ocupado: ocupados.has(asiento.id) }));
        }
        catch (error) {
            manejarError(error, 'Error al obtener los asientos de la zona');
        }
    }
}
