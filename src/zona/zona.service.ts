import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, MoreThan, Not, Repository } from 'typeorm';
import { Asiento } from '../asiento/entities/asiento.entity.js';
import { buscarActivo, soloLoQueVino } from '../common/ayudas.js';
import { manejarError } from '../common/manejar-error.js';
import { ConciertoZona } from '../concierto-zona/entities/concierto-zona.entity.js';
import { Concierto } from '../concierto/entities/concierto.entity.js';
import { ESTADO_CONCIERTO } from '../constantes.js';
import { Recinto } from '../recinto/entities/recinto.entity.js';
import { CreateZonaDto } from './dto/create-zona.dto.js';
import { UpdateZonaDto } from './dto/update-zona.dto.js';
import { Zona } from './entities/zona.entity.js';

@Injectable()
export class ZonaService {
  constructor(
    @InjectRepository(Zona) private readonly zonas: Repository<Zona>,
    @InjectRepository(Recinto) private readonly recintos: Repository<Recinto>,
    @InjectRepository(Asiento) private readonly asientos: Repository<Asiento>,
    private readonly dataSource: DataSource,
  ) {}

  private transaccion<T>(trabajo: (manager: EntityManager) => Promise<T>) {
    return this.dataSource.transaction('READ COMMITTED', trabajo);
  }

  private async validarNombre(nombre: string, recintoId: number, idPropio?: number) {
    const donde = idPropio ? { nombre, recintoId, id: Not(idPropio) } : { nombre, recintoId };
    if (await this.zonas.existsBy(donde)) {
      throw new ConflictException('Esa zona ya existe en ese recinto');
    }
  }

  private async conRecinto(zona: Zona) {
    zona.recinto = (await this.recintos.findOneBy({ id: zona.recintoId })) ?? undefined;
    return zona;
  }

  private armarAsientos(zona: Zona) {
    const lista: { zonaId: number; fila: string; numero: number }[] = [];
    for (let f = 0; f < zona.filas; f++) {
      for (let n = 1; n <= zona.asientosPorFila; n++) {
        lista.push({ zonaId: zona.id, fila: String.fromCharCode(65 + f), numero: n });
      }
    }
    return lista;
  }

  async create(dto: CreateZonaDto) {
    try {
      await buscarActivo(this.recintos, dto.recintoId, 'Recinto');
      await this.validarNombre(dto.nombre, dto.recintoId);
      const id = await this.dataSource.transaction(async (manager) => {
        const zona = await manager.save(Zona, manager.create(Zona, dto));
        await manager.insert(Asiento, this.armarAsientos(zona));
        return zona.id;
      });
      return await this.findOne(id);
    }
    catch (error) {
      manejarError(error, 'Error al crear la zona');
    }
  }

  async findOne(id: number) {
    try {
      const zona = await buscarActivo(this.zonas, id, 'Zona', false);
      return await this.conRecinto(zona);
    }
    catch (error) {
      manejarError(error, 'Error al obtener la zona');
    }
  }

  async findAsientos(id: number) {
    try {
      await buscarActivo(this.zonas, id, 'Zona', false);
      return await this.asientos.find({ where: { zonaId: id }, order: { fila: 'ASC', numero: 'ASC' } });
    }
    catch (error) {
      manejarError(error, 'Error al obtener los asientos de la zona');
    }
  }

  async update(id: number, dto: UpdateZonaDto) {
    try {
      const actual = await buscarActivo(this.zonas, id, 'Zona', false);
      if (dto.nombre) await this.validarNombre(dto.nombre, actual.recintoId, id);
      const cambios = soloLoQueVino(dto);
      if (Object.keys(cambios).length > 0) await this.zonas.update({ id }, cambios);
      return await this.findOne(id);
    }
    catch (error) {
      manejarError(error, 'Error al actualizar la zona');
    }
  }

  async desactivar(id: number) {
    try {
      await buscarActivo(this.zonas, id, 'Zona', false);
      await this.transaccion(async (manager) => {
        const zona = await manager.findOne(Zona, { where: { id }, lock: { mode: 'pessimistic_write' } });
        if (!zona) throw new NotFoundException('Zona no encontrado');
        const precios = await manager.findBy(ConciertoZona, { zonaId: id });
        const hayConciertos = precios.length > 0 && (await manager.existsBy(Concierto, {
          id: In(precios.map((p) => p.conciertoId)),
          estado: ESTADO_CONCIERTO.PROGRAMADO,
          fecha: MoreThan(new Date()),
        }));
        if (hayConciertos) throw new ConflictException('La zona tiene conciertos programados');
        await manager.update(Zona, { id }, { activo: false });
      });
      return { ok: true };
    }
    catch (error) {
      manejarError(error, 'Error al desactivar la zona');
    }
  }

  async activar(id: number) {
    try {
      await buscarActivo(this.zonas, id, 'Zona', false);
      await this.zonas.update({ id }, { activo: true });
      return { ok: true };
    }
    catch (error) {
      manejarError(error, 'Error al activar la zona');
    }
  }
}
