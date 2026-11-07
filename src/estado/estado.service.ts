import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { buscarActivo } from '../common/ayudas.js';
import { manejarError } from '../common/manejar-error.js';
import { Estado } from './entities/estado.entity.js';

@Injectable()
export class EstadoService {
  constructor(
    @InjectRepository(Estado) private readonly estados: Repository<Estado>,
  ) {}

  async findAll() {
    try {
      return await this.estados.find({ order: { id: 'ASC' } });
    }
    catch (error) {
      manejarError(error, 'Error al obtener los estados');
    }
  }

  async findOne(id: number) {
    try {
      return await buscarActivo(this.estados, id, 'Estado', false);
    }
    catch (error) {
      manejarError(error, 'Error al obtener el estado');
    }
  }
}
