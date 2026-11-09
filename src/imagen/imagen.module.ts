import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Concierto } from '../concierto/entities/concierto.entity.js';
import { Recinto } from '../recinto/entities/recinto.entity.js';
import { Imagen } from './entities/imagen.entity.js';
import { ImagenController } from './imagen.controller.js';
import { ImagenService } from './imagen.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Imagen, Recinto, Concierto])],
  controllers: [ImagenController],
  providers: [ImagenService],
})
export class ImagenModule {}
