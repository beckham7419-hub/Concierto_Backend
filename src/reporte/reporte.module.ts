import { Module } from '@nestjs/common';
import { TicketModule } from '../ticket/ticket.module.js';
import { ReporteController } from './reporte.controller.js';
import { ReporteService } from './reporte.service.js';

@Module({
  imports: [TicketModule],
  controllers: [ReporteController],
  providers: [ReporteService],
})
export class ReporteModule {}
