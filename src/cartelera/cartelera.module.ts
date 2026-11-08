import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Artista } from '../artista/entities/artista.entity.js';
import { Asiento } from '../asiento/entities/asiento.entity.js';
import { Ciudad } from '../ciudad/entities/ciudad.entity.js';
import { ConciertoArtista } from '../concierto-artista/entities/concierto-artista.entity.js';
import { ConciertoZona } from '../concierto-zona/entities/concierto-zona.entity.js';
import { Concierto } from '../concierto/entities/concierto.entity.js';
import { Recinto } from '../recinto/entities/recinto.entity.js';
import { Zona } from '../zona/entities/zona.entity.js';
import { CarteleraController } from './cartelera.controller.js';
import { CarteleraService } from './cartelera.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Concierto, ConciertoArtista, ConciertoZona, Recinto, Ciudad, Artista, Zona, Asiento])],
  controllers: [CarteleraController],
  providers: [CarteleraService],
})
export class CarteleraModule {}
