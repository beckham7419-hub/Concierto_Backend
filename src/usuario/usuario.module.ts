import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rol } from '../roles/rol.entity.js';
import { UsuarioController } from './usuario.controller.js';
import { UsuarioService } from './usuario.service.js';
import { Usuario } from './entities/usuario.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Rol])],
  controllers: [UsuarioController],
  providers: [UsuarioService],
})
export class UsuarioModule {}
