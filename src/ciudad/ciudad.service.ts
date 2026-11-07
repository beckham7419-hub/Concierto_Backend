import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { adjuntar, buscarActivo, soloLoQueVino } from '../common/ayudas.js';
import { manejarError } from '../common/manejar-error.js';
import { Estado } from '../estado/entities/estado.entity.js';
import { CreateCiudadDto } from './dto/create-ciudad.dto.js';
import { UpdateCiudadDto } from './dto/update-ciudad.dto.js';
import { Ciudad } from './entities/ciudad.entity.js';

@Injectable()
export class CiudadService {
  constructor(
    @InjectRepository(Ciudad) private readonly ciudades: Repository<Ciudad>,
    @InjectRepository(Estado) private readonly estados: Repository<Estado>,
  ) {}

  private async validarNombre(nombre: string, estadoId: number, idPropio?: number) {
    const donde = idPropio ? { nombre, estadoId, id: Not(idPropio) } : { nombre, estadoId };
    if (await this.ciudades.existsBy(donde)) {
      throw new ConflictException('Esa ciudad ya existe en ese estado');
    }
  }

  private async conEstado(ciudad: Ciudad) {
    ciudad.estado = (await this.estados.findOneBy({ id: ciudad.estadoId })) ?? undefined;
    return ciudad;
  }

  async create(dto: CreateCiudadDto) {
    try {
      await buscarActivo(this.estados, dto.estadoId, 'Estado', false);
      await this.validarNombre(dto.nombre, dto.estadoId);
      const ciudad = await this.ciudades.save(this.ciudades.create(dto));
      return await this.conEstado(ciudad);
    }
    catch (error) {
      manejarError(error, 'Error al crear la ciudad');
    }
  }

  async findAll() {
    try {
      const lista = await this.ciudades.find({ order: { id: 'ASC' } });
      return await adjuntar(lista, 'estadoId', this.estados, 'estado');
    }
    catch (error) {
      manejarError(error, 'Error al obtener las ciudades');
    }
  }

  async findOne(id: number) {
    try {
      const ciudad = await buscarActivo(this.ciudades, id, 'Ciudad', false);
      return await this.conEstado(ciudad);
    }
    catch (error) {
      manejarError(error, 'Error al obtener la ciudad');
    }
  }

  async update(id: number, dto: UpdateCiudadDto) {
    try {
      const actual = await buscarActivo(this.ciudades, id, 'Ciudad', false);
      if (dto.estadoId !== undefined) await buscarActivo(this.estados, dto.estadoId, 'Estado', false);
      await this.validarNombre(dto.nombre ?? actual.nombre, dto.estadoId ?? actual.estadoId, id);
      const cambios = soloLoQueVino(dto);
      if (Object.keys(cambios).length > 0) await this.ciudades.update({ id }, cambios);
      return await this.findOne(id);
    }
    catch (error) {
      manejarError(error, 'Error al actualizar la ciudad');
    }
  }

  async desactivar(id: number) {
    try {
      await buscarActivo(this.ciudades, id, 'Ciudad', false);
      await this.ciudades.update({ id }, { activo: false });
      return { ok: true };
    }
    catch (error) {
      manejarError(error, 'Error al desactivar la ciudad');
    }
  }

  async activar(id: number) {
    try {
      await buscarActivo(this.ciudades, id, 'Ciudad', false);
      await this.ciudades.update({ id }, { activo: true });
      return { ok: true };
    }
    catch (error) {
      manejarError(error, 'Error al activar la ciudad');
    }
  }
}
