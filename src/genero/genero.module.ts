import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Artista } from '../artista/entities/artista.entity.js';
import { Genero } from './entities/genero.entity.js';
import { GeneroController } from './genero.controller.js';
import { GeneroService } from './genero.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Genero, Artista])],
  controllers: [GeneroController],
  providers: [GeneroService],
})
export class GeneroModule {}
