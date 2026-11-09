import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, EntityManager, In, MoreThan, Not, Repository } from 'typeorm';
import { Artista } from '../artista/entities/artista.entity.js';
import { adjuntar, bloquearImagen, buscarActivo, soloLoQueVino } from '../common/ayudas.js';
import { manejarError } from '../common/manejar-error.js';
import { ConciertoArtista } from '../concierto-artista/entities/concierto-artista.entity.js';
import { ConciertoZona } from '../concierto-zona/entities/concierto-zona.entity.js';
import { ESTADO_CONCIERTO, ESTADO_TICKET, OCUPADO } from '../constantes.js';
import { DetalleTicket } from '../detalle-ticket/entities/detalle-ticket.entity.js';
import { Recinto } from '../recinto/entities/recinto.entity.js';
import { Ticket } from '../ticket/entities/ticket.entity.js';
import { Zona } from '../zona/entities/zona.entity.js';
import { AsignarArtistasDto } from './dto/asignar-artistas.dto.js';
import { AsignarPreciosDto } from './dto/asignar-precios.dto.js';
import { CreateConciertoDto } from './dto/create-concierto.dto.js';
import { UpdateConciertoDto } from './dto/update-concierto.dto.js';
import { Concierto } from './entities/concierto.entity.js';

@Injectable()
export class ConciertoService {
  constructor(
    @InjectRepository(Concierto) private readonly conciertos: Repository<Concierto>,
    @InjectRepository(ConciertoArtista) private readonly conciertoArtistas: Repository<ConciertoArtista>,
    @InjectRepository(ConciertoZona) private readonly conciertoZonas: Repository<ConciertoZona>,
    @InjectRepository(Recinto) private readonly recintos: Repository<Recinto>,
    @InjectRepository(Artista) private readonly artistas: Repository<Artista>,
    @InjectRepository(Zona) private readonly zonas: Repository<Zona>,
    private readonly dataSource: DataSource,
  ) {}

  private armarFecha(texto: string) {
    const fecha = new Date(texto);
    if (Number.isNaN(fecha.getTime()) || fecha.getFullYear() > 9999) {
      throw new BadRequestException('La fecha no es valida');
    }
    fecha.setMilliseconds(0);
    return fecha;
  }

  private validarFutura(fecha: Date) {
    if (fecha.getTime() <= Date.now()) {
      throw new BadRequestException('La fecha debe ser futura');
    }
  }

  private async validarDia(manager: EntityManager, recintoId: number, fecha: Date, idPropio?: number) {
    const inicio = new Date(fecha);
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + 1);
    fin.setSeconds(fin.getSeconds() - 1);
    const base = { recintoId, estado: ESTADO_CONCIERTO.PROGRAMADO, fecha: Between(inicio, fin) };
    const donde = idPropio ? { ...base, id: Not(idPropio) } : base;
    if (await manager.existsBy(Concierto, donde)) {
      throw new ConflictException('Ese recinto ya tiene un concierto programado ese dia');
    }
  }

  private transaccion<T>(trabajo: (manager: EntityManager) => Promise<T>) {
    return this.dataSource.transaction('READ COMMITTED', trabajo);
  }

  private async bloquearRecinto(manager: EntityManager, id: number) {
    const recinto = await manager.findOne(Recinto, { where: { id }, lock: { mode: 'pessimistic_write' } });
    if (!recinto || !recinto.activo) throw new NotFoundException('Recinto no encontrado');
  }

  private async bloquearConcierto(manager: EntityManager, id: number) {
    const concierto = await manager.findOne(Concierto, { where: { id }, lock: { mode: 'pessimistic_write' } });
    if (!concierto) throw new NotFoundException('Concierto no encontrado');
    return concierto;
  }

  private tieneTicketsVivos(manager: EntityManager, conciertoId: number) {
    return manager.existsBy(Ticket, [
      { conciertoId, estado: ESTADO_TICKET.PAGADO },
      { conciertoId, estado: ESTADO_TICKET.PENDIENTE, fechaLimite: MoreThan(new Date()) },
    ]);
  }

  private async armar(concierto: Concierto) {
    concierto.recinto = (await this.recintos.findOneBy({ id: concierto.recintoId })) ?? undefined;

    const asignados = await this.conciertoArtistas.find({ where: { conciertoId: concierto.id }, order: { id: 'ASC' } });
    const artistas = asignados.length ? await this.artistas.findBy({ id: In(asignados.map((a) => a.artistaId)) }) : [];
    const artistaPorId = new Map(artistas.map((a) => [a.id, a]));
    concierto.artistas = [];
    for (const asignado of asignados) {
      const artista = artistaPorId.get(asignado.artistaId);
      if (artista) concierto.artistas.push(artista);
    }

    const precios = await this.conciertoZonas.find({ where: { conciertoId: concierto.id }, order: { id: 'ASC' } });
    const zonas = precios.length ? await this.zonas.findBy({ id: In(precios.map((p) => p.zonaId)) }) : [];
    const zonaPorId = new Map(zonas.map((z) => [z.id, z]));
    concierto.zonas = precios.map((p) => ({
      zonaId: p.zonaId,
      nombre: zonaPorId.get(p.zonaId)?.nombre ?? '',
      precio: p.precio,
    }));
    return concierto;
  }

  async create(dto: CreateConciertoDto) {
    try {
      const fecha = this.armarFecha(dto.fecha);
      this.validarFutura(fecha);
      const id = await this.transaccion(async (manager) => {
        await this.bloquearRecinto(manager, dto.recintoId);
        await this.validarDia(manager, dto.recintoId, fecha);
        const concierto = await manager.save(manager.create(Concierto, { ...dto, fecha }));
        if (dto.imagenId != null) await bloquearImagen(manager, dto.imagenId);
        return concierto.id;
      });
      return await this.findOne(id);
    }
    catch (error) {
      manejarError(error, 'Error al crear el concierto');
    }
  }

  async findAll() {
    try {
      const lista = await this.conciertos.find({ order: { id: 'ASC' } });
      return await adjuntar(lista, 'recintoId', this.recintos, 'recinto');
    }
    catch (error) {
      manejarError(error, 'Error al obtener los conciertos');
    }
  }

  async findOne(id: number) {
    try {
      const concierto = await buscarActivo(this.conciertos, id, 'Concierto', false);
      return await this.armar(concierto);
    }
    catch (error) {
      manejarError(error, 'Error al obtener el concierto');
    }
  }

  async update(id: number, dto: UpdateConciertoDto) {
    try {
      const nueva = dto.fecha !== undefined ? this.armarFecha(dto.fecha) : undefined;
      await this.transaccion(async (manager) => {
        const actual = await this.bloquearConcierto(manager, id);
        const recintoId = dto.recintoId ?? actual.recintoId;
        const fecha = nueva ?? actual.fecha;
        const cambiaFecha = fecha.getTime() !== actual.fecha.getTime();
        const cambiaRecinto = recintoId !== actual.recintoId;

        if (cambiaFecha) this.validarFutura(fecha);
        if (cambiaFecha || cambiaRecinto) {
          if (await this.tieneTicketsVivos(manager, id)) {
            throw new ConflictException('Con tickets pendientes o pagados no se cambia el recinto ni la fecha');
          }
          await this.bloquearRecinto(manager, recintoId);
          if (actual.estado === ESTADO_CONCIERTO.PROGRAMADO) await this.validarDia(manager, recintoId, fecha, id);
        }

        const cambios: Partial<Concierto> = soloLoQueVino({
          nombre: dto.nombre,
          descripcion: dto.descripcion,
          recintoId: dto.recintoId,
          imagenId: dto.imagenId,
        });
        if (cambiaFecha) cambios.fecha = fecha;
        if (Object.keys(cambios).length > 0) await manager.update(Concierto, { id }, cambios);
        if (cambiaRecinto) await manager.delete(ConciertoZona, { conciertoId: id });
        if (dto.imagenId != null) await bloquearImagen(manager, dto.imagenId);
      });
      return await this.findOne(id);
    }
    catch (error) {
      manejarError(error, 'Error al actualizar el concierto');
    }
  }

  async cancelar(id: number) {
    try {
      await this.transaccion(async (manager) => {
        await this.bloquearConcierto(manager, id);
        if (await manager.existsBy(Ticket, { conciertoId: id, estado: ESTADO_TICKET.PAGADO })) {
          throw new ConflictException('El concierto tiene tickets pagados, no se puede cancelar');
        }
        await manager.update(
          Ticket,
          { conciertoId: id, estado: ESTADO_TICKET.PENDIENTE },
          { estado: ESTADO_TICKET.CANCELADO },
        );
        await manager.update(DetalleTicket, { conciertoId: id, ocupado: OCUPADO }, { ocupado: null });
        await manager.update(Concierto, { id }, { estado: ESTADO_CONCIERTO.CANCELADO });
      });
      return { ok: true };
    }
    catch (error) {
      manejarError(error, 'Error al cancelar el concierto');
    }
  }

  async asignarArtistas(id: number, dto: AsignarArtistasDto) {
    try {
      await this.transaccion(async (manager) => {
        await this.bloquearConcierto(manager, id);
        const artistas = await manager.findBy(Artista, { id: In(dto.artistaIds), activo: true });
        if (artistas.length !== dto.artistaIds.length) throw new NotFoundException('Artista no encontrado');

        await manager.delete(ConciertoArtista, { conciertoId: id });
        await manager.insert(ConciertoArtista, dto.artistaIds.map((artistaId) => ({ conciertoId: id, artistaId })));
      });
      return await this.findOne(id);
    }
    catch (error) {
      manejarError(error, 'Error al asignar los artistas');
    }
  }

  async asignarPrecios(id: number, dto: AsignarPreciosDto) {
    try {
      const zonaIds = dto.precios.map((p) => p.zonaId);
      await this.transaccion(async (manager) => {
        const concierto = await this.bloquearConcierto(manager, id);
        const zonas = await manager.findBy(Zona, { id: In(zonaIds), activo: true });
        if (zonas.length !== zonaIds.length) throw new NotFoundException('Zona no encontrado');
        if (zonas.some((z) => z.recintoId !== concierto.recintoId)) {
          throw new BadRequestException('La zona no es del recinto de este concierto');
        }

        const anteriores = await manager.findBy(ConciertoZona, { conciertoId: id });
        const quitaZona = anteriores.some((anterior) => !zonaIds.includes(anterior.zonaId));
        if (quitaZona && (await this.tieneTicketsVivos(manager, id))) {
          throw new ConflictException('Con tickets pendientes o pagados no se quita una zona');
        }

        await manager.delete(ConciertoZona, { conciertoId: id });
        await manager.insert(
          ConciertoZona,
          dto.precios.map((p) => ({ conciertoId: id, zonaId: p.zonaId, precio: p.precio.toFixed(2) })),
        );
      });
      return await this.findOne(id);
    }
    catch (error) {
      manejarError(error, 'Error al asignar los precios');
    }
  }
}
