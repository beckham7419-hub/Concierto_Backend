import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Ciudad } from '../ciudad/entities/ciudad.entity.js';
import { adjuntar, buscarActivo, soloLoQueVino } from '../common/ayudas.js';
import { manejarError } from '../common/manejar-error.js';
import { Zona } from '../zona/entities/zona.entity.js';
import { CreateRecintoDto } from './dto/create-recinto.dto.js';
import { UpdateRecintoDto } from './dto/update-recinto.dto.js';
import { Recinto } from './entities/recinto.entity.js';

@Injectable()
export class RecintoService {
  constructor(
    @InjectRepository(Recinto) private readonly recintos: Repository<Recinto>,
    @InjectRepository(Ciudad) private readonly ciudades: Repository<Ciudad>,
    @InjectRepository(Zona) private readonly zonas: Repository<Zona>,
  ) {}

  private async validarNombre(nombre: string, ciudadId: number, idPropio?: number) {
    const donde = idPropio ? { nombre, ciudadId, id: Not(idPropio) } : { nombre, ciudadId };
    if (await this.recintos.existsBy(donde)) {
      throw new ConflictException('Ese recinto ya existe en esa ciudad');
    }
  }

  private async conCiudad(recinto: Recinto) {
    recinto.ciudad = (await this.ciudades.findOneBy({ id: recinto.ciudadId })) ?? undefined;
    return recinto;
  }

  async create(dto: CreateRecintoDto) {
    try {
      await buscarActivo(this.ciudades, dto.ciudadId, 'Ciudad');
      await this.validarNombre(dto.nombre, dto.ciudadId);
      const recinto = await this.recintos.save(this.recintos.create(dto));
      return await this.findOne(recinto.id);
    }
    catch (error) {
      manejarError(error, 'Error al crear el recinto');
    }
  }

  async findAll() {
    try {
      const lista = await this.recintos.find({ order: { id: 'ASC' } });
      return await adjuntar(lista, 'ciudadId', this.ciudades, 'ciudad');
    }
    catch (error) {
      manejarError(error, 'Error al obtener los recintos');
    }
  }

  async findOne(id: number) {
    try {
      const recinto = await buscarActivo(this.recintos, id, 'Recinto', false);
      return await this.conCiudad(recinto);
    }
    catch (error) {
      manejarError(error, 'Error al obtener el recinto');
    }
  }

  async findZonas(id: number) {
    try {
      await buscarActivo(this.recintos, id, 'Recinto', false);
      const lista = await this.zonas.find({ where: { recintoId: id }, order: { id: 'ASC' } });
      return await adjuntar(lista, 'recintoId', this.recintos, 'recinto');
    }
    catch (error) {
      manejarError(error, 'Error al obtener las zonas del recinto');
    }
  }

  async update(id: number, dto: UpdateRecintoDto) {
    try {
      const actual = await buscarActivo(this.recintos, id, 'Recinto', false);
      if (dto.ciudadId !== undefined) await buscarActivo(this.ciudades, dto.ciudadId, 'Ciudad');
      await this.validarNombre(dto.nombre ?? actual.nombre, dto.ciudadId ?? actual.ciudadId, id);
      const cambios = soloLoQueVino(dto);
      if (Object.keys(cambios).length > 0) await this.recintos.update({ id }, cambios);
      return await this.findOne(id);
    }
    catch (error) {
      manejarError(error, 'Error al actualizar el recinto');
    }
  }

  async desactivar(id: number) {
    try {
      await buscarActivo(this.recintos, id, 'Recinto', false);
      await this.recintos.update({ id }, { activo: false });
      return { ok: true };
    }
    catch (error) {
      manejarError(error, 'Error al desactivar el recinto');
    }
  }

  async activar(id: number) {
    try {
      await buscarActivo(this.recintos, id, 'Recinto', false);
      await this.recintos.update({ id }, { activo: true });
      return { ok: true };
    }
    catch (error) {
      manejarError(error, 'Error al activar el recinto');
    }
  }
}
