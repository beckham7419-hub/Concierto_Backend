import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { buscarActivo, soloLoQueVino } from '../common/ayudas.js';
import { manejarError } from '../common/manejar-error.js';
import { CreateMetodoPagoDto } from './dto/create-metodo-pago.dto.js';
import { UpdateMetodoPagoDto } from './dto/update-metodo-pago.dto.js';
import { MetodoPago } from './entities/metodo-pago.entity.js';

@Injectable()
export class MetodoPagoService {
  constructor(
    @InjectRepository(MetodoPago) private readonly metodosPago: Repository<MetodoPago>,
  ) {}

  private async validarNombre(nombre: string, idPropio?: number) {
    const donde = idPropio ? { nombre, id: Not(idPropio) } : { nombre };
    if (await this.metodosPago.existsBy(donde)) {
      throw new ConflictException('Ese metodo de pago ya existe');
    }
  }

  async create(dto: CreateMetodoPagoDto) {
    try {
      await this.validarNombre(dto.nombre);
      return await this.metodosPago.save(this.metodosPago.create(dto));
    }
    catch (error) {
      manejarError(error, 'Error al crear el metodo de pago');
    }
  }

  async findAll() {
    try {
      return await this.metodosPago.find({ order: { id: 'ASC' } });
    }
    catch (error) {
      manejarError(error, 'Error al obtener los metodos de pago');
    }
  }

  async findOne(id: number) {
    try {
      return await buscarActivo(this.metodosPago, id, 'Metodo de pago', false);
    }
    catch (error) {
      manejarError(error, 'Error al obtener el metodo de pago');
    }
  }

  async update(id: number, dto: UpdateMetodoPagoDto) {
    try {
      await buscarActivo(this.metodosPago, id, 'Metodo de pago', false);
      if (dto.nombre) await this.validarNombre(dto.nombre, id);
      const cambios = soloLoQueVino(dto);
      if (Object.keys(cambios).length > 0) await this.metodosPago.update({ id }, cambios);
      return await this.findOne(id);
    }
    catch (error) {
      manejarError(error, 'Error al actualizar el metodo de pago');
    }
  }

  async desactivar(id: number) {
    try {
      await buscarActivo(this.metodosPago, id, 'Metodo de pago', false);
      await this.metodosPago.update({ id }, { activo: false });
      return { ok: true };
    }
    catch (error) {
      manejarError(error, 'Error al desactivar el metodo de pago');
    }
  }

  async activar(id: number) {
    try {
      await buscarActivo(this.metodosPago, id, 'Metodo de pago', false);
      await this.metodosPago.update({ id }, { activo: true });
      return { ok: true };
    }
    catch (error) {
      manejarError(error, 'Error al activar el metodo de pago');
    }
  }
}
