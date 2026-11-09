import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asiento } from '../asiento/entities/asiento.entity.js';
import { Ciudad } from '../ciudad/entities/ciudad.entity.js';
import { Concierto } from '../concierto/entities/concierto.entity.js';
import { DetalleTicket } from '../detalle-ticket/entities/detalle-ticket.entity.js';
import { Recinto } from '../recinto/entities/recinto.entity.js';
import { Usuario } from '../usuario/entities/usuario.entity.js';
import { Zona } from '../zona/entities/zona.entity.js';
import { Ticket } from './entities/ticket.entity.js';
import { TicketController } from './ticket.controller.js';
import { TicketService } from './ticket.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket, DetalleTicket, Concierto, Recinto, Ciudad, Asiento, Zona, Usuario])],
  controllers: [TicketController],
  providers: [TicketService],
  exports: [TicketService],
})
export class TicketModule {}
