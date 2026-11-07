import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Estado } from '../estado/entities/estado.entity.js';
import { MetodoPago } from '../metodo-pago/entities/metodo-pago.entity.js';
import { Rol } from '../roles/rol.entity.js';
import { Usuario } from '../usuario/entities/usuario.entity.js';
import { SeedService } from './seed.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Rol, Usuario, Estado, MetodoPago])],
  providers: [SeedService]
})
export class SeedModule {}
