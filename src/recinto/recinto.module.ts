import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ciudad } from '../ciudad/entities/ciudad.entity.js';
import { Concierto } from '../concierto/entities/concierto.entity.js';
import { Zona } from '../zona/entities/zona.entity.js';
import { Recinto } from './entities/recinto.entity.js';
import { RecintoController } from './recinto.controller.js';
import { RecintoService } from './recinto.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Recinto, Ciudad, Zona, Concierto])],
  controllers: [RecintoController],
  providers: [RecintoService],
})
export class RecintoModule {}
