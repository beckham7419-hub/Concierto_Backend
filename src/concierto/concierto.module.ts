import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Artista } from '../artista/entities/artista.entity.js';
import { ConciertoArtista } from '../concierto-artista/entities/concierto-artista.entity.js';
import { ConciertoZona } from '../concierto-zona/entities/concierto-zona.entity.js';
import { Recinto } from '../recinto/entities/recinto.entity.js';
import { Zona } from '../zona/entities/zona.entity.js';
import { ConciertoController } from './concierto.controller.js';
import { ConciertoService } from './concierto.service.js';
import { Concierto } from './entities/concierto.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Concierto, ConciertoArtista, ConciertoZona, Recinto, Artista, Zona])],
  controllers: [ConciertoController],
  providers: [ConciertoService],
})
export class ConciertoModule {}
