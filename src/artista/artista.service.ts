import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Not, Repository } from 'typeorm';
import { adjuntar, bloquearImagen, buscarActivo, soloLoQueVino } from '../common/ayudas.js';
import { manejarError } from '../common/manejar-error.js';
import { Genero } from '../genero/entities/genero.entity.js';
import { CreateArtistaDto } from './dto/create-artista.dto.js';
import { UpdateArtistaDto } from './dto/update-artista.dto.js';
import { Artista } from './entities/artista.entity.js';

@Injectable()
export class ArtistaService {
  constructor(
    @InjectRepository(Artista) private readonly artistas: Repository<Artista>,
    @InjectRepository(Genero) private readonly generos: Repository<Genero>,
    private readonly dataSource: DataSource,
  ) {}

  private transaccion<T>(trabajo: (manager: EntityManager) => Promise<T>) {
    return this.dataSource.transaction('READ COMMITTED', trabajo);
  }

  private async validarNombre(nombre: string, idPropio?: number) {
    const donde = idPropio ? { nombre, id: Not(idPropio) } : { nombre };
    if (await this.artistas.existsBy(donde)) {
      throw new ConflictException('Ese artista ya existe');
    }
  }

  private async conGenero(artista: Artista) {
    artista.genero = (await this.generos.findOneBy({ id: artista.generoId })) ?? undefined;
    return artista;
  }

  async create(dto: CreateArtistaDto) {
    try {
      await buscarActivo(this.generos, dto.generoId, 'Genero');
      await this.validarNombre(dto.nombre);
      const id = await this.transaccion(async (manager) => {
        const artista = await manager.save(manager.create(Artista, dto));
        if (dto.imagenId != null) await bloquearImagen(manager, dto.imagenId);
        return artista.id;
      });
      return await this.findOne(id);
    }
    catch (error) {
      manejarError(error, 'Error al crear el artista');
    }
  }

  async findAll() {
    try {
      const lista = await this.artistas.find({ order: { id: 'ASC' } });
      return await adjuntar(lista, 'generoId', this.generos, 'genero');
    }
    catch (error) {
      manejarError(error, 'Error al obtener los artistas');
    }
  }

  async findOne(id: number) {
    try {
      const artista = await buscarActivo(this.artistas, id, 'Artista', false);
      return await this.conGenero(artista);
    }
    catch (error) {
      manejarError(error, 'Error al obtener el artista');
    }
  }

  async update(id: number, dto: UpdateArtistaDto) {
    try {
      await buscarActivo(this.artistas, id, 'Artista', false);
      if (dto.generoId !== undefined) await buscarActivo(this.generos, dto.generoId, 'Genero');
      if (dto.nombre) await this.validarNombre(dto.nombre, id);
      const cambios = soloLoQueVino(dto);
      await this.transaccion(async (manager) => {
        if (Object.keys(cambios).length > 0) await manager.update(Artista, { id }, cambios);
        if (dto.imagenId != null) await bloquearImagen(manager, dto.imagenId);
      });
      return await this.findOne(id);
    }
    catch (error) {
      manejarError(error, 'Error al actualizar el artista');
    }
  }

  async desactivar(id: number) {
    try {
      await buscarActivo(this.artistas, id, 'Artista', false);
      await this.artistas.update({ id }, { activo: false });
      return { ok: true };
    }
    catch (error) {
      manejarError(error, 'Error al desactivar el artista');
    }
  }

  async activar(id: number) {
    try {
      await buscarActivo(this.artistas, id, 'Artista', false);
      await this.artistas.update({ id }, { activo: true });
      return { ok: true };
    }
    catch (error) {
      manejarError(error, 'Error al activar el artista');
    }
  }
}
