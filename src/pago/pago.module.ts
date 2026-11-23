import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BD_TICKET } from '../constantes.js';
import { MetodoPago } from '../metodo-pago/entities/metodo-pago.entity.js';
import { Ticket } from '../ticket/entities/ticket.entity.js';
import { TicketModule } from '../ticket/ticket.module.js';
import { Pago } from './entities/pago.entity.js';
import { PagoController } from './pago.controller.js';
import { PagoService } from './pago.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([MetodoPago]), TypeOrmModule.forFeature([Pago, Ticket], BD_TICKET), TicketModule],
  controllers: [PagoController],
  providers: [PagoService],
  exports: [PagoService],
})
export class PagoModule {}
