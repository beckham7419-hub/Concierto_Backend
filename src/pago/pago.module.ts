import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetodoPago } from '../metodo-pago/entities/metodo-pago.entity.js';
import { Ticket } from '../ticket/entities/ticket.entity.js';
import { TicketModule } from '../ticket/ticket.module.js';
import { Pago } from './entities/pago.entity.js';
import { PagoController } from './pago.controller.js';
import { PagoService } from './pago.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Pago, Ticket, MetodoPago]), TicketModule],
  controllers: [PagoController],
  providers: [PagoService],
})
export class PagoModule {}
