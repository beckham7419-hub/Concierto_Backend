import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asiento } from '../asiento/entities/asiento.entity.js';
import { Recinto } from '../recinto/entities/recinto.entity.js';
import { Zona } from './entities/zona.entity.js';
import { ZonaController } from './zona.controller.js';
import { ZonaService } from './zona.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Zona, Recinto, Asiento])],
  controllers: [ZonaController],
  providers: [ZonaService],
})
export class ZonaModule {}
