import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, MoreThan, Repository } from 'typeorm';
import { ApartadoService } from '../apartado/apartado.service.js';
import { Artista } from '../artista/entities/artista.entity.js';
import { Asiento } from '../asiento/entities/asiento.entity.js';
import { Ciudad } from '../ciudad/entities/ciudad.entity.js';
import { adjuntar } from '../common/ayudas.js';
import { manejarError } from '../common/manejar-error.js';
import { ConciertoArtista } from '../concierto-artista/entities/concierto-artista.entity.js';
import { ConciertoZona } from '../concierto-zona/entities/concierto-zona.entity.js';
import { Concierto } from '../concierto/entities/concierto.entity.js';
import { BD_TICKET, ESPERA_CAMBIOS_MS, ESTADO_CONCIERTO, OCUPADO } from '../constantes.js';
import { DetalleTicket } from '../detalle-ticket/entities/detalle-ticket.entity.js';
import { Recinto } from '../recinto/entities/recinto.entity.js';
import { TicketService } from '../ticket/ticket.service.js';
import { TiempoRealService } from '../tiempo-real/tiempo-real.service.js';
import { Usuario } from '../usuario/entities/usuario.entity.js';
import { Zona } from '../zona/entities/zona.entity.js';
import { ApartarAsientoDto } from './dto/apartar-asiento.dto.js';
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
        @InjectRepository(DetalleTicket, BD_TICKET) private readonly detalles: Repository<DetalleTicket>,
        private readonly ticketService: TicketService,
        private readonly apartados: ApartadoService,
        private readonly tiempoReal: TiempoRealService,
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

    private async validarZona(id: number, zonaId: number) {
        await this.buscarEnCartelera(id);
        if (!(await this.conciertoZonas.existsBy({ conciertoId: id, zonaId }))) {
            throw new NotFoundException('Zona no encontrado');
        }
    }

    private async armarCambios(usuario: Usuario, id: number, zonaId: number) {
        await this.validarZona(id, zonaId);
        const version = this.tiempoReal.version(id);
        const lista = await this.asientos.find({ where: { zonaId }, order: { fila: 'ASC', numero: 'ASC' } });
        const tomados = await this.detalles.findBy({ conciertoId: id, ocupado: OCUPADO });
        const vendidos = new Set(tomados.map((detalle) => detalle.asientoId));
        const asientos = lista.map((asiento) => {
            const dueno = this.apartados.duenoDe(id, asiento.id);
            const estado = vendidos.has(asiento.id) ? 'vendido' : dueno === undefined ? 'libre' : dueno === usuario.id ? 'tuyo' : 'apartado';
            return { id: asiento.id, fila: asiento.fila, numero: asiento.numero, estado, ocupado: estado === 'apartado' || estado === 'vendido' };
        });
        return {
            version,
            asientos,
            misApartados: this.apartados.deUsuario(usuario.id, id),
            expiraEn: this.apartados.plazoDe(usuario.id, id),
        };
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

    async cambios(usuario: Usuario, id: number, zonaId: number, version?: number, senal?: AbortSignal) {
        try {
            await this.validarZona(id, zonaId);
            await this.tiempoReal.esperar(id, version, ESPERA_CAMBIOS_MS, senal);
            if (senal?.aborted) return;
            await this.ticketService.vencerPendientes();
            return await this.armarCambios(usuario, id, zonaId);
        }
        catch (error) {
            manejarError(error, 'Error al obtener los cambios de la zona');
        }
    }

    async apartar(usuario: Usuario, id: number, dto: ApartarAsientoDto) {
        try {
            await this.ticketService.vencerPendientes();
            await this.buscarEnCartelera(id);
            const asiento = await this.asientos.findOneBy({ id: dto.asientoId });
            if (!asiento) throw new NotFoundException('Asiento no encontrado');
            if (!(await this.conciertoZonas.existsBy({ conciertoId: id, zonaId: asiento.zonaId }))) {
                throw new BadRequestException('El asiento no es de este concierto');
            }
            const expiraEn = this.apartados.apartar(usuario.id, id, asiento.id);
            if (await this.detalles.existsBy({ conciertoId: id, asientoId: asiento.id, ocupado: OCUPADO })) {
                this.apartados.soltar(usuario.id, id, asiento.id);
                throw new ConflictException('Ese asiento ya esta vendido');
            }
            return { expiraEn };
        }
        catch (error) {
            manejarError(error, 'Error al apartar el asiento');
        }
    }

    soltar(usuario: Usuario, id: number, asientoId: number) {
        return { expiraEn: this.apartados.soltar(usuario.id, id, asientoId) };
    }

    soltarTodos(usuario: Usuario, id: number) {
        this.apartados.soltarTodos(usuario.id, id);
        return { expiraEn: null };
    }
}
