import { Module } from '@nestjs/common';
import { TiempoRealModule } from '../tiempo-real/tiempo-real.module.js';
import { ApartadoService } from './apartado.service.js';

@Module({
  imports: [TiempoRealModule],
  providers: [ApartadoService],
  exports: [ApartadoService],
})
export class ApartadoModule {}
