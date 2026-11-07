import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Estado } from '../estado/entities/estado.entity.js';
import { CiudadController } from './ciudad.controller.js';
import { CiudadService } from './ciudad.service.js';
import { Ciudad } from './entities/ciudad.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Ciudad, Estado])],
  controllers: [CiudadController],
  providers: [CiudadService],
})
export class CiudadModule {}
