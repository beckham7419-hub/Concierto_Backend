import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Not, Repository } from 'typeorm';
import { Artista } from '../artista/entities/artista.entity.js';
import { buscarActivo, soloLoQueVino } from '../common/ayudas.js';
import { manejarError } from '../common/manejar-error.js';
import { CreateGeneroDto } from './dto/create-genero.dto.js';
import { UpdateGeneroDto } from './dto/update-genero.dto.js';
import { Genero } from './entities/genero.entity.js';

@Injectable()
export class GeneroService {
  constructor(
    @InjectRepository(Genero) private readonly generos: Repository<Genero>,
    private readonly dataSource: DataSource,
  ) {}

  private transaccion<T>(trabajo: (manager: EntityManager) => Promise<T>) {
    return this.dataSource.transaction('READ COMMITTED', trabajo);
  }

  private async validarNombre(nombre: string, idPropio?: number) {
    const donde = idPropio ? { nombre, id: Not(idPropio) } : { nombre };
    if (await this.generos.existsBy(donde)) {
      throw new ConflictException('Ese genero ya existe');
    }
  }

  async create(dto: CreateGeneroDto) {
    try {
      await this.validarNombre(dto.nombre);
      return await this.generos.save(this.generos.create(dto));
    }
    catch (error) {
      manejarError(error, 'Error al crear el genero');
    }
  }

  async findAll() {
    try {
      return await this.generos.find({ order: { id: 'ASC' } });
    }
    catch (error) {
      manejarError(error, 'Error al obtener los generos');
    }
  }

  async findOne(id: number) {
    try {
      return await buscarActivo(this.generos, id, 'Genero', false);
    }
    catch (error) {
      manejarError(error, 'Error al obtener el genero');
    }
  }

  async update(id: number, dto: UpdateGeneroDto) {
    try {
      await buscarActivo(this.generos, id, 'Genero', false);
      if (dto.nombre) await this.validarNombre(dto.nombre, id);
      const cambios = soloLoQueVino(dto);
      if (Object.keys(cambios).length > 0) await this.generos.update({ id }, cambios);
      return await this.findOne(id);
    }
    catch (error) {
      manejarError(error, 'Error al actualizar el genero');
    }
  }

  async desactivar(id: number) {
    try {
      await buscarActivo(this.generos, id, 'Genero', false);
      await this.transaccion(async (manager) => {
        const genero = await manager.findOne(Genero, { where: { id }, lock: { mode: 'pessimistic_write' } });
        if (!genero) throw new NotFoundException('Genero no encontrado');
        if (await manager.existsBy(Artista, { generoId: id, activo: true })) {
          throw new ConflictException('El genero tiene artistas activos');
        }
        await manager.update(Genero, { id }, { activo: false });
      });
      return { ok: true };
    }
    catch (error) {
      manejarError(error, 'Error al desactivar el genero');
    }
  }

  async activar(id: number) {
    try {
      await buscarActivo(this.generos, id, 'Genero', false);
      await this.generos.update({ id }, { activo: true });
      return { ok: true };
    }
    catch (error) {
      manejarError(error, 'Error al activar el genero');
    }
  }
}
