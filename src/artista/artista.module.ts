import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConciertoArtista } from '../concierto-artista/entities/concierto-artista.entity.js';
import { Concierto } from '../concierto/entities/concierto.entity.js';
import { Genero } from '../genero/entities/genero.entity.js';
import { ArtistaController } from './artista.controller.js';
import { ArtistaService } from './artista.service.js';
import { Artista } from './entities/artista.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Artista, Genero, ConciertoArtista, Concierto])],
  controllers: [ArtistaController],
  providers: [ArtistaService],
})
export class ArtistaModule {}
